//global variables
let scene, camera, renderer
let gameStarted = false;

document.addEventListener("DOMContentLoaded", function (){
    //Menu buttons
    const btnStart = document.getElementById("btn-start");
    const btnSettings = document.getElementById("btn-settings");
    const btnBack = document.getElementById("btn-back");

    const startMenu = document.getElementById("start-menu");
    const gameUI = document.getElementById("game-ui");
    const mainMenuContent = document.getElementById("main-menu-content");
    const settingsPanel = document.getElementById("settings-panel");

    btnStart.addEventListener("click", function (){
        startMenu.classList.add("hidden");
        //gameUI.classList.add("visible");

        //to avoid starting the game multiple times
        if (!gameStarted) {
            buildRestaurant();
            gameStarted = true;
        }
        console.log("Game started successfully!");
    });

    btnSettings.addEventListener("click", function(){
        mainMenuContent.classList.add("hidden-panel");
        settingsPanel.classList.remove("hidden-panel");
    });

    btnBack.addEventListener("click", function(){
        settingsPanel.classList.add("hidden-panel");
        mainMenuContent.classList.remove("hidden-panel");
    });
});

