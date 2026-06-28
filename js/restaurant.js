function buildRestaurant() {
    //creation of the scene, camera, and renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);

    //view to the room
    camera.position.set(0, 20, 35); 
    camera.lookAt(0, 0, 0);

    if (audioListener) camera.add(audioListener);

    //antialiasing for smoother edges
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    //renderer behind the UI elements
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    //renderer.domElement.style.zIndex = '-1'; 
    renderer.domElement.style.pointerEvents = 'auto';
    
    document.body.appendChild(renderer.domElement);

    //global variables for restaurant dimensions
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

    //textures for the floor and walls they are repeated to cover the entire surface
    const textureLoader = new THREE.TextureLoader();
    const iceFloorTexture = new THREE.TextureLoader().load('textures/ice_texture.jpg');
    const iceWallTexture = new THREE.TextureLoader().load('textures/ice_wall.jpg');

    iceFloorTexture.wrapS = THREE.RepeatWrapping;
    iceFloorTexture.wrapT = THREE.RepeatWrapping;
    iceFloorTexture.repeat.set(15, 12);

    iceWallTexture.wrapS = THREE.RepeatWrapping;
    iceWallTexture.wrapT = THREE.RepeatWrapping;
    iceWallTexture.repeat.set(12, 3);

    //add the floor to the scene
    //BoxGeometry is used to create a rectangular floor with specified width, thickness, and depth
    const floorGeometry = new THREE.BoxGeometry(width + 0.5, thickness, depth + 0.5);
    const floorMaterial = new THREE.MeshStandardMaterial({ map: iceFloorTexture, roughness: 0.2, metalness: 0.1 }); 
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -thickness / 2; 
    scene.add(floor);

    //creation of the walls using BoxGeometry and MeshStandardMaterial with ice wall texture
    const wallMaterial = new THREE.MeshStandardMaterial({ map: iceWallTexture, roughness: 0.2, metalness: 0.1 });

    const sideWallGeometry = new THREE.PlaneGeometry(depth + 2, height + 4);

    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-width / 2, height / 2, 0);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(width / 2, height / 2, 0);
    scene.add(rightWall);

    //walls of the kitchen, only the part on the left of the divisor wall
    const kitchenWallGeometry = new THREE.PlaneGeometry(kitchenWidth + 2, height + 4);
    const kitchenBackWall = new THREE.Mesh(kitchenWallGeometry, wallMaterial);
    kitchenBackWall.position.set(-(width / 2) + (kitchenWidth / 2), height / 2, -depth / 2);
    scene.add(kitchenBackWall);

    const kitchenFrontWall = new THREE.Mesh(kitchenWallGeometry, wallMaterial);
    kitchenFrontWall.rotation.y = Math.PI;
    kitchenFrontWall.position.set(-(width / 2) + (kitchenWidth / 2), height / 2, depth / 2);
    scene.add(kitchenFrontWall);

    //parts of the divisor wall, back is the part behind the counter, front is the part in front of the counter,
    //low wall is the part below the counter, high wall is the part above the counter
    const backDivisor = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depthSepWalls), wallMaterial);
    backDivisor.position.set(divisorWallX, height / 2, -(depth / 2) + (depthSepWalls / 2));
    scene.add(backDivisor);

    const frontDivisor = new THREE.Mesh(new THREE.BoxGeometry(thickness, height, depthSepWalls), wallMaterial);
    frontDivisor.position.set(divisorWallX, height / 2, (depth / 2) - (depthSepWalls / 2));
    scene.add(frontDivisor);
    
    const divisorLowWall = new THREE.Mesh(new THREE.BoxGeometry(thickness,  3.5, counterDepth), wallMaterial);
    divisorLowWall.position.set(divisorWallX, 3.5 / 2, 0);
    scene.add(divisorLowWall);

    const divisorHighWall = new THREE.Mesh(new THREE.BoxGeometry(thickness, 3.5, counterDepth), wallMaterial);
    divisorHighWall.position.set(divisorWallX, height - (3.5 / 2), 0);
    scene.add(divisorHighWall);

    //counter with a brown material to simulate wood, positioned in front of the divisor wall
    const counterMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.3, metalness: 0.5 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(counterWidth, counterThickness, counterDepth), counterMaterial);
    counter.position.set(divisorWallX, 3.5 + (counterThickness / 2), 0);
    scene.add(counter);

    //back wall of the main room with three windows, created using a shape with holes for the windows
    const overlapX = 0; //to avoid gaps between walls
    const overlapY = 2; //to avoid gaps between walls
    const backWallShape = new THREE.Shape();
    backWallShape.moveTo(-mainRoomWidth/2 - overlapX, -overlapY);
    backWallShape.lineTo(mainRoomWidth/2 + overlapX, -overlapY);
    backWallShape.lineTo(mainRoomWidth/2 + overlapX, height + overlapY);
    backWallShape.lineTo(-mainRoomWidth/2 - overlapX, height + overlapY);
    backWallShape.lineTo(-mainRoomWidth/2 - overlapX, -overlapY);

    //centers of the three windows on the back wall
    const backWindowCenters = [-25, 0, 25]; 
    backWindowCenters.forEach(cx => {
        const hole = new THREE.Path();
        const w = 16;    
        const r = w / 2; 
        const h = 7;     
        const bottomY = 4; 
        
        //create a hole for the window using a path with an arc for the top
        hole.moveTo(cx - r, bottomY);
        hole.lineTo(cx - r, bottomY + h);
        hole.absarc(cx, bottomY + h, r, Math.PI, 0, true); 
        hole.lineTo(cx + r, bottomY);
        hole.lineTo(cx - r, bottomY);
        backWallShape.holes.push(hole);
    });

    //create a 3D geometry from the shape and apply the wall material, then position it in the scene
    //const extrudeSettingsBW = { depth: thickness, bevelEnabled: false, curveSegments: 32 };
    const backWallGeom = new THREE.ShapeGeometry(backWallShape);

    //fix for the textures
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

    //create a mesh from the geometry and add it to the scene
    const backWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    backWallMesh.position.set(divisorWallX + (mainRoomWidth / 2), 0, -depth / 2);
    scene.add(backWallMesh);

    const frontWallMesh = new THREE.Mesh(backWallGeom, wallMaterial);
    frontWallMesh.rotation.y = Math.PI; 
    frontWallMesh.position.set(divisorWallX + (mainRoomWidth / 2), 0, depth / 2);
    scene.add(frontWallMesh);

    //create the window frames for the back wall windows and add them to a group, then add the group to the scene
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

    //ceiling created using a PlaneGeometry in this way it can be seen only from below
    //allowing the player to see the interior of the restaurant from above without obstruction
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

    //lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    //controls for the camera using OrbitControls, allowing the player to rotate, zoom, and pan the camera
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

    spawnPenguin(-10, 0, -10);
    spawnPenguin(-20, 0, 5);
    loadFurniture(scene, 'models/furniture/kitchenSink.glb', -55, -10, Math.PI / 2);
    loadFurniture(scene, 'models/furniture/kitchenFridgeLarge.glb', -56, 10, Math.PI / 2);

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    if (isPaused) return;
    
    if (window.gameControls) {
        window.gameControls.update();
    }

    //window groups visibility based on camera position to prevent obstruction of view 
    if (window.backWindowsGroup) {
        window.backWindowsGroup.visible = camera.position.z > -25;
    }

    if (window.frontWindowsGroup) {
        window.frontWindowsGroup.visible = camera.position.z < 25;
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

//function to create a window frame with specified width, height, corner radius, frame thickness, depth, and material
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