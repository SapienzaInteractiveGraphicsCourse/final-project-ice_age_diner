# Ice Age Diner
*Master's Degree in Artificial Intelligence and Robotics – Sapienza University of Rome*   
**Interactive Graphics 2025/2026 Final Project** 

---

## Play the Game
The game is deployed and fully playable directly from your browser via GitHub Pages:  
**[Play Ice Age Diner Here!](https://sapienzainteractivegraphicscourse.github.io/final-project-ice_age_diner/)**

---

## Project Overview
**Ice Age Diner** is an interactive 3D simulation and restaurant management game inspired by the classic mechanics of *Penguin Diner*. Set in a stylized, low-poly glacial environment, the player assumes the role of a penguin waiter tasked with managing a busy restaurant.

The hierarchical model of the penguins, the animations, the interactions and other key aspects of the project are implemented with **Three.js** and **Tween.js**. The 3D models of the food and the furniture are downloaded from many online sources and loaded with the **THREE.GLTFLoader.js** framework. The background music and most of the sound effects are taken from the original *Penguin Diner*.

### Gameplay Loop
1. **Seat Customers**: Guide incoming penguin customers from the queue to available dining tables.
2. **Take Orders**: Retrieve orders from seated guests and dispatch them automatically to the autonomous Chef penguin in the kitchen.
3. **Deliver Food**: Pick up prepared dishes from the kitchen counter and serve them to the respective tables before the customers' patience runs out.
4. **Clear Tables & Wash**: Collect dirty dishes, stack them if needed, and place them on the washing counter where an autonomous dishwasher penguin cleans them.

---

## Controls & Interactions
The game utilizes a hybrid input scheme designed for fluid spatial management:
* **Character Movement (Keyboard)**: Use `W`, `A`, `S`, `D` keys to navigate the waiter penguin. Press the `Space bar` to walk faster.
* **Camera settings**: `Right Click and Drag` to change the view. Use the `Scroll wheel` to zoom in or out.
* **Actions & Operations (Left Click)**: 
    * Click on a waiting customer, then click an empty seat to direct them.
    * Click a seated customer showing an exclamation status to take their order.
    * Click on the ready food at the kitchen counter to pick it up, then click the target table to serve.
    * Click on empty plates to clear tables and stack them, then click the dishwashing tray to unload.

A custom collision detection system avoids penguin clashes and prevents passing through walls, tables, and kitchen counters.

---

## Project Structure
Below is the organizational tree of the application codebase and asset repository:

```text
.
├── audio/
│   └── *.mp3
├── css/
│   └── styles.css
├── fonts/
│   └── IceAgeMovie.otf
├── js/
│   ├── animation.js
│   ├── collisions.js
│   ├── controlWaiter.js
│   ├── environment.js
│   ├── furniture.js
│   ├── interactions.js
│   ├── main.js
│   ├── penguin.js
│   ├── restaurant.js
│   ├── state.js
├── models/
│   ├── food/
│   │   └── *.glb
│   └── furniture/
│       └── *.glb
├── textures/
│   ├── *.png
│   └── *.jpg
├── index.html
├── README.md
└── report_ice_age_diner.pdf
