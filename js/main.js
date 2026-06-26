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

    camera.position.set(0, 10, 30); 
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    //renderer behind the UI elements
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1'; 
    renderer.domElement.style.pointerEvents = 'auto';
    
    document.body.appendChild(renderer.domElement);

    const width = 60;  
    const depth = 50; 
    const height = 15;
    const thickness = 1;

    const divisorWallX = -12;
    const kitchenWidth = (width/2) + divisorWallX;
    const mainRoomWidth = (width/2) - divisorWallX;
    
    const counterThickness = 0.3;
    const counterWidth = 3; 
    const counterDepth = 26;

    const depthSepWalls = (depth - counterDepth) / 2;

    const textureLoader = new THREE.TextureLoader();

    const iceFloorTexture = new THREE.TextureLoader().load('textures/ice_texture.jpg');

    const iceWallTexture = new THREE.TextureLoader().load('textures/ice_wall.jpg');

    iceFloorTexture.wrapS = THREE.RepeatWrapping;
    iceFloorTexture.wrapT = THREE.RepeatWrapping;
    iceFloorTexture.repeat.set(15, 12);

    iceWallTexture.wrapS = THREE.RepeatWrapping;
    iceWallTexture.wrapT = THREE.RepeatWrapping;
    iceWallTexture.repeat.set(12, 3);

    const floorGeometry = new THREE.BoxGeometry(width, thickness, depth);

    const floorMaterial = new THREE.MeshStandardMaterial({ map: iceFloorTexture, roughness: 0.2, metalness: 0.1 }); 

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    floor.position.y = -thickness / 2; 

    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ map: iceWallTexture, roughness: 0.2, metalness: 0.1 });

    const sideWallGeometry = new THREE.BoxGeometry(thickness, height, depth);

    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width / 2, height / 2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width / 2, height / 2, 0);
    scene.add(rightWall);

    const kitchenBackWall = new THREE.Mesh(new THREE.BoxGeometry(kitchenWidth, height, thickness), wallMaterial);
    kitchenBackWall.position.set(-(width / 2) + (kitchenWidth / 2), height / 2, -depth / 2);
    scene.add(kitchenBackWall);

    const lowBack = new THREE.Mesh(new THREE.BoxGeometry(mainRoomWidth, 3, thickness), wallMaterial);
    lowBack.position.set(divisorWallX + (mainRoomWidth / 2), 1.5, -depth / 2);
    scene.add(lowBack);

    const highBack = new THREE.Mesh(new THREE.BoxGeometry(mainRoomWidth, 2, thickness), wallMaterial);
    highBack.position.set(divisorWallX + (mainRoomWidth / 2), height - 1, -depth / 2);
    scene.add(highBack);

    const column = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, thickness), wallMaterial);
    column.position.set(divisorWallX + (mainRoomWidth / 2), height / 2, -depth / 2);
    scene.add(column);

    /*const backDivisor = new THREE.Mesh(new THREE.PlaneGeometry(depthSepWalls, height), wallMaterial);
    backDivisor.position.set(divisorWallX, height / 2, -(depth / 2) + (depthSepWalls / 2));
    backDivisor.rotation.y = Math.PI / 2;
    scene.add(backDivisor);

    const frontDivisor = new THREE.Mesh(new THREE.PlaneGeometry(depthSepWalls, height), wallMaterial);
    frontDivisor.position.set(divisorWallX, height / 2, (depth / 2) - (depthSepWalls / 2));
    frontDivisor.rotation.y = Math.PI / 2;
    scene.add(frontDivisor);*/
    
    const divisorLowWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, 3.5), wallMaterial);
    divisorLowWall.position.set(divisorWallX, 3.5 / 2, 0);
    divisorLowWall.rotation.y = Math.PI / 2;
    scene.add(divisorLowWall);

    const divisorHighWall = new THREE.Mesh(new THREE.PlaneGeometry(depth, 2), wallMaterial);
    divisorHighWall.position.set(divisorWallX, height - (2 / 2), 0);
    divisorHighWall.rotation.y = Math.PI / 2;
    scene.add(divisorHighWall);

    const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.3, metalness: 0.5 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(counterWidth, counterThickness, depth), counterMaterial);
    counter.position.set(divisorWallX, 3.5 + (counterThickness / 2), 0);
    scene.add(counter);

    const ceilingGeometry = new THREE.PlaneGeometry(width, depth);
    const ceilingMaterial = new THREE.MeshStandardMaterial({ 
        map: iceFloorTexture, 
        roughness: 0.2, 
        metalness: 0.1
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);

    ceiling.rotation.x = Math.PI / 2; 
    ceiling.position.y = height; 
    scene.add(ceiling);

    //lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);

    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    controls.minDistance = 5; 
    controls.maxDistance = 45; 

    controls.enablePan = true;
    controls.screenSpacePanning = true;
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

    camera.aspect = aspect;
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight);
}