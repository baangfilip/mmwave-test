# mmwave-test
The aim with the this project was to learn a little bit of three.js and radar with mmwave-sensor and its capablities, as they are frequently used in research papers. All in the constraints of having no real time to do it.

<img alt="PoC gif, person walking in front of sensor and the laptop screen shows how the sensor picks it up" src="readme_media/output.gif" width=300/>
Above there is gif that show the PoC in action. As you can see it detects a person walking around pretty good inside a marked field of view for corresponding to the radars current settings.

This is a very basic use, it doesn't take advantage of some more advanced features (as it only uses point detection and not object detection) provided by the TI mmWave sensor or use any type of AI to recognize the type of object, yet.
<img alt="Attached the mmWave and pi5 to a toy car (future self-driving project maybe" src="readme_media/IMG_1870.png" width=300/>

## GUI (threejs)
install dependencies with `pnpm install`
start with `pnpm vite dev`
### Drones flight and radarFov
This code is mostly happily provided by chatGPT. 
## API
### Dev setup with uv
install dependencies with `uv sync`
start with `uv run python main.py`
### radar_config.cfg
Change it easiest with the TI provided tool out-of-box demo, and after that update the params for the radarFOV creation. 

# 3D models and textures
## 3D models
Ambulance Car by Zsky [CC-BY] via Poly Pizza
Drone by Silly Fear [CC-BY] via Poly Pizza
Drone by NateGazzard [CC-BY] via Poly Pizza
Flat Screen TV by Alex Safayan [CC-BY] via Poly Pizza
## Ground and horizon 
https://polyhaven.com/a/brown_mud_leaves_01 Rocky Terrain 02 by Rob Tuytel
https://polyhaven.com/a/bambanani_sunset Bambanani Sunset by Dimitrios Savva and Jarod Guest

