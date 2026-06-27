//global variables
var scene, camera, renderer
var gameStarted = false;
var audioListener, menuSound, gameSound;
var audioInitialized = false;
var isPaused = false;

document.addEventListener("DOMContentLoaded", function (){
    //Menu buttons
    const btnStart = document.getElementById("btn-start");
    const btnSettings = document.getElementById("btn-settings");
    const btnBack = document.getElementById("btn-back");
    const volumeSlider = document.getElementById("volume-slider");

    const startMenu = document.getElementById("start-menu");
    const gameUI = document.getElementById("game-ui");
    const mainMenuContent = document.getElementById("main-menu-content");
    const settingsPanel = document.getElementById("settings-panel");

    const inGameSettingsBtn = document.getElementById("in-game-settings-btn");
    const pauseMenu = document.getElementById("pause-menu");
    const btnResume = document.getElementById("btn-resume");
    const btnQuit = document.getElementById("btn-quit");
    const inGameVolumeSlider = document.getElementById("in-game-volume-slider");

    document.addEventListener("click", initAudio, {once:true});

    btnStart.addEventListener("click", function (){
        startMenu.classList.add("hidden");
        //gameUI.classList.add("visible");
        inGameSettingsBtn.classList.remove("hidden-panel");

        //to avoid starting the game multiple times
        if (!gameStarted) {

            if (menuSound && menuSound.isPlaying){
                menuSound.stop();
            }
            if (gameSound && !gameSound.isPlaying && gameSound.buffer){
                gameSound.play();
            }

            buildRestaurant();
            gameStarted = true;
        }
        console.log("Game started successfully!");

        function togglePause(){
            if (!gameStarted) return;

            isPaused = !isPaused;
            if (isPaused){
                pauseMenu.classList.remove("hidden-panel");
            }
            else{
                pauseMenu.classList.add("hidden-panel");
            }
        }

        inGameSettingsBtn.addEventListener("click", togglePause);
        btnResume.addEventListener("click", togglePause);

        document.addEventListener("keydown", function(e){
            if (e.key=="Escape") togglePause();
        });

        btnQuit.addEventListener("click", function(){
            btnQuit.style.pointerEvents = "none";

            pauseMenu.classList.add("hidden-panel");
            inGameSettingsBtn.classList.add("hidden-panel");

            startMenu.classList.remove("hidden");

            setTimeout(function(){
                window.location.reload();
            }, 800)
        });

        inGameVolumeSlider.addEventListener("input", function(e){
            const volumeValue = e.target.value/100;
            if (menuSound) menuSound.setVolume(volumeValue);
            if (gameSound) gameSound.setVolume(volumeValue);
            document.getElementById("volume-slider").value = e.target.value;
        })
    });

    btnSettings.addEventListener("click", function(){
        mainMenuContent.classList.add("hidden-panel");
        settingsPanel.classList.remove("hidden-panel");
    });

    btnBack.addEventListener("click", function(){
        settingsPanel.classList.add("hidden-panel");
        mainMenuContent.classList.remove("hidden-panel");
    });

    //Volume control
    volumeSlider.addEventListener("input", function(e){
        const volumeValue = e.target.value/100;
        if (menuSound) menuSound.setVolume(volumeValue);
        if (gameSound) gameSound.setVolume(volumeValue);
    })
});

function initAudio(){
    if (audioInitialized) return;

    audioListener = new THREE.AudioListener();
    if (camera) camera.add(audioListener);

    menuSound = new THREE.Audio(audioListener);
    gameSound = new THREE.Audio(audioListener);

    const audioLoader = new THREE.AudioLoader();
    const currentVolume = document.getElementById("volume-slider").value/100;

    audioLoader.load("audio/menu_theme.mp3", function(buffer){
        menuSound.setBuffer(buffer);
        menuSound.setLoop(true);
        menuSound.setVolume(currentVolume);

        if (!gameStarted) menuSound.play();
    });

    audioLoader.load("audio/restaurant_theme.mp3", function(buffer){
        gameSound.setBuffer(buffer);
        gameSound.setLoop(true);
        gameSound.setVolume(currentVolume);

        if (gameStarted && !gameSound.isPlaying) gameSound.play();
    });
    
    audioInitialized = true;
}