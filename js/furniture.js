// Loading and creation of furniture
import { state } from './state.js';

export function loadFurniture(scene, path, x, z, rotation, y = 0, scale = 13, openable = false, interactable_chair = false, tray = false, upsideDownRotation = 0, tableId = null) {
    const loader = new THREE.GLTFLoader();

    loader.load(path, (gltf) => {
        const model = gltf.scene;

        console.log(model)
        model.position.set(x, y, z);
        model.rotation.y = rotation;
        
        if (upsideDownRotation !== 0) {
            model.rotation.x = upsideDownRotation;
        }

        model.scale.set(scale, scale, scale);
        
        if (interactable_chair) {
                model.userData.isInteractable = true;
                model.userData.interactionType = 'chair';
                model.userData.isOccupied = false;  
        }
        if (tray) {
            model.userData.isInteractable = true;
            model.userData.interactionType = 'tray';
        }

        if (tableId) {
            model.userData.tableId = tableId;
        }

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (openable){
                    const name = child.name.toLowerCase();
                    if (name.includes('door') || name.includes('handle')){

                        let doorGroup = child;
                        while (doorGroup.parent && doorGroup.parent.name.toLowerCase().includes('door')) {
                            doorGroup = doorGroup.parent;
                        }
                        child.userData.targetToRotate = doorGroup;

                        if (doorGroup.userData.isOpen === undefined) {
                            doorGroup.userData.isOpen = false;
                            doorGroup.userData.originalRotation = doorGroup.rotation.y;
                            doorGroup.userData.rotationAxis = 'y'; 
                             
                            const groupName = doorGroup.name.toLowerCase();
                            if (groupName.includes("left")) doorGroup.userData.openAngle = -Math.PI/2;
                            else if (groupName.includes('right')) doorGroup.userData.openAngle = Math.PI/2;
                            else doorGroup.userData.openAngle = Math.PI/2;
                        }
                    }
                }
            }
        });

        scene.add(model);

        state.colliders.push(model);
        console.log(`Furniture loaded: ${path} as ${model.name}`); // Piccolo aggiornamento al log
    }, undefined, (error) => {
        console.error(`Loading error ${path}:`, error);
    });
}

export function loadDoor(scene, path, x, y, z, rotation, scale = 10){
    const loader = new THREE.GLTFLoader();

    loader.load(path, (gltf) => {
        const doorModel = gltf.scene;

        doorModel.updateMatrixWorld(true);

        const rawBox = new THREE.Box3().setFromObject(doorModel);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        rawBox.getSize(size);
        rawBox.getCenter(center);

        doorModel.position.set(-rawBox.min.x, -rawBox.min.y, -center.z);

        const hingeGroup = new THREE.Group();
        hingeGroup.position.set(x, y, z);
        hingeGroup.rotation.y = rotation;
        hingeGroup.translateX(-(size.x * scale) / 2);
        hingeGroup.scale.set(scale, scale, scale);

        hingeGroup.userData.isOpen = false;
        hingeGroup.userData.originalRotation = hingeGroup.rotation.y;

        hingeGroup.add(doorModel);
        scene.add(hingeGroup);

        state.colliders.push(hingeGroup);

        doorModel.traverse((child) => {
            if (child.isMesh){
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.isInteractable = true;
                child.userData.doorType = 'single';
                child.userData.targetToRotate = hingeGroup;
            }
        });

        console.log(`Door loaded and aligned: ${path}`);
    }, undefined, (error) => {
        console.error(`Error while loading the door ${path}:`, error);
    });
}

export function createWindowFrame(w, h, r, frameThick, depth, material) {
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
        roughness: 0.5,
        metalness: 0.0,
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
    ray1.position.set(-rayLength/2*Math.cos(Math.PI/4), h + rayLength/2*Math.sin(Math.PI/4), 0);
    ray1.rotation.z = 3 * Math.PI/4;
    group.add(ray1);

    const ray2 = new THREE.Mesh(rayGeom, material);
    ray2.position.set(rayLength/2*Math.cos(Math.PI/4), h + rayLength/2*Math.sin(Math.PI/4), 0);
    ray2.rotation.z = Math.PI/4;
    group.add(ray2);

    return group;
}

export function loadFoodModels() {
    const loader = new THREE.GLTFLoader();

    loader.load('models/food/plate.glb', (gltf) => {
        const model = gltf.scene;
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        
        state.models.plate = model; 
    });

    loader.load('models/food/burger-cheese-double.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.hamburger = model;
        state.foodIcons.hamburger = create3DTo2DIcon(model);
    });

    loader.load('models/food/hot-dog.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.hotdog = model;
        state.foodIcons.hotdog = create3DTo2DIcon(model);
    });

    loader.load('models/food/fish.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.fish = model;
        state.foodIcons.fish = create3DTo2DIcon(model);
    });

    loader.load('models/food/taco.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.taco = model;
        state.foodIcons.taco = create3DTo2DIcon(model);
    });

    loader.load('models/food/cheese.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.cheese = model;
        state.foodIcons.cheese = create3DTo2DIcon(model);
    });

    loader.load('models/food/cupcake.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.cupcake = model;
        state.foodIcons.cupcake = create3DTo2DIcon(model);
    });

    loader.load('models/food/meat-cooked.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.meat = model;
        state.foodIcons.meat = create3DTo2DIcon(model);
    });

    loader.load('models/food/turkey.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = false;
            }
        });
        state.models.turkey = model;
        state.foodIcons.turkey = create3DTo2DIcon(model);
    });
}

export function create3DTo2DIcon(model) {
    const tempRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    tempRenderer.setSize(128, 128); 

    const tempScene = new THREE.Scene();
    const tempCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    tempCamera.position.set(0, 3, 6); 
    tempCamera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(5, 10, 5);
    tempScene.add(ambientLight, dirLight);

    const iconModel = model.clone();

    const box = new THREE.Box3().setFromObject(iconModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const scale = 3.5 / maxDim; 
    iconModel.scale.set(scale, scale, scale);
    iconModel.position.sub(center.multiplyScalar(scale)); 
    
    iconModel.rotation.y = Math.PI / 4; 
    iconModel.rotation.x = Math.PI / 8;

    tempScene.add(iconModel);

    tempRenderer.render(tempScene, tempCamera);
    const dataURL = tempRenderer.domElement.toDataURL("image/png");

    tempRenderer.dispose();

    return dataURL; 
}

export function createProceduralClock(scene, x, y, z, rotation, scale) {
    const clockGroup = new THREE.Group();
    clockGroup.name = 'AnalogClock';

    const rimGeom = new THREE.CylinderGeometry(5.5, 5.5, 1, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2; 
    clockGroup.add(rim);

    const faceGeom = new THREE.CylinderGeometry(5, 5, 1.1, 32);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const face = new THREE.Mesh(faceGeom, faceMat);
    face.rotation.x = Math.PI / 2;
    clockGroup.add(face);

    const tickMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for (let i = 0; i < 12; i++) {
        const isMainHour = (i % 3 === 0);
        const tickGeom = new THREE.BoxGeometry(isMainHour ? 0.4 : 0.2, isMainHour ? 1.5 : 1, 1.2);
        const tick = new THREE.Mesh(tickGeom, tickMat);
        
        const angle = (i / 12) * Math.PI * 2;
        tick.position.set(Math.sin(angle) * 4.2, Math.cos(angle) * 4.2, 0);
        tick.rotation.z = -angle;
        
        clockGroup.add(tick);
    }

    const hourMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const hourHandGeom = new THREE.BoxGeometry(0.6, 3.0, 1.3);
    hourHandGeom.translate(0, 1.5, 0); 
    const hourHand = new THREE.Mesh(hourHandGeom, hourMat);
    clockGroup.add(hourHand);

    const minHandGeom = new THREE.BoxGeometry(0.3, 4.5, 1.4);
    minHandGeom.translate(0, 2.25, 0); 
    const minHand = new THREE.Mesh(minHandGeom, hourMat);
    clockGroup.add(minHand);

    const pinGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
    const pin = new THREE.Mesh(pinGeom, pinMat);
    pin.rotation.x = -Math.PI / 2;
    clockGroup.add(pin);

    clockGroup.position.set(x, y, z);
    clockGroup.rotation.y = rotation;
    clockGroup.scale.set(scale, scale, scale);

    clockGroup.userData.hourHand = hourHand;
    clockGroup.userData.minuteHand = minHand;
    state.models.clock = clockGroup;

    clockGroup.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    scene.add(clockGroup);
    state.colliders.push(clockGroup);
    console.log(`Procedural clock created at ${x}, ${y}, ${z}`);
    
    return clockGroup;
}