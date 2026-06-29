let waterTime = 0;
function loadEnvironment(scene, icebergsArray){
    const waterGeometry = new THREE.PlaneGeometry(500, 500);
    const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI/2;
    water.position.y = -2 + Math.sin(waterTime * 0.01) * 0.2;
    water.frustumCulled = false; // Ensure the water is always rendered
    scene.add(water);

    createIcebergs(scene, icebergsArray, 10);
}



function loadFurniture(scene, path, x, z, rotation, y = 0, scale = 13, openable = false){
    const loader = new THREE.GLTFLoader();

    loader.load(path, (gltf) => {
        const model = gltf.scene;
        console.log(model)
        model.position.set(x, y, z);
        model.rotation.y = rotation;
        model.scale.set(scale, scale, scale);
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (openable){
                    const name = child.name.toLowerCase();
                    
                    if (name.includes('door')){
                        child.userData.isInteractable = true;
                        child.userData.isOpen = false;
                        
                        child.userData.doorType = name.includes('left') ? 'left' : 'right';
                        
                        child.userData.originalRotation = child.rotation.y;
                    }
                }
            }
        });

        scene.add(model);

        if (window.colliders){
            window.colliders.push(model);
        }
        console.log(`Furniture loaded: ${path}`);
    }, undefined, (error) => {
        console.error(`Loading error ${path}:`, error);
    });
}


function loadDoor(scene, path, x, y, z, rotation, scale = 10){
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

        if (window.colliders){
            window.colliders.push(hingeGroup);
        }
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

function createIcebergs(scene, icebergsArray, count) {
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xe0ffff, // light cyan color for ice
        roughness: 0.2,
        metalness: 0.1,
        flatShading: true, // to give it a more faceted look
        transparent: true,
        opacity: 0.95
    });

    for (let i = 0; i < count; i++) {
        const geometry = new THREE.DodecahedronGeometry(5, 1);
        const pos = geometry.attributes.position;
        const vertex = new THREE.Vector3();
        
        // to save the displacement values for vertices that share the same direction
        const displacementMap = {};

        for (let v = 0; v < pos.count; v++) {
            vertex.fromBufferAttribute(pos, v);
            
            vertex.normalize();
            // Create a unique key for the vertex based on its normalized position
            const key = Math.round(vertex.x * 100) + '_' + Math.round(vertex.y * 100) + '_' + Math.round(vertex.z * 100);
            
            let deform;
            if (displacementMap[key]) {
                // if we've already calculated a deformation for this direction, reuse it
                deform = displacementMap[key];
            } else {
                // if it's a new angle, calculate a random deformation and save it
                deform = {
                    radius: 4 + Math.random() * 3,
                    heightStretch: 1 + (Math.random() * 1.5)
                };
                displacementMap[key] = deform;
            }
            
            vertex.multiplyScalar(deform.radius);
            
            // Stretch the height of the iceberg based on its y-coordinate
            if (vertex.y > 0) {
                vertex.y *= deform.heightStretch;
            } else {
                vertex.y *= 0.5;
            }

            pos.setXYZ(v, vertex.x, vertex.y, vertex.z);
        }
        
        
        geometry.computeVertexNormals();

        const iceberg = new THREE.Mesh(geometry, material);
        
        const angle = Math.random() * Math.PI * 2;
        const minDistance = 110; 
        const maxDistance = 220; 
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        
        iceberg.position.set(
            Math.cos(angle) * distance,
            -2, 
            Math.sin(angle) * distance
        );
        
        // Random scale for variety
        const scale = 1 + Math.random() * 2;
        iceberg.scale.set(scale, scale, scale);
        
        scene.add(iceberg);

        // 50% the iceberg is moving, 50% is stationary
        const isMoving = Math.random() > 0.5;
        const speedX = isMoving ? (Math.random() * 0.04 - 0.02) : 0;

        // data for the animation
        icebergsArray.push({
            mesh: iceberg,
            initialY: -2,
            bobSpeed: 0.01 + Math.random() * 0.02, 
            //to make them move separatly
            bobOffset: Math.random() * Math.PI * 2, 
            driftX: speedX
        });
    }
}


function animateIcebergs(icebergsArray) {
    waterTime += 1; 

    for (let i = 0; i < icebergsArray.length; i++) {
        let data = icebergsArray[i];
        let icebergMesh = data.mesh;

        //movement on y
        icebergMesh.position.y = data.initialY + Math.sin((waterTime * data.bobSpeed) + data.bobOffset) * 1.5;

        icebergMesh.position.x += data.driftX;

        // Wrap around the scene if the iceberg drifts too far
        if (icebergMesh.position.x > 200) {
            icebergMesh.position.x = -200;
        } else if (icebergMesh.position.x < -200) {
            icebergMesh.position.x = 200;
        }
    }
}