import { state } from './state.js';
import { setupInteractions } from './interactions.js';
import { spawnPenguin, KITCHEN_POS, updateRoutines } from './penguin.js';
import { setupControls, updateMovement } from './controlWaiter.js';
import { loadDoor, loadFurniture, createWindowFrame } from './furniture.js';
import { loadEnvironment } from './environment.js';
import { animateIcebergs, updateTweens } from './animations.js';

export function buildRestaurant() {
    state.colliders = [];
    state.icebergs = [];

    // Creation of the scene, camera, and renderer
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x87ceeb);

    state.camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);

    const scene = state.scene;
    const camera = state.camera;

    // View to the room
    camera.position.set(0, 20, 35);
    camera.lookAt(0, 0, 0);

    if (state.audioListener) camera.add(state.audioListener);

    // Render shadow setup
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    const renderer = state.renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'auto';

    document.body.appendChild(renderer.domElement);

    setupInteractions(camera, scene);

    // Variables for restaurant dimensions
    const width = 160;
    const depth = 90;
    const height = 30;
    const thickness = 1;

    const divisorWallX = -40;
    const kitchenWidth = (width/2) + divisorWallX;
    const mainRoomWidth = (width/2) - divisorWallX;

    const counterThickness = 1;
    const counterWidth = 8.0;
    const counterDepth = 44;

    const depthSepWalls = (depth - counterDepth)/2;
    const divisorWallThickness = 5;
    const textureLoader = new THREE.TextureLoader();

    const iceFloorTexture = textureLoader.load('textures/Fabric081B_1K-JPG_Color.jpg');
    iceFloorTexture.wrapS = THREE.RepeatWrapping;
    iceFloorTexture.wrapT = THREE.RepeatWrapping;
    iceFloorTexture.repeat.set(6, 5);

    // One texture for every wall
    const WALL_TILE = 10;
    const iceWallTexture = textureLoader.load('textures/Tiles019_1K-JPG_Color.jpg');
    iceWallTexture.wrapS = THREE.RepeatWrapping;
    iceWallTexture.wrapT = THREE.RepeatWrapping;
    iceWallTexture.repeat.set(1, 1);

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: iceWallTexture,
        roughness: 0.2,
        metalness: 0.1
    });

    function applyContinuousUVs(geom){
        geom.computeVertexNormals();
        const pos = geom.attributes.position;
        const uv = geom.attributes.uv;
        const norm = geom.attributes.normal;

        if (!uv || !pos || !norm) return;

        for (let i = 0; i < pos.count; i++){
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);

            const nx = Math.abs(norm.getX(i));
            const ny = Math.abs(norm.getY(i));

            if (nx > 0.5){
                uv.setXY(i, z/WALL_TILE, y/WALL_TILE);
            }
            else if (ny > 0.5){
                uv.setXY(i, x/WALL_TILE, z/WALL_TILE);
            }
            else{
                uv.setXY(i, x/WALL_TILE, y/WALL_TILE);
            }
        }
        uv.needsUpdate = true;
    }

    const floorGeometry = new THREE.BoxGeometry(width + 0.5, thickness, depth + 0.5);
    const floorMaterial = new THREE.MeshPhysicalMaterial({
        map: iceFloorTexture,
        roughness: 0.2,
        metalness: 0.0,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15
        /*transmission: 0.3,
        ior: 1.31,
        thickness: 2.0*/
    });

    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -thickness/2;
    floor.receiveShadow = true;
    scene.add(floor);

    //function for adding a reflective floor IT'S TO POWERFUL, NEED TO BE FIXED
    //addReflectiveFloor(scene, width, depth);

    // Left wall
    const sideWallGeometry = new THREE.PlaneGeometry(depth + 2, height + 4);
    applyContinuousUVs(sideWallGeometry);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI/2;
    leftWall.position.set(-width/2, height/2, 0);
    scene.add(leftWall);

    // Right wall
    const overlapXRight = 1;
    const overlapYRight = 2;
    const rightWallShape = new THREE.Shape();
    rightWallShape.moveTo(-depth/2 - overlapXRight, -overlapYRight);
    rightWallShape.lineTo(depth/2 + overlapXRight, -overlapYRight);
    rightWallShape.lineTo(depth/2 + overlapXRight, height + overlapYRight);
    rightWallShape.lineTo(-depth/2 - overlapXRight, height + overlapYRight);
    rightWallShape.lineTo(-depth/2 - overlapXRight, -overlapYRight);

    const doorW = 7;
    const doorH = 15.0;
    const doorZ = 10;

    const doorHole = new THREE.Path();
    doorHole.moveTo(doorZ - doorW/2, -overlapYRight);
    doorHole.lineTo(doorZ - doorW/2, doorH);
    doorHole.lineTo(doorZ + doorW/2, doorH);
    doorHole.lineTo(doorZ + doorW/2, -overlapYRight);
    rightWallShape.holes.push(doorHole);

    const rightWallGeom = new THREE.ShapeGeometry(rightWallShape);
    applyContinuousUVs(rightWallGeom);
    const rightWall = new THREE.Mesh(rightWallGeom, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(width / 2, 0, 0);
    scene.add(rightWall);

    // Kitchen wall
    const kitchenWallGeometry = new THREE.PlaneGeometry(kitchenWidth + 2, height + 4);
    applyContinuousUVs(kitchenWallGeometry);

    const kitchenBackWall = new THREE.Mesh(kitchenWallGeometry, wallMaterial);
    kitchenBackWall.position.set(-(width/2) + (kitchenWidth/2), height/2, -depth/2);
    scene.add(kitchenBackWall);

    const kitchenFrontWall = new THREE.Mesh(kitchenWallGeometry, wallMaterial);
    kitchenFrontWall.rotation.y = Math.PI;
    kitchenFrontWall.position.set(-(width/2) + (kitchenWidth/2), height/2, depth/2);
    scene.add(kitchenFrontWall);

    state.colliders.push(kitchenBackWall, kitchenFrontWall);

    // Divisor walls
    const divGeomVertical = new THREE.BoxGeometry(divisorWallThickness, height, depthSepWalls);
    applyContinuousUVs(divGeomVertical);

    const backDivisor = new THREE.Mesh(divGeomVertical, wallMaterial);
    backDivisor.position.set(divisorWallX + divisorWallThickness/2, height/2, -(depth/2) + (depthSepWalls/2));
    scene.add(backDivisor);

    const frontDivisor = new THREE.Mesh(divGeomVertical, wallMaterial);
    frontDivisor.position.set(divisorWallX + divisorWallThickness/2, height/2, (depth/2) - (depthSepWalls/2));
    scene.add(frontDivisor);

    const divGeomHorizontal = new THREE.BoxGeometry(divisorWallThickness, 3.5, counterDepth);
    applyContinuousUVs(divGeomHorizontal);

    const divisorLowWall = new THREE.Mesh(divGeomHorizontal, wallMaterial);
    divisorLowWall.position.set(divisorWallX + divisorWallThickness/2, 3.5/2, 0);
    scene.add(divisorLowWall);

    const divisorHighWall = new THREE.Mesh(divGeomHorizontal, wallMaterial);
    divisorHighWall.position.set(divisorWallX + divisorWallThickness/2, height - (3.5/2), 0);
    scene.add(divisorHighWall);

    // Counter
    const counterMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5B1706, roughness: 1.0, metalness: 0.0,             
    });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(counterWidth, counterThickness, counterDepth), counterMaterial);
    counter.position.set(divisorWallX + 1.6*divisorWallThickness - counterWidth/2, 3.5 + (counterThickness/2), 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    counter.userData.isInteractable = true;
    counter.userData.interactionType = 'counter';
    scene.add(counter);

    state.colliders.push(backDivisor, frontDivisor, divisorLowWall, divisorHighWall, counter);

    // Back and front main room walls
    const overlapX = 0;
    const overlapY = 2;
    const backWallShape = new THREE.Shape();
    backWallShape.moveTo(-mainRoomWidth/2 - overlapX, -overlapY);
    backWallShape.lineTo(mainRoomWidth/2 + overlapX, -overlapY);
    backWallShape.lineTo(mainRoomWidth/2 + overlapX, height + overlapY);
    backWallShape.lineTo(-mainRoomWidth/2 - overlapX, height + overlapY);
    backWallShape.lineTo(-mainRoomWidth/2 - overlapX, -overlapY);

    const backWindowCenters = [-32.5, 0, 32.5];
    backWindowCenters.forEach(cx => {
        const hole = new THREE.Path();
        const w = 20;
        const r = w/2;
        const h = 10;
        const bottomY = 5;

        hole.moveTo(cx - r, bottomY);
        hole.lineTo(cx - r, bottomY + h);
        hole.absarc(cx, bottomY + h, r, Math.PI, 0, true);
        hole.lineTo(cx + r, bottomY);
        hole.lineTo(cx - r, bottomY);
        backWallShape.holes.push(hole);
    });

    const backWallGeom = new THREE.ShapeGeometry(backWallShape);
    applyContinuousUVs(backWallGeom);

    const backWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    backWallMesh.position.set(divisorWallX + (mainRoomWidth/2), 0, -depth/2);
    scene.add(backWallMesh);

    const frontWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    frontWallMesh.rotation.y = Math.PI;
    frontWallMesh.position.set(divisorWallX + (mainRoomWidth/2), 0, depth/2);
    scene.add(frontWallMesh);

    // Windows
    const backWindowsGroup = new THREE.Group();
    backWindowCenters.forEach(cx => {
        const windowFrame = createWindowFrame(20, 10, 10, 0.5, 1.2, counterMaterial);
        windowFrame.position.set(divisorWallX + (mainRoomWidth/2) + cx, 5, -depth/2);
        backWindowsGroup.add(windowFrame);
    });
    scene.add(backWindowsGroup);

    window.backWindowsGroup = backWindowsGroup;

    const frontWindowsGroup = new THREE.Group();
    backWindowCenters.forEach(cx => {
        const windowFrame = createWindowFrame(20, 10, 10, 0.5, 1.2, counterMaterial);
        windowFrame.rotation.y = Math.PI;
        windowFrame.position.set(divisorWallX + (mainRoomWidth/2) - cx, 5, depth/2);
        frontWindowsGroup.add(windowFrame);
    });
    scene.add(frontWindowsGroup);

    window.frontWindowsGroup = frontWindowsGroup;

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(width + 1, depth + 1);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: iceFloorTexture,
        roughness: 0.2,
        metalness: 0.1
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    scene.add(ceiling);

    // Light
    const ambientLight = new THREE.AmbientLight(0xd0e3f0, 0.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.2);
    hemiLight.position.set(0, height, 0);
    scene.add(hemiLight);

    const lampGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8);
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffeebb });

    const spotlightIntensity = 0.35; // Alzata leggermente l'intensità visto che sono più distanti
    
    const xDistance = 32;
    const zDistance = 22;
    let shadowLightCount = 0;

    for (let x = -70; x <= 70; x += xDistance) {
        for (let z = -35; z <= 35; z += zDistance) {
            const physicalLamp = new THREE.Mesh(lampGeometry, lampMaterial);
            physicalLamp.position.set(x, height - 0.05, z);
            scene.add(physicalLamp);

            const gridSpotlight = new THREE.SpotLight(0xfff0dd, spotlightIntensity);
            gridSpotlight.position.set(x, height - 0.2, z);
            gridSpotlight.target.position.set(x, 0, z);

            gridSpotlight.angle = Math.PI / 2.5;
            gridSpotlight.penumbra = 0.8;
            gridSpotlight.distance = 55;
            gridSpotlight.decay = 1.8; 

            if (shadowLightCount < 4 && (x === -6 || x === 26) && (z === -13 || z === 9)) {
                gridSpotlight.castShadow = true;
                gridSpotlight.shadow.mapSize.width = 1024;
                gridSpotlight.shadow.mapSize.height = 1024;
                gridSpotlight.shadow.bias = -0.001;
                shadowLightCount++;
            }
            else{
                gridSpotlight.castShadow = false;
            }

            scene.add(gridSpotlight);
            scene.add(gridSpotlight.target);
        }
    }

    //under cabinets lights
    const exactZPositions = [12.75, -3.75, -14.75, -31.25];
    const miniLampGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.15, 8);
    const miniLampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    exactZPositions.forEach(zPos => {
        const cabinetHeight = (zPos === -14.75) ? 17.5 : 15;
        const lightY = cabinetHeight - 0.1; 
        const lightX = -74; 

        const miniLampMesh = new THREE.Mesh(miniLampGeom, miniLampMat);
        miniLampMesh.position.set(lightX, lightY, zPos);
        scene.add(miniLampMesh);

        const underCabinetSpot = new THREE.SpotLight(0xfff8f0, 2.0); // Intensità aumentata a 2.0 per un effetto marcato
        underCabinetSpot.position.set(lightX, lightY - 0.05, zPos);
        
        underCabinetSpot.target.position.set(lightX, 0, zPos);

        //light cone
        underCabinetSpot.angle = Math.PI / 6.5;  
        underCabinetSpot.penumbra = 0.3;         
        underCabinetSpot.distance = 20;          
        underCabinetSpot.decay = 1.2;            
        underCabinetSpot.castShadow = false; 

        scene.add(underCabinetSpot);
        scene.add(underCabinetSpot.target);
    });

    // Camera controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minPolarAngle = Math.PI/4;
    controls.maxPolarAngle = Math.PI/2.1;
    controls.minDistance = 10;
    controls.maxDistance = 35;
    controls.target.set(0, 4, 0);
    controls.update();

    controls.enablePan = false;
    controls.screenSpacePanning = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    state.gameControls = controls;
    window.addEventListener('resize', onWindowResize, false);

    // Spawning
    const waiter = spawnPenguin(KITCHEN_POS.IDLE_WAITER, 'waiter');
    setupControls(waiter);
    const chef = spawnPenguin(KITCHEN_POS.IDLE_CHEF, 'chef');
    //setupControls(chef);
    const dishwasher = spawnPenguin(KITCHEN_POS.IDLE_DISHWASHER, 'dishwasher');
    //setupControls(dishwasher);

    if (waiter){
        camera.position.set(waiter.position.x, waiter.position.y+10, waiter.position.z+20);
        if (state.gameControls){
            state.gameControls.target.set(waiter.position.x, waiter.position.y+3, waiter.position.z);
            state.gameControls.update();
        }
    }

    loadDoor(scene, 'models/furniture/doorway.glb', width/2, 0, 10, -Math.PI/2, 15);
    
    //load of tray
    loadFurniture(scene, 'models/food/plate-rectangle.glb', -36, -18 , 0, 4.5, 10, false, false, true);
    //bottom, from left to right
    
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -68.5, 40, Math.PI);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -63, 40, Math.PI);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -57.5, 40, Math.PI);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -52, 40, Math.PI)
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -46.5, 40, Math.PI)

    loadFurniture(scene, 'models/furniture/WallShelf.glb', -65, 40, -2*Math.PI, 15.5, 5);
    loadFurniture(scene, 'models/furniture/WallShelf.glb', -60, 40, -2*Math.PI, 15.5, 5);

    loadFurniture(scene, 'models/furniture/kitchenFridgeLarge.glb', -75, 25, Math.PI/2, 0, 13, true);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, 15.5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenStoveElectric.glb', -74, 10, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenStoveElectric.glb', -74, 4.5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -1, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -6.5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenSink.glb', -74, -12, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -17.5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -23, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -28.5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -34, Math.PI/2);
    

    //   loadFurniture(scene, 'models/furniture/WallArt06.glb', 4, -44, Math.PI, 15, 10);
    //main room //quanto vai a destra, vai indietro, rotazione, altezza, quanto piccolo

    loadFurniture(scene, 'models/furniture/bookcaseClosedWide.glb', -74, -40, 2*Math.PI, 0, 18);
    //0
    loadFurniture(scene, 'models/furniture/barrel.glb', -70, -40, 3*Math.PI/2, 14.1, 6);
    loadFurniture(scene, 'models/furniture/mug.glb', -65, -40, 0, 14.1, 6);
    //1
    loadFurniture(scene, 'models/furniture/wine-red.glb', -70, -40, 0, 10, 5.5);
    loadFurniture(scene, 'models/furniture/wine-white.glb', -68, -40, 0, 10, 5.5);
    loadFurniture(scene, 'models/furniture/wine-white.glb', -66, -40, 0, 10, 5.5);
    //2
    loadFurniture(scene, 'models/furniture/mug.glb', -70, -40, 0, 6, 6);
    loadFurniture(scene, 'models/furniture/wine-red.glb', -67, -40, 0, 6, 5.5);
    loadFurniture(scene, 'models/furniture/wine-red.glb', -65, -40, 0, 6, 5.5);
    loadFurniture(scene, 'models/furniture/wine-red.glb', -63, -40, 0, 6, 5.5);
    //3
    loadFurniture(scene, 'models/furniture/wine-white.glb', -70, -40, 0, 2, 5.5);
    loadFurniture(scene, 'models/furniture/wine-white.glb', -68, -40, 0, 2, 5.5);
    loadFurniture(scene, 'models/furniture/Crate.glb', -63, -40, 0, 2, 2);


    loadFurniture(scene, 'models/furniture/bookcaseClosedWide.glb', -59, -40, 2*Math.PI, 0, 18);
    //0
    loadFurniture(scene, 'models/furniture/Bottles.glb', -55, -40, Math.PI/2, 14.1, 3.5);
    //1
    loadFurniture(scene, 'models/furniture/can.glb', -55, -40, 0, 10, 5.5);
    loadFurniture(scene, 'models/furniture/can-open.glb', -52.5, -40, 0, 10, 5.5);
    loadFurniture(scene, 'models/furniture/can-small.glb', -50, -40, 0, 10, 5.5);
    //2
    loadFurniture(scene, 'models/furniture/bottle-oil.glb', -55, -40, 0, 6, 5.5);
    loadFurniture(scene, 'models/furniture/pepper-mill.glb', -53, -40, 0, 6, 5.5);
    loadFurniture(scene, 'models/furniture/bottle-ketchup.glb', -49, -40, 0, 6, 6);
    loadFurniture(scene, 'models/furniture/bottle-musterd.glb', -47, -40, 0, 6, 6);
    //3
    loadFurniture(scene, 'models/furniture/carton.glb', -54, -40, 0, 2, 5.5);
    loadFurniture(scene, 'models/furniture/carton-small.glb', -51, -40, 0, 2, 5.5);



    //superior, from left to right
    loadFurniture(scene, 'models/furniture/WallShelf.glb', -76, 21.3, 3*Math.PI/2, 15.5, 5);
    //inside
    loadFurniture(scene, 'models/furniture/Vase.glb', -65, 40, 3*Math.PI/2, 21.5, 0.8);
    loadFurniture(scene, 'models/furniture/Vines.glb', -58, 40, Math.PI, 16, 5);

    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, 15.5, Math.PI/2, 15);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, 10, Math.PI/2, 15);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, 4.5, Math.PI/2, 15);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, -1, Math.PI/2, 15);

    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperLow.glb', -74, -6.5, Math.PI/2, 17.5);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperLow.glb', -74, -12, Math.PI/2, 17.5);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperLow.glb', -74, -17.5, Math.PI/2, 17.5);
    
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, -23, Math.PI/2, 15);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, -28.5, Math.PI/2, 15);
    loadFurniture(scene, 'models/furniture/kitchenCabinetUpperDouble.glb', -74, -34, Math.PI/2, 15);
    
    //decorations and little forniture
    loadFurniture(scene, 'models/furniture/kitchenCoffeeMachine.glb', -75, -5, Math.PI/2, 5.5);
    loadFurniture(scene, 'models/furniture/hoodModern.glb', -74, 7.25, Math.PI/2, 12);
    loadFurniture(scene, 'models/furniture/CuttingTable.glb', -77, -25, Math.PI/2, 4, 2);
    loadFurniture(scene, 'models/furniture/Whiteboard.glb', -74, -14, 2*Math.PI, 8, 0.08);

    loadFurniture(scene, 'models/furniture/OilBarrels.glb', -71, 30, Math.PI, 0, 90);
    loadFurniture(scene, 'models/furniture/OilBarrels.glb', -75, 34, 0, 0, 70);



    //main room //quanto vai a destra, vai indietro, rotazione, altezza, quanto piccolo
    loadFurniture(scene, 'models/furniture/theBedroomHanger.glb', 77, 0, Math.PI/2, 10, 10);
    loadFurniture(scene, 'models/furniture/LittleBookcase.glb', 76, -16, Math.PI/2, 2, 13);
    loadFurniture(scene, 'models/furniture/AssortedShelfPlants.glb', 75, -32, Math.PI/2, 10, 10);

    loadFurniture(scene, 'models/furniture/Board.glb', -30, 27, Math.PI/2, 4, 25);

    loadFurniture(scene, 'models/furniture/AssortedShelfPlants.glb', -33, 40, Math.PI/2, 10, 10);
    loadFurniture(scene, 'models/furniture/AssortedShelfPlants.glb', -33, -40, -Math.PI/2, 10, 10);

    loadFurniture(scene, 'models/furniture/WallArt06.glb', 4, -44, Math.PI, 15, 10);
    loadFurniture(scene, 'models/furniture/CoffeePlant.glb', 4, -44, Math.PI, 0, 1.5);

    loadFurniture(scene, 'models/furniture/WallArt02.glb', 35 , -44, Math.PI, 12, 10);
    loadFurniture(scene, 'models/furniture/FiddleLeafPlant(1).glb', 35 , -44, Math.PI, 0, 1.5);

    loadFurniture(scene, 'models/furniture/WallArt03.glb', 4, 44, 0, 15, 10);
    loadFurniture(scene, 'models/furniture/FiddleLeafPlant(1).glb', 4, 44, 0, 0, 1.5);

    loadFurniture(scene, 'models/furniture/WallArt01.glb', 35, 44, 0, 12, 10);
    loadFurniture(scene, 'models/furniture/CoffeePlant.glb', 35, 44, 0, 0, 1.5);

    //loadFurniture(scene, 'models/furniture/pottedPlant.glb', 35, 44, 0, 0, 1.5);
 
    //tables and chairs
    const diamondLayout = [
        {
            // 1. NORTH
            table: { x: 20, z: -28 },
            chairs: [
                { x: 13, z: -28 + 1.5, rot: Math.PI/2 },  
                { x: 27, z: -28 - 1.5, rot: -Math.PI/2 }  
            ]
        },
        {
            // 2. WEST
            table: { x: -8, z: 0 },
            chairs: [
                { x: -15, z: 0 + 1.5, rot: Math.PI/2 },
                { x: -1, z: 0 - 1.5, rot: -Math.PI/2 }
            ]
        },
        {
            // 3. EST
            table: { x: 48, z: 0 },
            chairs: [
                { x: 41, z: 0 + 1.5, rot: Math.PI/2 },
                { x: 55, z: 0 - 1.5, rot: -Math.PI/2 }
            ]
        },
        {
            // 4. SOUTH
            table: { x: 20, z: 28 },
            chairs: [
                { x: 13, z: 28 + 1.5, rot: Math.PI/2 },
                { x: 27, z: 28 - 1.5, rot: -Math.PI/2 }
            ]
        }
    ];

    diamondLayout.forEach(group =>{
       
        loadFurniture(scene, 'models/furniture/RoundTable.glb', group.table.x, group.table.z, 2*Math.PI, 0, 5.5);

        //loadFurniture(scene, 'models/furniture/pottedPlant.glb', group.table.x, group.table.z, 0, 5.2, 5);

        group.chairs.forEach(chairPos => {
            loadFurniture(scene, 'models/furniture/chairModernCushion.glb', chairPos.x, chairPos.z, chairPos.rot, 0, 14, false, true);
        });
    });

    loadEnvironment(scene, state.icebergs);
    animate(waiter, camera, state.icebergs);
}

function animate(waiter, camera, icebergs){
    requestAnimationFrame(() => animate(waiter, camera, icebergs));

    updateMovement(waiter);

    if (waiter && camera && state.gameControls){
        const width = 160;
        const depth = 90;
        const padding = 2;

        if (waiter.position.x < -width/2 + padding) waiter.position.x = -width/2 + padding;
        if (waiter.position.x > width/2 - padding) waiter.position.x = width/2 - padding;
        if (waiter.position.z < -depth/2 + padding) waiter.position.z = -depth/2 + padding;
        if (waiter.position.z > depth/2 - padding) waiter.position.z = depth/2 - padding;

        const currentTargetX = waiter.position.x;
        const currentTargetY = waiter.position.y + 3;
        const currentTargetZ = waiter.position.z;

        const deltaX = currentTargetX - state.gameControls.target.x;
        const deltaY = currentTargetY - state.gameControls.target.y;
        const deltaZ = currentTargetZ - state.gameControls.target.z;

        camera.position.x += deltaX;
        camera.position.y += deltaY;
        camera.position.z += deltaZ;

        state.gameControls.target.set(currentTargetX, currentTargetY, currentTargetZ);
    }

    if (state.isPaused) return;

    animateIcebergs(icebergs);

    if (state.gameControls) {
        state.gameControls.update();
    }

    updateTweens();
    updateRoutines(); // Update penguin routines
    state.renderer.render(state.scene, camera);
}

function onWindowResize(){
    const aspect = window.innerWidth/window.innerHeight;
    state.camera.aspect = aspect;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}