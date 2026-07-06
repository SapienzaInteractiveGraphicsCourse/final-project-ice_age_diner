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
    menu: [{'name': 'hamburger', 'price': 10}, {'name': 'pizza', 'price': 12}, {'name': 'hotdog', 'price': 8}, {'name': 'taco', 'price': 9}, {'name': 'fish', 'price': 15}], //ADD MORE FOOD
    foodIcons:{},
    models:{},
    penguins_name: ["Pingu", "Kowalski", "Rico", "Skipper", "Soldato", "Gunter", "Cody", "Mumble", "Flipper"], // ADD MORE NAMES IF YOU WANT

    //SOUNDS
    cashSound: null,
    closingDoorSound: null,
    customerCallingSound: null,
    foodReadySound: null,
    openingDoorSound: null,
    puttingPlateSound: null

};