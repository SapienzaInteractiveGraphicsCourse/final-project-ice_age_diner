function loadEnvironment(scene, icebergsArray) {
    const waterGeometry = new THREE.PlaneGeometry(500, 500);
    const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -2;
    scene.add(water);

    /*const loader = new THREE.GLTFLoader();
    loader.load('models/outside/rock_moss_set_01_4k.gltf', (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0x808080, 
                    roughness: 0.8 
                });
                const iceberg = child.clone();
                iceberg.position.set(Math.random() * 100 - 50, -3, Math.random() * 100 - 50);
                iceberg.scale.set(5, 5, 5);
                scene.add(iceberg);
                
                icebergsArray.push({ 
                    mesh: iceberg, 
                    initialY: iceberg.position.y, 
                    speed: Math.random() * 0.02 
                });
            }
        });
        console.log("Iceberg caricati con successo!"); 
        }, undefined, (error) => {
            console.error("ERRORE CARICAMENTO GLTF:", error);
    });*/

}



function loadFurniture(scene, path, x, z, rotation, y = 0, scale = 13, openable = false) {
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

                if (openable) {
                    const name = child.name.toLowerCase();
                    
                    if (name.includes('door')) {
                        child.userData.isInteractable = true;
                        child.userData.isOpen = false;
                        
                        child.userData.doorType = name.includes('left') ? 'left' : 'right';
                        
                        child.userData.originalRotation = child.rotation.y;
                    }
                }
            }
        });

        scene.add(model);
        console.log(`Mobile caricato: ${path}`);
    }, undefined, (error) => {
        console.error(`Errore caricamento ${path}:`, error);
    });
}


function loadDoor(scene, path, x, y, z, rotation, scale = 10) {
    const loader = new THREE.GLTFLoader();

    loader.load(path, (gltf) => {
        const doorModel = gltf.scene;
        
        // 1. Creiamo la cerniera invisibile
        const hingeGroup = new THREE.Group();
        hingeGroup.position.set(x, y, z);
        hingeGroup.rotation.y = rotation;
        hingeGroup.scale.set(scale, scale, scale);
        
        hingeGroup.userData.isOpen = false;
        hingeGroup.userData.originalRotation = hingeGroup.rotation.y;

        // 2. Misuriamo la porta per allinearla
        const box = new THREE.Box3().setFromObject(doorModel);
        const width = box.max.x - box.min.x; 
        
        // Spostiamo la porta dentro la cerniera.
        // Se la porta si apre dal lato sbagliato, basterà togliere il " - " qui sotto.
        doorModel.position.x = -(width / 2);

        hingeGroup.add(doorModel);
        scene.add(hingeGroup);

        // 3. Rendiamo cliccabili tutti i pezzi della porta
        doorModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.userData.isInteractable = true;
                child.userData.doorType = 'single'; 
                
                // Diciamo al laser che deve ruotare la cerniera intera, non i singoli pezzi!
                child.userData.targetToRotate = hingeGroup; 
            }
        });
        
        console.log(`Porta caricata: ${path}`);
    }, undefined, (error) => {
        console.error(`Errore caricamento porta ${path}:`, error);
    });
}