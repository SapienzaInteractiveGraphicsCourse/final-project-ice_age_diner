function buildRestaurant() {
    window.colliders = [];
    window.icebergs = [];

    // Creation of the scene, camera, and renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);

    // View to the room
    camera.position.set(0, 20, 35); 
    camera.lookAt(0, 0, 0);

    if (audioListener) camera.add(audioListener);

    // Render shadow setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; 
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    
    // Renderer behind the UI elements
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'auto';
    
    document.body.appendChild(renderer.domElement);

    if (typeof setupInteractions === 'function'){
        setupInteractions(camera, scene);
    } 
    else{
        console.warn("error in file interactions.js");
    }

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
            
            // Applica la proiezione sul piano corretto in base alla normale della faccia
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

    const doorW = 4.8;    
    const doorH = 10.0; 
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

    window.colliders.push(kitchenBackWall, kitchenFrontWall);

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
    const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.3, metalness: 0.5 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(counterWidth, counterThickness, counterDepth), counterMaterial);
    counter.position.set(divisorWallX + 1.6*divisorWallThickness - counterWidth/2, 3.5 + (counterThickness/2), 0);
    scene.add(counter);

    window.colliders.push(backDivisor, frontDivisor, divisorLowWall, divisorHighWall, counter);

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
    const ambientLight = new THREE.AmbientLight(0xd0e3f0, 0.4); 
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.2);
    hemiLight.position.set(0, height, 0);
    scene.add(hemiLight);

    const lampGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8); 
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffeebb });
    
    const spotlightIntensity = 0.25;
    const xDistance = 20;           
    const zDistance = 12;           
    let shadowLightCount = 0; 

    for (let x = -50; x <= 50; x += xDistance) {
        for (let z = -20; z <= 20; z += zDistance) {
            const physicalLamp = new THREE.Mesh(lampGeometry, lampMaterial);
            physicalLamp.position.set(x, height-0.05, z); 
            scene.add(physicalLamp);

            const gridSpotlight = new THREE.SpotLight(0xfff0dd, spotlightIntensity);
            gridSpotlight.position.set(x, height-0.2, z); 
            gridSpotlight.target.position.set(x, 0, z);
            
            gridSpotlight.angle = Math.PI/3; 
            gridSpotlight.penumbra = 0.8;        
            gridSpotlight.distance = 45;         
            gridSpotlight.decay = 2.0;           
            
            if (shadowLightCount < 4 && (x === -10 || x === 30) && z === 0) {
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
    
    window.gameControls = controls;
    window.addEventListener('resize', onWindowResize, false);

    // Spawning
    const waiter = spawnPenguin(KITCHEN_POS.IDLE_WAITER, 'waiter');
    setupControls(waiter);
    const chef = spawnPenguin(KITCHEN_POS.IDLE_CHEF, 'chef');
    setupControls(chef);
    const dishwasher = spawnPenguin(KITCHEN_POS.IDLE_DISHWASHER, 'dishwasher');
    setupControls(dishwasher);

    if (waiter){
        camera.position.set(waiter.position.x, waiter.position.y+10, waiter.position.z+20);
        if (window.gameControls){
            window.gameControls.target.set(waiter.position.x, waiter.position.y+3, waiter.position.z);
            window.gameControls.update();
        }
    }

    loadDoor(scene, 'models/furniture/doorway.glb', width/2, 0, 10, -Math.PI/2, 10);
    loadFurniture(scene, 'models/furniture/kitchenSink.glb', -74, -10, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenFridgeLarge.glb', -75, 20, Math.PI/2, 0, 13, openable = true);
    loadFurniture(scene, 'models/furniture/kitchenStoveElectric.glb', -74, 10, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenStoveElectric.glb', -74, 5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, 0, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -74, -5, Math.PI/2);
    loadFurniture(scene, 'models/furniture/kitchenCoffeeMachine.glb', -75, -5, Math.PI/2, 5.5);

    loadEnvironment(scene, window.icebergs);

    animate(waiter, camera, window.icebergs);
}

function animate(waiter, camera, icebergs){
    requestAnimationFrame(() => animate(waiter, camera, icebergs));

    updateMovement(waiter);

    if (waiter && camera && window.gameControls){
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

        const deltaX = currentTargetX - window.gameControls.target.x;
        const deltaY = currentTargetY - window.gameControls.target.y;
        const deltaZ = currentTargetZ - window.gameControls.target.z;

        camera.position.x += deltaX;
        camera.position.y += deltaY;
        camera.position.z += deltaZ;

        window.gameControls.target.set(currentTargetX, currentTargetY, currentTargetZ);
    }

    if (isPaused) return;

    animateIcebergs(icebergs);
    
    if (window.gameControls) {
        window.gameControls.update();
    }

    if (typeof TWEEN !== 'undefined') {
        TWEEN.update();
    }

    updateRoutines(); // Update penguin routines
    renderer.render(scene, camera);
}

function onWindowResize(){
    const aspect = window.innerWidth/window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createWindowFrame(w, h, r, frameThick, depth, material) {
    const group = new THREE.Group();

    const frameShape = new THREE.Shape();
    frameShape.moveTo(-w/2, 0);
    frameShape.lineTo(w/2, 0);
    frameShape.lineTo(w/2, h);
    frameShape.absarc(0, h, r, 0, Math.PI, false);
    frameShape.lineTo(-w/2, 0);

    const hole = new THREE.Path();
    hole.moveTo(-w/2 + frameThick, frameThick);
    hole.lineTo(-w/2 + frameThick, h);
    hole.absarc(0, h, r - frameThick, Math.PI, 0, true);
    hole.lineTo(w/2 - frameThick, frameThick);
    hole.lineTo(-w/2 + frameThick, frameThick);
    frameShape.holes.push(hole);

    const extrudeSettings = { depth: depth, bevelEnabled: false, curveSegments: 24 };
    const frameGeom = new THREE.ExtrudeGeometry(frameShape, extrudeSettings);
    frameGeom.translate(0, 0, -depth/2);
    const frameMesh = new THREE.Mesh(frameGeom, material);
    group.add(frameMesh);

    const glassShape = new THREE.Shape();
    glassShape.moveTo(-w/2 + frameThick, frameThick);
    glassShape.lineTo(w/2 - frameThick, frameThick);
    glassShape.lineTo(w/2 - frameThick, h);
    glassShape.absarc(0, h, r - frameThick, 0, Math.PI, false);
    glassShape.lineTo(-w/2 + frameThick, frameThick);

    const glassGeom = new THREE.ShapeGeometry(glassShape);
    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0xccffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
        metalness: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const glass = new THREE.Mesh(glassGeom, glassMaterial);
    group.add(glass);

    const vStickGeom = new THREE.BoxGeometry(frameThick, h + r, frameThick/2);
    const vStick = new THREE.Mesh(vStickGeom, material);
    vStick.position.y = (h + r)/2;
    group.add(vStick);

    const hStickGeom = new THREE.BoxGeometry(w - frameThick*2, frameThick, frameThick/2);
    
    const hStickMid = new THREE.Mesh(hStickGeom, material);
    hStickMid.position.y = h; 
    group.add(hStickMid);

    const hStickLow = new THREE.Mesh(hStickGeom, material);
    hStickLow.position.y = h/2; 
    group.add(hStickLow);

    const rayLength = r - frameThick;
    const rayGeom = new THREE.BoxGeometry(rayLength, frameThick, frameThick/2);
    
    const ray1 = new THREE.Mesh(rayGeom, material);
    ray1.position.set(-rayLength/2 * Math.cos(Math.PI/4), h + rayLength/2 * Math.sin(Math.PI/4), 0);
    ray1.rotation.z = 3 * Math.PI/4;
    group.add(ray1);

    const ray2 = new THREE.Mesh(rayGeom, material);
    ray2.position.set(rayLength/2 * Math.cos(Math.PI/4), h + rayLength/2 * Math.sin(Math.PI/4), 0);
    ray2.rotation.z = Math.PI/4;
    group.add(ray2);

    return group;
}

function addReflectiveFloor(scene, width, depth) {
    // 1. Creiamo il piano geometrico per il riflesso
    const geometry = new THREE.PlaneGeometry(width, depth);

    // 2. Usiamo la classe Reflector (dalla cartella jsm/objects/Reflector)
    const groundMirror = new THREE.Reflector(geometry, {
        clipBias: 0.003,
        textureWidth: window.innerWidth * window.devicePixelRatio,
        textureHeight: window.innerHeight * window.devicePixelRatio,
        color: 0x555555, // Colore del riflesso (grigio per non saturare il bianco)
        multisample: 4
    });

    groundMirror.rotation.x = -Math.PI / 2;
    groundMirror.position.y = 0.01; // Appena sopra il piano base per evitare "z-fighting"
    
    scene.add(groundMirror);
    return groundMirror;
}