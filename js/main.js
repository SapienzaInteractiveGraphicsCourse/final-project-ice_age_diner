import { state } from './state.js';
import { buildRestaurant } from './restaurant.js';
import { loadFoodModels } from './furniture.js';
import { closeRestaurantForTheDay, getActiveCustomerCount } from './penguin.js';
import {updateClockHands} from './animations.js';

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
    const tutorialBtn = document.getElementById("tutorial-btn");
    const tutorialMenu = document.getElementById("tutorial-menu");
    const btnCloseTutorial = document.getElementById("btn-close-tutorial");
    const pauseMenu = document.getElementById("pause-menu");
    const btnResume = document.getElementById("btn-resume");
    const btnQuit = document.getElementById("btn-quit");
    const inGameVolumeSlider = document.getElementById("in-game-volume-slider");

    const startDayBtn = document.getElementById("start-day-btn");
    const timerDisplay = document.getElementById("timer-display");
    const timerValue = document.getElementById("timer-value");
    const ordersPanel = document.getElementById("orders-panel");
    const earningsDisplay = document.getElementById("earnings-display");
    const dayNumberDisplay = document.getElementById("dayNumber");

    const summaryMenu = document.getElementById("summary-menu");
    const summaryDayTitle = document.getElementById("summary-day-title");
    const summaryItemsList = document.getElementById("summary-items-list");
    const summaryTotalValue = document.getElementById("summary-total-value");
    const btnContinue = document.getElementById("btn-continue");

    let dayInterval = null;
    let closingWatcher = null;
    [gameUI, inGameSettingsBtn, pauseMenu].forEach(el => {
        if (el) el.style.zIndex = '10';
    });

    document.addEventListener("click", initAudio, {once:true});

    btnStart.addEventListener("click", function (){
        loadFoodModels();
        startMenu.classList.add("hidden");
        inGameSettingsBtn.classList.remove("hidden-panel");
        dayNumberDisplay.classList.remove("hidden-panel");
        tutorialBtn.classList.remove("hidden-panel");

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
            earningsDisplay.classList.add("hidden-panel");
            dayNumberDisplay.classList.add("hidden-panel");
            timerDisplay.classList.add("hidden-panel");
            ordersPanel.classList.add("hidden-panel");
            startDayBtn.classList.add("hidden-panel");

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

    tutorialBtn.addEventListener("click", function() {
        tutorialMenu.classList.remove("hidden-panel");

        if (!state.isPaused) {
            state.isPaused = true;
        }
    });

    btnCloseTutorial.addEventListener("click", function() {
        tutorialMenu.classList.add("hidden-panel");
        
        if (state.isPaused && pauseMenu.classList.contains("hidden-panel")) {
            state.isPaused = false;
        }
    });

    btnContinue.addEventListener("click", function(){
        summaryMenu.classList.add("hidden-panel");
        startDayBtn.classList.remove("hidden-panel");
    });

    startDayBtn.addEventListener("click", function(){
        state.dayInProgress = true;
        startDayBtn.classList.add("hidden-panel");
        timerDisplay.classList.remove("hidden-panel");
        ordersPanel.classList.remove("hidden-panel");
        state.todaysOrders = [];
        state.dayNumber += 1;
        dayNumberDisplay.textContent = "Day " + state.dayNumber;
        timerValue.textContent = "05:00";

        let currentTime = state.dayDuration;
        updateTimerDisplay(currentTime);

        // Solar cycle
        let sunProgressTime = 0;
        let lastFrameTime = performance.now();
        
        function animateSunCycle(now) {
            if (!state.dayInProgress) return; 
            
            const deltaTime = (now - lastFrameTime) / 1000;
            lastFrameTime = now;
            
            if (!state.isPaused && state.sunLight) {
                sunProgressTime += deltaTime;

                updateClockHands(sunProgressTime);
                
                let rawProgress = sunProgressTime / state.dayDuration;
                let progress = Math.min(rawProgress, 1.0);
                
                const sunAngle = progress * (Math.PI * 1.15); 
                const orbitRadius = 800;
                const orbitHeight = 400;
                const centerX = state.sunOrbitCenterX ?? 0;

                state.sunLight.position.x = centerX;
                state.sunLight.position.z = Math.cos(sunAngle) * orbitRadius;
                state.sunLight.position.y = (Math.sin(sunAngle) * orbitHeight) + 10;
                
                const colorSunriseSky = new THREE.Color(0xffe4b5);
                const colorSunriseSun = new THREE.Color(0xfff5e6);
                
                const colorHalfdaySky = new THREE.Color(0x87ceeb);
                const colorHalfdaySun = new THREE.Color(0xffffee);
                
                const colorSunsetSky = new THREE.Color(0xde6b48);
                const colorSunsetSun = new THREE.Color(0xff5500);
                
                const colorNightSky = new THREE.Color(0x0a0a1a);
                const colorNightSun = new THREE.Color(0x000000);
                
                let currentSkyColor = new THREE.Color();
                let currentSunColor = new THREE.Color();
                let sunIntensity = 0;
                let targetSpotIntensity = 0;

                if (progress < 0.25) {
                    let t = progress / 0.25;
                    currentSkyColor.lerpColors(colorSunriseSky, colorHalfdaySky, t);
                    currentSunColor.lerpColors(colorSunriseSun, colorHalfdaySun, t);
                    
                    sunIntensity = THREE.MathUtils.lerp(0.15, 1.0, t);
                    targetSpotIntensity = THREE.MathUtils.lerp(0.3, 0.05, t); 
                } 
                else if (progress < 0.75) {
                    let t = (progress - 0.25) / 0.5;
                    currentSkyColor.lerpColors(colorHalfdaySky, colorSunsetSky, t);
                    currentSunColor.lerpColors(colorHalfdaySun, colorSunsetSun, t);
                    
                    sunIntensity = THREE.MathUtils.lerp(1.0, 0.4, t);
                    targetSpotIntensity = THREE.MathUtils.lerp(0.05, 0.55, t); 
                } 
                else {
                    let t = (progress - 0.75) / 0.25;
                    currentSkyColor.lerpColors(colorSunsetSky, colorNightSky, t);
                    currentSunColor.lerpColors(colorSunsetSun, colorNightSun, t);
                    
                    sunIntensity = THREE.MathUtils.lerp(0.4, 0.0, t); 
                    targetSpotIntensity = THREE.MathUtils.lerp(0.55, 0.9, t); 
                }

                state.sunLight.color.copy(currentSunColor);
                state.sunLight.intensity = sunIntensity;
                if (state.sunMesh) {
                    state.sunMesh.position.copy(state.sunLight.position);
                    state.sunMesh.material.color.copy(currentSunColor);
                }

                const moonAngle = sunAngle + Math.PI;
                const rawMoonSin = Math.sin(moonAngle);
                const moonHeightFactor = Math.max(0, rawMoonSin);
                const moonPeakIntensity = 0.65;

                if (state.moonLight){
                    state.moonLight.position.x = centerX;
                    state.moonLight.position.z = Math.cos(moonAngle)*orbitRadius*0.6;
                    state.moonLight.position.y = (rawMoonSin*orbitHeight*0.5) + 10;
                    state.moonLight.intensity = moonHeightFactor*moonPeakIntensity;

                    if (state.moonMesh){
                        state.moonMesh.position.copy(state.moonLight.position);
                    }
                }

                if (state.spotLights && Array.isArray(state.spotLights)) {
                    state.spotLights.forEach(spot => {
                        const base = spot.userData.baseIntensity ?? 1.0;
                        spot.intensity = base*targetSpotIntensity;
                    });
                }

                if (state.starsMesh) {
                    if (progress > 0.7){
                        state.starsMesh.visible = true;
                        const starFade = (progress - 0.7) / 0.3;
                        state.starsMesh.material.opacity = starFade;
                    }
                    else{
                        state.starsMesh.material.opacity = 0;
                        state.starsMesh.visible = false;
                    }
                }

                if (state.ambientLight){
                    let ambientNight = new THREE.Color(0x0f111a);
                    state.ambientLight.color.lerpColors(currentSkyColor, ambientNight, progress>0.8 ? (progress - 0.8)/0.2 : 0);
                    state.ambientLight.intensity = THREE.MathUtils.lerp(0.6, 0.22, progress) + (moonHeightFactor * 0.18);
                }

                if (state.hemiLight){
                    state.hemiLight.color.copy(currentSkyColor);
                    state.hemiLight.intensity = THREE.MathUtils.lerp(0.35, 0.18, progress) + (moonHeightFactor * 0.1);
                }

                if (state.scene && state.scene.background && state.scene.background.isColor){
                    state.scene.background.copy(currentSkyColor);
                }
            }

            requestAnimationFrame(animateSunCycle);
        }
        
        lastFrameTime = performance.now();
        requestAnimationFrame(animateSunCycle);

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
        timerDisplay.classList.add("hidden-panel");

        closeRestaurantForTheDay();

        console.log("Day ended. Total earnings so far: $" + state.earnings);

        waitForLastCustomer();
    }

    function waitForLastCustomer(){
        if (closingWatcher) clearInterval(closingWatcher);

        closingWatcher = setInterval(function(){
            if (state.isPaused) return;
            if (getActiveCustomerCount() > 0) return;

            clearInterval(closingWatcher);
            closingWatcher = null;

            ordersPanel.classList.add("hidden-panel");
            state.orders = [];
            showEndOfDaySummary();
        }, 250);
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
        
        if (state.cashSound && state.cashSound.isPlaying) {
            state.cashSound.stop();
        }
        state.cashSound.play();
        earningsDisplay.classList.add("money-up");
        
        setTimeout(() => {
            earningsDisplay.classList.remove("money-up");
        }, 1000);
    });

    function showEndOfDaySummary() {
        
        summaryDayTitle.textContent = `End Day ${state.dayNumber}`;
        summaryItemsList.innerHTML = "";
        
        let totalDayEarnings = 0;

        state.todaysOrders.forEach(sale => {
            totalDayEarnings += sale.price;

            const row = document.createElement("div");
            row.className = "summary-item-row";

            const leftDiv = document.createElement("div");
            leftDiv.className = "summary-item-left";

            const iconContainer = document.createElement("div");
            iconContainer.className = "summary-item-icon-container";
            
            const foodKey = sale.food.toLowerCase();
            const imageBase64 = state.foodIcons[foodKey] || state.foodIcons[sale.food];
            
            if (imageBase64) {
                const imgElement = document.createElement("img");
                imgElement.src = imageBase64;
                
                imgElement.style.width = "45px";
                imgElement.style.height = "45px";
                imgElement.style.objectFit = "contain";
                imgElement.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                imgElement.style.borderRadius = "6px";
                imgElement.style.display = "block";
                
                iconContainer.appendChild(imgElement);
            }

            const nameSpan = document.createElement("span");
            nameSpan.className = "summary-item-name";
            nameSpan.textContent = sale.food;

            leftDiv.appendChild(iconContainer);
            leftDiv.appendChild(nameSpan);

            const priceSpan = document.createElement("span");
            priceSpan.className = "summary-item-price";
            priceSpan.textContent = `+$${sale.price}`;

            row.appendChild(leftDiv);
            row.appendChild(priceSpan);

            summaryItemsList.appendChild(row);
        });

        summaryTotalValue.textContent = totalDayEarnings;
        summaryMenu.classList.remove("hidden-panel");
    }
});

function initAudio(){
    if (audioInitialized) return;

    state.audioListener = new THREE.AudioListener();
    if (state.camera) state.camera.add(state.audioListener);

    menuSound = new THREE.Audio(state.audioListener);
    gameSound = new THREE.Audio(state.audioListener);
    state.cashSound = new THREE.Audio(state.audioListener);
    state.customerCallingSound = new THREE.Audio(state.audioListener);
    state.foodReadySound = new THREE.Audio(state.audioListener);
    state.openingDoorSound = new THREE.Audio(state.audioListener);
    state.puttingPlateSound = new THREE.Audio(state.audioListener);

    const audioLoader = new THREE.AudioLoader();
    const currentVolume = document.getElementById("volume-slider").value/100;

    audioLoader.load("audio/menu_theme.mp3", function(buffer){
        menuSound.setBuffer(buffer);
        menuSound.setLoop(true);
        menuSound.setVolume(currentVolume * 0.7);

        if (!gameStarted) menuSound.play();
    });

    audioLoader.load("audio/restaurant_theme.mp3", function(buffer){
        gameSound.setBuffer(buffer);
        gameSound.setLoop(true);
        gameSound.setVolume(currentVolume * 0.2); 

        if (gameStarted && !gameSound.isPlaying) gameSound.play();
    });

    audioLoader.load("audio/cash.mp3", function(buffer){
        state.cashSound.setBuffer(buffer);
        state.cashSound.setVolume(currentVolume);
        state.cashSound.setLoop(false);
    });

    audioLoader.load("audio/customer_calling.mp3", function(buffer){
        state.customerCallingSound.setBuffer(buffer);
        state.customerCallingSound.setVolume(currentVolume);
        state.customerCallingSound.setLoop(false);
    });

    audioLoader.load("audio/food_ready.mp3", function(buffer){
        state.foodReadySound.setBuffer(buffer);
        state.foodReadySound.setVolume(currentVolume);
        state.foodReadySound.setLoop(false);
    });

    audioLoader.load("audio/opening_door.mp3", function(buffer){
        state.openingDoorSound.setBuffer(buffer);
        state.openingDoorSound.setVolume(currentVolume);
        state.openingDoorSound.setLoop(false);
    });

    audioLoader.load("audio/putting_plate_on_table.mp3", function(buffer){
        state.puttingPlateSound.setBuffer(buffer);
        state.puttingPlateSound.setVolume(currentVolume);
        state.puttingPlateSound.setLoop(false);
    });

    audioInitialized = true;
}