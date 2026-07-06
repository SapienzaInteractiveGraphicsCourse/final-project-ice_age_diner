import { state } from './state.js';
import { buildRestaurant } from './restaurant.js';
import { loadFoodModels } from './furniture.js';
import { penguins } from './penguin.js';

let gameStarted = false;
let menuSound, gameSound;
let audioInitialized = false;

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

    const startDayBtn = document.getElementById("start-day-btn");
    const timerDisplay = document.getElementById("timer-display");
    const timerValue = document.getElementById("timer-value");
    const ordersPanel = document.getElementById("orders-panel");
    const earningsDisplay = document.getElementById("earnings-display");

    let dayInterval = null;
    [gameUI, inGameSettingsBtn, pauseMenu].forEach(el => {
        if (el) el.style.zIndex = '10';
    });

    document.addEventListener("click", initAudio, {once:true});

    btnStart.addEventListener("click", function (){
        loadFoodModels();
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
            setInterval(updateOrdersUI, 200);
            setInterval(updateEarningsUI, 200);

        }
        console.log("Game started successfully!");

        startDayBtn.classList.remove("hidden-panel");
        state.dayInProgress = false;
        earningsDisplay.classList.remove("hidden-panel");

        function togglePause(){
            if (!gameStarted) return;

            state.isPaused = !state.isPaused;
            if (state.isPaused){
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

    startDayBtn.addEventListener("click", function(){
        state.dayInProgress = true;
        startDayBtn.classList.add("hidden-panel");
        timerDisplay.classList.remove("hidden-panel");
        ordersPanel.classList.remove("hidden-panel");
        timerValue.textContent = "05:00";

        let currentTime = state.dayDuration;
        updateTimerDisplay(currentTime);

        dayInterval = setInterval(function(){
            if (!state.isPaused){
                currentTime --;
                updateTimerDisplay(currentTime);
                
                if (currentTime <= 0){
                    clearInterval(dayInterval);
                    endDay();
                }
            }
        }, 1000);

    });

    //Volume control
    volumeSlider.addEventListener("input", function(e){
        const volumeValue = e.target.value/100;
        if (menuSound) menuSound.setVolume(volumeValue);
        if (gameSound) gameSound.setVolume(volumeValue);
    })

    function updateTimerDisplay(timeInSeconds){
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function endDay(){
        state.dayInProgress = false;
        startDayBtn.classList.remove("hidden-panel");
        timerDisplay.classList.add("hidden-panel");
        ordersPanel.classList.add("hidden-panel");
        penguins.forEach(p => {
            if (p.mesh){
                const pen = p.mesh;
                if (pen.userData.role === 'customer'){
                    pen.userData.state = 'LEAVING';
                }
            }
        });
        state.orders = [];
        console.log("Day ended. Total earnings: $" + state.earnings);
    }

    function updateOrdersUI() {
        const container = document.getElementById("orders-container");
        if (!container) return;

        if (state.orders.length === 0) {
            container.innerHTML = "<p style='text-align: center; color: #ccc;'>No orders at the moment.</p>";
            return;
        }

        container.innerHTML = ""; 

        state.orders.forEach(order => {
            const customer = order.customer;
            const foodName = order.food;
            const customerName = customer.userData.nameTag || 'Customer';
            const imgSrc = state.foodIcons[foodName.toLowerCase()] || ''; 

            if (!customer.userData.maxTimer) {
                customer.userData.maxTimer = customer.userData.timer || 1500; 
            }

            const maxTime = customer.userData.maxTimer;
            const timeLeft = customer.userData.timer || 0;

            let percent = (timeLeft / maxTime) * 100;
            percent = Math.max(0, Math.min(100, percent)); 
            
            let barColor = "#4ade80"; 
            if (percent < 50) barColor = "#facc15"; 
            if (percent < 25) barColor = "#ef4444"; 

            const card = document.createElement("div");
            let cardClass = "order-card";
            
            if (state.heldFood && state.heldFood.toLowerCase() === foodName.toLowerCase()) {
                cardClass += " status-held";
            } 
            else if (order.status === 'ready') {
                cardClass += " status-ready";
            } 
            else {
                cardClass += " status-pending";
            }
            
            card.className = cardClass;
            
            card.innerHTML = `
                <div class="order-header">
                    <span style="font-weight: bold;"> ${customerName}</span>
                    <span class="order-food" style="display: flex; align-items: center; gap: 15px; font-weight: bold;">
                        <img src="${imgSrc}" alt="${foodName}" style="width: 60px; height: 60px; object-fit: contain; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.8)) brightness(1.2);">
                    </span>
                </div>
                <div class="order-progress-bg">
                    <div class="order-progress-bar" style="width: ${percent}%; background-color: ${barColor};"></div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }

    function updateEarningsUI() {
        earningsDisplay.textContent = "Profit: $" + state.earnings;
    }

    window.addEventListener("earningsUpdated", function() {
        updateEarningsUI();
        
        earningsDisplay.classList.add("money-up");
        
        setTimeout(() => {
            earningsDisplay.classList.remove("money-up");
        }, 1000);
    });


});

function initAudio(){
    if (audioInitialized) return;

    state.audioListener = new THREE.AudioListener();
    if (state.camera) state.camera.add(state.audioListener);

    menuSound = new THREE.Audio(state.audioListener);
    gameSound = new THREE.Audio(state.audioListener);

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

