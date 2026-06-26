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
            startGame();
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

function startGame() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.set(0, 15, 18); 
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    //renderer behind the UI elements
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1'; 
    
    document.body.appendChild(renderer.domElement);

    const width = 40;  
    const depth = 40; 
    const height = 12;
    const thickness = 1;

    const kitchenWidth = 14;
    const mainRoomWidth = 26;
    const divisorWallX = -6;

    const floorGeometry = new THREE.BoxGeometry(width, thickness, depth);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc }); 

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    floor.position.y = -thickness / 2; 

    scene.add(floor);

    const materialMuri = new THREE.MeshStandardMaterial({ color: 0x88ccff });

    const sideWallGeometry = new THREE.BoxGeometry(thickness, height, depth);

    const leftWall = new THREE.Mesh(sideWallGeometry, materialMuri);
    leftWall.position.set(-width / 2, height / 2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, materialMuri);
    rightWall.position.set(width / 2, height / 2, 0);
    scene.add(rightWall);

    const kitchenBackWall = new THREE.Mesh(new THREE.BoxGeometry(kitchenWidth, height, thickness), materialMuri);
    kitchenBackWall.position.set(-20 + (kitchenWidth / 2), height / 2, -depth / 2);
    scene.add(kitchenBackWall);

    const lowBack = new THREE.Mesh(new THREE.BoxGeometry(mainRoomWidth, 3, thickness), materialMuri);
    lowBack.position.set(divisorWallX + (mainRoomWidth / 2), 1.5, -depth / 2);
    scene.add(lowBack);

    const highBack = new THREE.Mesh(new THREE.BoxGeometry(mainRoomWidth, 2, thickness), materialMuri);
    highBack.position.set(divisorWallX + (mainRoomWidth / 2), height - 1, -depth / 2);
    scene.add(highBack);

    const column = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), materialMuri);
    column.position.set(divisorWallX + (mainRoomWidth / 2), height / 2, -depth / 2);
    scene.add(column);

    const backDivisor = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, 10), materialMuri);
    backDivisor.position.set(divisorWallX, height / 2, -15);
    scene.add(backDivisor);

    const frontDivisor = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, 10), materialMuri);
    frontDivisor.position.set(divisorWallX, height / 2, 15);
    scene.add(frontDivisor);
    
    const divisorLowWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, 3.5, 20), materialMuri);
    divisorLowWall.position.set(divisorWallX, 3.5 / 2, 0);
    scene.add(divisorLowWall);

    const divisorHighWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, 5, 20), materialMuri);
    divisorHighWall.position.set(divisorWallX, height - (3 / 2), 0);
    scene.add(divisorHighWall);

    //lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    controls.minDistance = 10; 
    controls.maxDistance = 40; 

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    window.gameControls = controls;
    window.addEventListener('resize', onWindowResize, false);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    if (window.gameControls) {
        window.gameControls.update();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const viewSize = 35; 

    camera.left = (viewSize * aspect) / -2;
    camera.right = (viewSize * aspect) / 2;
    camera.top = viewSize / 2;
    camera.bottom = viewSize / -2;

    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight);
}