// Object that constains all the global variables used across the files
export const state = {
    scene: null,
    camera: null,
    renderer: null,
    gameControls: null,

    isPaused: false,
    dayInProgress: false,
    dayDuration: 300, // 5 minutes
    earnings: 0,

    audioListener: null,

    someone_is_leaving : false,

    colliders: [],
    icebergs: [],
    orders: [],
    heldFood: null,
    platesOnCounter: [],
    menu: ['hamburger', 'pizza', 'hotdog', 'taco', 'fish'], //ADD MORE FOOD
    foodIcons:{},
    models:{},
    penguins_name: ["Pingu", "kowalski", "Rico", "Skipper", "Soldato", "Gunter", "Cody", "Mumble", "Flipper"] // ADD MORE NAMES IF YOU WANT
};