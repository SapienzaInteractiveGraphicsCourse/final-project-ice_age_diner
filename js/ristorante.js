// js/ristorante.js

function buildRistorante(scene) {
    const stanzaGroup = new THREE.Group();

    // Caricamento texture (notare il nuovo percorso cartella textures/)
    const textureLoader = new THREE.TextureLoader();
    const textureMuro = textureLoader.load('textures/ghiaccio_muro.jpg');
    const texturePavimento = textureLoader.load('textures/ghiaccio_pavimento.jpg');

    textureMuro.wrapS = THREE.RepeatWrapping; 
    textureMuro.wrapT = THREE.RepeatWrapping; 
    textureMuro.repeat.set(4, 2); 

    texturePavimento.wrapS = THREE.RepeatWrapping;
    texturePavimento.wrapT = THREE.RepeatWrapping;
    texturePavimento.repeat.set(1, 1); 

    // Materiali
    const matPavimento = new THREE.MeshStandardMaterial({ 
        map: texturePavimento, 
        roughness: 0.2,  
        clearcoat: 1.5,
        clearcoatRoughness: 0.3
    });
    const matPareti = new THREE.MeshStandardMaterial({ map: textureMuro, roughness: 0.6 });

    // A) Pavimento
    const geoPavimento = new THREE.PlaneGeometry(10, 10);
    const pavimento = new THREE.Mesh(geoPavimento, matPavimento);
    pavimento.rotation.x = -Math.PI / 2; 
    pavimento.receiveShadow = true; 
    stanzaGroup.add(pavimento);

    // B) Parete Retro
    const geoPareteRetro = new THREE.PlaneGeometry(10, 5);
    const pareteRetro = new THREE.Mesh(geoPareteRetro, matPareti);
    pareteRetro.position.set(0, 2.5, -5); 
    pareteRetro.castShadow = true;
    pareteRetro.receiveShadow = true;
    stanzaGroup.add(pareteRetro);

    // C) Parete Sinistra
    const geoPareteSinistra = new THREE.PlaneGeometry(10, 5);
    const pareteSinistra = new THREE.Mesh(geoPareteSinistra, matPareti);
    pareteSinistra.position.set(-5, 2.5, 0);
    pareteSinistra.rotation.y = Math.PI / 2; 
    pareteSinistra.castShadow = true;
    pareteSinistra.receiveShadow = true;
    stanzaGroup.add(pareteSinistra);

    // D) Parete Destra
    const geoPareteDestra = new THREE.PlaneGeometry(10, 5);
    const pareteDestra = new THREE.Mesh(geoPareteDestra, matPareti);
    pareteDestra.position.set(5, 2.5, 0);
    pareteDestra.rotation.y = -Math.PI / 2; 
    pareteDestra.castShadow = true;
    pareteDestra.receiveShadow = true;
    stanzaGroup.add(pareteDestra);

    scene.add(stanzaGroup);

    // Aggiungiamo anche il Mare Mare isolato
    const geoMare = new THREE.PlaneGeometry(300, 300);
    const matMare = new THREE.MeshBasicMaterial({ color: 0x1c3a4e });
    const mare = new THREE.Mesh(geoMare, matMare);
    mare.rotation.x = -Math.PI / 2;
    mare.position.y = -0.05; 
    scene.add(mare);
}

function setupLuci(scene) {
    const ambientLight = new THREE.AmbientLight(0xeeffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.SpotLight(0xffffff, 0.75); // Regolata intensità non accecante
    sunLight.position.set(-3, 11, -3); 
    sunLight.target.position.set(0, 0, 0); 
    scene.add(sunLight.target);

    sunLight.angle = Math.PI / 3.5; 
    sunLight.penumbra = 0.4;        
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;  
    sunLight.shadow.mapSize.height = 2048; 
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 25;

    scene.add(sunLight);
}