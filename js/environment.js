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



function loadFurniture(scene, path, x, z, scale = 1000) {
    const loader = new THREE.GLTFLoader();

    loader.load(path, (gltf) => {
        const model = gltf.scene;
        console.log(model)
        model.position.set(x, 0, z);
        model.scale.set(scale, scale, scale);
        
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.scale.set(scale, scale, scale);
            }
        });

        scene.add(model);
        console.log(`Mobile caricato: ${path}`);
    }, undefined, (error) => {
        console.error(`Errore caricamento ${path}:`, error);
    });
}