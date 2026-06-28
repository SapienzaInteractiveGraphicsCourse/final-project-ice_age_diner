function buildRestaurant() {
    // Creation of the scene, camera, and renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    // View to the room
    camera.position.set(0, 20, 35); 
    camera.lookAt(0, 0, 0);

    if (audioListener) camera.add(audioListener);

    // === RENDERER SHADOW SETUP ===
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

    if (typeof setupInteractions === 'function') {
        setupInteractions(camera, scene);
    } else {
        console.warn("error in file interactions.js");
    }

    // Global variables for restaurant dimensions
    const width = 120;  
    const depth = 50; 
    const height = 20;
    const thickness = 1;

    const divisorWallX = -30;
    const kitchenWidth = (width/2) + divisorWallX;
    const mainRoomWidth = (width/2) - divisorWallX;
    
    const counterThickness = 0.3;
    const counterWidth = 3; 
    const counterDepth = 44;

    const depthSepWalls = (depth - counterDepth) / 2;
const textureLoader = new THREE.TextureLoader();
    const iceFloorTexture = textureLoader.load('textures/Fabric081B_1K-JPG_Color.jpg');
    const iceWallTexture = textureLoader.load('textures/Tiles019_1K-JPG_Color.jpg');
    
    // Independent texture instance for small wall elements to prevent stretching
    const iceSmallWallTexture = textureLoader.load('textures/Tiles019_1K-JPG_Color.jpg');

    // Applied clean cartoon-style wrapping values
    iceFloorTexture.wrapS = THREE.RepeatWrapping;
    iceFloorTexture.wrapT = THREE.RepeatWrapping;
    iceFloorTexture.repeat.set(6, 5);

    iceWallTexture.wrapS = THREE.RepeatWrapping;
    iceWallTexture.wrapT = THREE.RepeatWrapping;
    iceWallTexture.repeat.set(4, 1);

    // Adjusted repetition scale specifically tailored for small/low surfaces
    iceSmallWallTexture.wrapS = THREE.RepeatWrapping;
    iceSmallWallTexture.wrapT = THREE.RepeatWrapping;
    iceSmallWallTexture.repeat.set(7, 0.3);

    // === FLOOR SET TO RECEIVE SHADOWS WITH ADVANCED ICY GLOW EFFECT ===
    const floorGeometry = new THREE.BoxGeometry(width + 0.5, thickness, depth + 0.5);
    
    // FORCED HIGH GLOSS: Using MeshPhysicalMaterial for true icy reflectivity
    const floorMaterial = new THREE.MeshPhysicalMaterial({ 
        map: iceFloorTexture, 
        roughness: 0.01,          // Near 0 makes it a perfect, crisp mirror
        metalness: 0.1,           // Kept low to keep it looking like organic ice, not steel
        clearcoat: 1.0,           // Maximum thick polished lacquer layer
        clearcoatRoughness: 0.0,  // Perfectly smooth reflection coat
        transmission: 0.3,        // Gives it a slight semi-translucent, glass-like depth
        ior: 1.31,                // The real physical Index of Refraction of ice!
        thickness: 2.0            // Simulates internal light refraction inside the ice slab
    }); 
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -thickness / 2; 
    floor.receiveShadow = true; 
    scene.add(floor);

    // Material setups for main walls and detail walls
    const wallMaterial = new THREE.MeshStandardMaterial({ map: iceWallTexture, roughness: 0.2, metalness: 0.1 });
    const detailWallMaterial = new THREE.MeshStandardMaterial({ map: iceSmallWallTexture, roughness: 0.2, metalness: 0.1 });

    const sideWallGeometry = new THREE.PlaneGeometry(depth + 2, height + 4);

    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width / 2, height / 2, 0);
    scene.add(leftWall);

    const overlapXRight = 1; 
    const overlapYRight = 2; 
    const rightWallShape = new THREE.Shape();
    
    // Draw wall perimeter
    rightWallShape.moveTo(-depth/2 - overlapXRight, -overlapYRight);
    rightWallShape.lineTo(depth/2 + overlapXRight, -overlapYRight);
    rightWallShape.lineTo(depth/2 + overlapXRight, height + overlapYRight);
    rightWallShape.lineTo(-depth/2 - overlapXRight, height + overlapYRight);
    rightWallShape.lineTo(-depth/2 - overlapXRight, -overlapYRight);

    // Exact door bounds matching doorway asset
    const doorW = 5;    
    const doorH = 10.5; 
    const doorZ = 10;   

    // Cut the doorway hole out of the wall shape
    const doorHole = new THREE.Path();
    doorHole.moveTo(doorZ - doorW/2, -overlapYRight);
    doorHole.lineTo(doorZ - doorW/2, doorH);
    doorHole.lineTo(doorZ + doorW/2, doorH);
    doorHole.lineTo(doorZ + doorW/2, -overlapYRight);
    rightWallShape.holes.push(doorHole);

    const rightWallGeom = new THREE.ShapeGeometry(rightWallShape);
    
    // Fix UV coordinates to prevent wall texture distortion
    const posAttrRW = rightWallGeom.attributes.position;
    const uvAttrRW = rightWallGeom.attributes.uv;
    if (uvAttrRW) {
        for (let i = 0; i < posAttrRW.count; i++) { 
            const x = posAttrRW.getX(i);
            const y = posAttrRW.getY(i);
            uvAttrRW.setXY(i, (x + depth/2) / depth, y / height);
        }
        uvAttrRW.needsUpdate = true;
    }

    const rightWall = new THREE.Mesh(rightWallGeom, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(width / 2, 0, 0); 
    scene.add(rightWall);

    // Walls of the kitchen, only the part on the left of the divisor wall
    const kitchenWallGeometry = new THREE.PlaneGeometry(kitchenWidth + 2, height + 4);
    const kitchenBackWall = new THREE.Mesh(kitchenWallGeometry, wallMaterial);
    kitchenBackWall.position.set(-(width / 2) + (kitchenWidth / 2), height / 2, -depth / 2);
    scene.add(kitchenBackWall);

    const kitchenFrontWall = new THREE.Mesh(kitchenWallGeometry, wallMaterial);
    kitchenFrontWall.rotation.y = Math.PI;
    kitchenFrontWall.position.set(-(width / 2) + (kitchenWidth / 2), height / 2, depth / 2);
    scene.add(kitchenFrontWall);

    // Parts of the divisor wall
    const backDivisor = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depthSepWalls), wallMaterial);
    backDivisor.position.set(divisorWallX, height / 2, -(depth / 2) + (depthSepWalls / 2));
    scene.add(backDivisor);

    const frontDivisor = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depthSepWalls), wallMaterial);
    frontDivisor.position.set(divisorWallX, height / 2, (depth / 2) - (depthSepWalls / 2));
    scene.add(frontDivisor);
    
    // === APPLIED DETAIL MATERIAL ON LOW/HIGH DIVISORS TO PREVENT STRETCHING ===
    const divisorLowWall = new THREE.Mesh(new THREE.BoxGeometry(thickness,  3.5, counterDepth), detailWallMaterial);
    divisorLowWall.position.set(divisorWallX, 3.5 / 2, 0);
    scene.add(divisorLowWall);

    const divisorHighWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, 3.5, counterDepth), detailWallMaterial);
    divisorHighWall.position.set(divisorWallX, height - (3.5 / 2), 0);
    scene.add(divisorHighWall);

    // Counter with a brown material to simulate wood, positioned in front of the divisor wall
    const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.3, metalness: 0.5 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(counterWidth, counterThickness, counterDepth), counterMaterial);
    counter.position.set(divisorWallX, 3.5 + (counterThickness / 2), 0);
    scene.add(counter);

    // Back wall of the main room with three windows, created using a shape with holes for the windows
    const overlapX = 0; // To avoid gaps between walls
    const overlapY = 2; // To avoid gaps between walls
    const backWallShape = new THREE.Shape();
    backWallShape.moveTo(-mainRoomWidth/2 - overlapX, -overlapY);
    backWallShape.lineTo(mainRoomWidth/2 + overlapX, -overlapY);
    backWallShape.lineTo(mainRoomWidth/2 + overlapX, height + overlapY);
    backWallShape.lineTo(-mainRoomWidth/2 - overlapX, height + overlapY);
    backWallShape.lineTo(-mainRoomWidth/2 - overlapX, -overlapY);

    // Centers of the three windows on the back wall
    const backWindowCenters = [-25, 0, 25]; 
    backWindowCenters.forEach(cx => {
        const hole = new THREE.Path();
        const w = 16;    
        const r = w / 2; 
        const h = 7;     
        const bottomY = 4; 
        
        // Create a hole for the window using a path with an arc for the top
        hole.moveTo(cx - r, bottomY);
        hole.lineTo(cx - r, bottomY + h);
        hole.absarc(cx, bottomY + h, r, Math.PI, 0, true); 
        hole.lineTo(cx + r, bottomY);
        hole.lineTo(cx - r, bottomY);
        backWallShape.holes.push(hole);
    });

    // Create a 3D geometry from the shape and apply the wall material, then position it in the scene
    const backWallGeom = new THREE.ShapeGeometry(backWallShape);

    // Fix for the texture coordinates mapping
    const posAttributeBW = backWallGeom.attributes.position;
    const uvAttributeBW = backWallGeom.attributes.uv;
    if (uvAttributeBW) {
        for (let i = 0; i < posAttributeBW.count; i++) { 
            const x = posAttributeBW.getX(i);
            const y = posAttributeBW.getY(i);
            const z = posAttributeBW.getZ(i);
            
            if (Math.abs(z) < 0.01 || Math.abs(z - thickness) < 0.01) {
                uvAttributeBW.setXY(i, (x + mainRoomWidth/2) / mainRoomWidth, y / height);
            } else {
                uvAttributeBW.setXY(i, z / thickness, y / height);
            }
         }
         uvAttributeBW.needsUpdate = true;
    }

    // Create a mesh from the geometry and add it to the scene
    const backWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    backWallMesh.position.set(divisorWallX + (mainRoomWidth / 2), 0, -depth / 2);
    scene.add(backWallMesh);

    const frontWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    frontWallMesh.rotation.y = Math.PI; 
    frontWallMesh.position.set(divisorWallX + (mainRoomWidth / 2), 0, depth / 2);
    scene.add(frontWallMesh);

    // Create the window frames for the back wall windows and add them to a group, then add the group to the scene
    const backWindowsGroup = new THREE.Group();
    backWindowCenters.forEach(cx => {
        const windowFrame = createWindowFrame(16, 7, 8, 0.5, 1.2, counterMaterial);
        windowFrame.position.set(divisorWallX + (mainRoomWidth / 2) + cx, 4, -depth / 2);
        backWindowsGroup.add(windowFrame);
    });
    scene.add(backWindowsGroup);
    
    window.backWindowsGroup = backWindowsGroup;

    const frontWindowsGroup = new THREE.Group();
    backWindowCenters.forEach(cx => {
        const windowFrame = createWindowFrame(16, 7, 8, 0.5, 1.2, counterMaterial);
        windowFrame.rotation.y = Math.PI; 
        windowFrame.position.set(divisorWallX + (mainRoomWidth / 2) - cx, 4, depth / 2);
        frontWindowsGroup.add(windowFrame);
    });
    scene.add(frontWindowsGroup);
    
    window.frontWindowsGroup = frontWindowsGroup;

    // Ceiling created using a PlaneGeometry so it can be seen only from below
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

    // === OPTIMIZED GRID SPOTLIGHT SYSTEM (Prevents GPU Shader Unit Crashes) ===
    const ambientLight = new THREE.AmbientLight(0xd0e3f0, 0.4); 
    scene.add(ambientLight);

    const lampGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.3, 8); 
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const spotlightIntensity = 1.2; 
    
    const xDistance = 20;           
    const zDistance = 12;           
    let shadowLightCount = 0; // Safe counter to cap live shadow maps under WebGL limit

    for (let x = -50; x <= 50; x += xDistance) {
        for (let z = -20; z <= 20; z += zDistance) {
            // Render physical fixture model on ceiling
            const physicalLamp = new THREE.Mesh(lampGeometry, lampMaterial);
            physicalLamp.position.set(x, 19.95, z); 
            scene.add(physicalLamp);

            // Render functional cone spotlight
            const gridSpotlight = new THREE.SpotLight(0xffffff, spotlightIntensity);
            gridSpotlight.position.set(x, 19.8, z); 
            gridSpotlight.target.position.set(x, 0, z);
            
            gridSpotlight.angle = Math.PI / 2.2; 
            gridSpotlight.penumbra = 1.0;        
            gridSpotlight.distance = 30;         
            gridSpotlight.decay = 1.2;           
            
            // Allocate shadow casting limits selectively to maintain hardware stability
            if (shadowLightCount < 4 && (x === -10 || x === 30) && z === 0) {
                gridSpotlight.castShadow = true;
                gridSpotlight.shadow.mapSize.width = 1024;
                gridSpotlight.shadow.mapSize.height = 1024;
                gridSpotlight.shadow.bias = -0.001;
                shadowLightCount++;
            } else {
                gridSpotlight.castShadow = false; 
            }

            scene.add(gridSpotlight);
            scene.add(gridSpotlight.target);
        }
    }

    // Controls for the camera using OrbitControls, allowing rotation, zoom, and panning
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.minPolarAngle = Math.PI / 2.2;
    controls.maxPolarAngle = Math.PI / 2.2; 
    controls.minDistance = 5; 
    controls.maxDistance = 45; 
    controls.target.set(0, 4, 0);
    controls.update();

    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    window.gameControls = controls;
    window.addEventListener('resize', onWindowResize, false);

    const waiter = spawnPenguin(-10, 0, -10);
    setupControls(waiter);
    spawnPenguin(-20, 0, 5);

    loadDoor(scene, 'models/furniture/doorway.glb', width / 2, 0, 10, -Math.PI / 2, 10);
    loadFurniture(scene, 'models/furniture/kitchenSink.glb', -54, -10, Math.PI / 2);
    loadFurniture(scene, 'models/furniture/kitchenFridgeLarge.glb', -55, 20, Math.PI / 2, 0, 13, openable = true);
    loadFurniture(scene, 'models/furniture/kitchenStoveElectric.glb', -54, 10, Math.PI / 2);
    loadFurniture(scene, 'models/furniture/kitchenStoveElectric.glb', -54, 5, Math.PI / 2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -54, 0, Math.PI / 2);
    loadFurniture(scene, 'models/furniture/kitchenCabinet.glb', -54, -5, Math.PI / 2);
    loadFurniture(scene, 'models/furniture/kitchenCoffeeMachine.glb', -55, -5, Math.PI / 2, 5.5);

    animate(waiter, camera);
}

function animate(waiter, camera) {
    requestAnimationFrame(() => animate(waiter, camera));

    updateMovement(waiter);

    if (waiter && camera) {
        let targetX = waiter.position.x;
        const limiteSinistro = -60; 
        const limiteDestro = 60;

        if (targetX < limiteSinistro) targetX = limiteSinistro;
        if (targetX > limiteDestro) targetX = limiteDestro;

        // Follow target along the camera tracking path
        camera.position.x = -targetX;
        
        // INVERTED LOOK-AT: Look in the opposite X direction of the waiter
        camera.lookAt(-targetX, 5, 0); 
    }

    if (isPaused) return;
    
    if (window.gameControls) {
        window.gameControls.update();
    }

    // Window groups visibility management based on camera position Z-depth
    if (window.backWindowsGroup) {
        window.backWindowsGroup.visible = camera.position.z > -25;
    }

    if (window.frontWindowsGroup) {
        window.frontWindowsGroup.visible = camera.position.z < 25;
    }

    if (typeof TWEEN !== 'undefined') {
        TWEEN.update();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
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
        side: THREE.DoubleSide
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
    hStickLow.position.y = h / 2; 
    group.add(hStickLow);

    const rayLength = r - frameThick;
    const rayGeom = new THREE.BoxGeometry(rayLength, frameThick, frameThick/2);
    
    const ray1 = new THREE.Mesh(rayGeom, material);
    ray1.position.set(-rayLength/2 * Math.cos(Math.PI/4), h + rayLength/2 * Math.sin(Math.PI/4), 0);
    ray1.rotation.z = 3 * Math.PI / 4;
    group.add(ray1);

    const ray2 = new THREE.Mesh(rayGeom, material);
    ray2.position.set(rayLength/2 * Math.cos(Math.PI/4), h + rayLength/2 * Math.sin(Math.PI/4), 0);
    ray2.rotation.z = Math.PI / 4;
    group.add(ray2);

    return group;
}