// Object that constains all the global variables used across the files
export const state = {
    scene: null,
    camera: null,
    renderer: null,
    gameControls: null,

    isPaused: false,

    audioListener: null,

    someone_is_leaving : false,

    colliders: [],
    icebergs: [],
    orders: [],
    platesOnCounter: [],
    menu: ['hamburger', 'pizza', 'hotdog', 'taco', 'fish'], //ADD MORE FOOD
    models:{}
};