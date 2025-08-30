import serial
import serial.tools.list_ports
import struct
import time
import asyncio
import json
import websockets
import struct

DEBUG = False
CONFIG_FILE = "radar_config.cfg"
# Magic word used by mmwDemo
RADAR_FRAME_START= b'\x02\x01\x04\x03\x06\x05\x08\x07'

# Auto detect ports in dev, since its easier
def detect_ports():
    ports = list(serial.tools.list_ports.comports())

    usb_ports = [p for p in ports if "usbserial" in p.device or "USB" in p.device]

    if len(usb_ports) < 2:
        raise RuntimeError(f"No mmWave connected")
    
    if len(usb_ports) > 2:
        raise RuntimeError(f"To many devices connected, cannot auto pick device")
    
    if usb_ports[0].device.endswith("1"):
        data_port = usb_ports[0].device
        cli_port = usb_ports[1].device
    else:
        cli_port = usb_ports[0].device
        data_port = usb_ports[1].device


    if(DEBUG):
        print(f"CLI UART: {cli_port}")
        print(f"Data UART: {data_port}")
    return cli_port, data_port

# Send config to mmWave device
def send_config(cli_port):
    ser_cli = serial.Serial(cli_port, 115200)
    time.sleep(0.5)
    with open(CONFIG_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('%'):
                ser_cli.write((line + '\n').encode())
                time.sleep(0.05)
    ser_cli.close()
    print("Config sent")

# parse data/frames

def parse_frame(ser):
    """Parses one mmWave UART frame from the IWR6843 device."""

    # Sync to magic word / radar frame sequence
    sync = ser.read(8)
    while sync != RADAR_FRAME_START:
        sync = sync[1:] + ser.read(1)
        if len(sync) < 8:
            return {"points": [], "tracked": []}

    # Read frame header, 40 bytes (including magic word)
    header = ser.read(32)
    if len(header) < 32:
        return {"points": [], "tracked": []}

    (version, totalPacketLen, platform, frameNumber, timeCpuCycles,
     numDetectedObj, numTLVs, subFrameNumber) = struct.unpack('<IIIIIIII', header)

    # Read payload 
    payload_len = totalPacketLen - 40  # exclude magic+header
    payload = ser.read(payload_len)
    if len(payload) < payload_len:
        return {"points": [], "tracked": []}

    points = []
    side_info = []
    tracked = []

    offset = 0
    # tlv, type, length, value
    for _ in range(numTLVs):
        if offset + 8 > len(payload):
            break

        # TLV Header (8 bytes) (type, length)
        tlvType, tlvLen = struct.unpack_from('<II', payload, offset)
        offset += 8

        if(DEBUG):
            print(f"tlvType: {tlvType}")

        # TLV Payload 
        tlvPayload = payload[offset:offset+tlvLen]
        offset += tlvLen

        # type1: Detected Points
        if tlvType == 1:
            num_points = tlvLen // 16
            for i in range(num_points):
                start = i * 16
                x, y, z, doppler = struct.unpack_from('<ffff', tlvPayload, start)
                points.append({
                    "x": x, "y": y, "z": z, "doppler": doppler
                })

        # type7: Side Info (SNR & noise)
        elif tlvType == 7:
            num_points = tlvLen // 4
            for i in range(num_points):
                snr, noise = struct.unpack_from('<HH', tlvPayload, i * 4)
                side_info.append({
                    "snr": snr / 10.0,  # dB
                    "noise": noise / 10.0  # dB
                })

        # type1010: TrackerProc 3D Target List 
        elif tlvType == 1010:
            num_objs = tlvLen // 112
            for i in range(num_objs):
                start = i * 112
                data = struct.unpack_from('<I fff fff fff 16f f f', tlvPayload, start)
                tid = data[0]
                posX, posY, posZ = data[1:4]
                velX, velY, velZ = data[4:7]
                accX, accY, accZ = data[7:10]
                confidence = data[-1]
                tracked.append({
                    "tid": tid,
                    "x": posX, "y": posY, "z": posZ,
                    "vx": velX, "vy": velY, "vz": velZ,
                    "ax": accX, "ay": accY, "az": accZ,
                    "confidence": confidence
                })

    # Merge side_info into points if lengths match
    if side_info and len(side_info) == len(points):
        for p, s in zip(points, side_info):
            p.update(s)

    return {"points": points, "tracked": tracked}

#publish points and objects on a websocket
async def radar_stream(websocket):
    cli_port, data_port = detect_ports()
    send_config(cli_port)

    ser_data = serial.Serial(data_port, 921600, timeout=1)
    print("Listening on mmWave device")

    while True:
        frame = parse_frame(ser_data)        
        if frame["tracked"] or frame["points"]:
            message = {
                "tracked": frame["tracked"],
                "points": frame["points"]
            }
            await websocket.send(json.dumps(message))

        if(DEBUG):
            for p in frame["points"]:
                print(f"[POINT] x={p['x']:.2f}, y={p['y']:.2f}, z={p['z']:.2f}, doppler={p['doppler']:.2f}, snr={p.get('snr', 'NA')}")

            for t in frame["tracked"]:
                print(f"[TRACKED] id={t['tid']} x={t['x']:.2f} y={t['y']:.2f} z={t['z']:.2f} conf={t['confidence']:.1f}")
            

async def main():
    print("WebSocket server at ws://localhost:8765")
    async with websockets.serve(radar_stream, "0.0.0.0", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())