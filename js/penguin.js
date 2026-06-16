// js/penguin.js

function createHierarchicalPenguin() {
    // 1. Il Nodo Radice del Pinguino (un gruppo invisibile che tiene insieme tutto)
    const penguinGroup = new THREE.Group();

    // --- MATERIALI COERENTI ---
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.6 });
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5 });

    // 2. IL CORPO (Nodo Padre Principale)
    const bodyGeometry = new THREE.CylinderGeometry(1, 1.2, 2.5, 16);
    const bodyMesh = new THREE.Mesh(bodyGeometry, blackMat);
    bodyMesh.position.y = 1.4; // Alzato un po' di più per fare spazio ai piedini
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    penguinGroup.add(bodyMesh);

    // 2b. LA PANCIA BIANCA (Figlia del corpo)
    const bellyGeometry = new THREE.CylinderGeometry(0.85, 1.05, 2.0, 16, 1, false, 0, Math.PI);
    const bellyMesh = new THREE.Mesh(bellyGeometry, whiteMat);
    bellyMesh.position.set(0, -0.1, 0.2); // Leggermente in avanti rispetto al centro del corpo
    bellyMesh.rotation.y = -Math.PI / 2;  // Orientata verso il davanti
    bodyMesh.add(bellyMesh);

    // 3. LA TESTA (Figlia del corpo)
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMesh = new THREE.Mesh(headGeometry, blackMat);
    headMesh.position.y = 1.6; // Posizionata SOPRA il corpo
    headMesh.castShadow = true;
    bodyMesh.add(headMesh);

    // 4. BECCO (Figlio della testa)
    const beakGeometry = new THREE.ConeGeometry(0.2, 0.5, 4);
    const beakMesh = new THREE.Mesh(beakGeometry, orangeMat);
    beakMesh.position.set(0, 0, 0.8); // Davanti alla testa
    beakMesh.rotation.x = Math.PI / 2; // Ruotato in avanti
    headMesh.add(beakMesh);

    // 4b. OCCHI (Figli della testa)
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 }); // Neri lucidi
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.25, 0.2, 0.7);
    headMesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.25, 0.2, 0.7);
    headMesh.add(rightEye);

    // --- STRUTTURA DELLE ALI ---
    const wingGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.5);

    // 5. ALA DESTRA (Figlia del corpo)
    const rightWingGroup = new THREE.Group();
    rightWingGroup.position.set(1.3, 0.5, 0); // Spalla destra
    
    const rightWingMesh = new THREE.Mesh(wingGeometry, blackMat);
    rightWingMesh.position.y = -0.5; // Sposta giù rispetto al fulcro della spalla
    rightWingMesh.castShadow = true;
    
    rightWingGroup.add(rightWingMesh);
    bodyMesh.add(rightWingGroup);

    // 6. ALA SINISTRA (Figlia del corpo)
    const leftWingGroup = new THREE.Group();
    leftWingGroup.position.set(-1.3, 0.5, 0); // Spalla sinistra
    
    const leftWingMesh = new THREE.Mesh(wingGeometry, blackMat);
    leftWingMesh.position.y = -0.5; // Sposta giù rispetto al fulcro
    leftWingMesh.castShadow = true;
    
    leftWingGroup.add(leftWingMesh);
    bodyMesh.add(leftWingGroup);

    // --- I PIEDINI ARANCIONI ---
    const footGeometry = new THREE.BoxGeometry(0.4, 0.15, 0.8);

    // 7. PIEDE DESTRO (Figlio del corpo, sporge dal basso)
    const rightFoot = new THREE.Mesh(footGeometry, orangeMat);
    rightFoot.position.set(0.5, -1.35, 0.3); // Posizionato sotto e un po' in avanti
    rightFoot.castShadow = true;
    bodyMesh.add(rightFoot);

    // 8. PIEDE SINISTRO (Figlio del corpo)
    const leftFoot = new THREE.Mesh(footGeometry, orangeMat);
    leftFoot.position.set(-0.5, -1.35, 0.3);
    leftFoot.castShadow = true;
    bodyMesh.add(leftFoot);

    // Memorizziamo tutti i riferimenti che serviranno a Tween.js per le animazioni
    penguinGroup.userData = {
        body: bodyMesh,
        head: headMesh,
        rightWing: rightWingGroup,
        leftWing: leftWingGroup,
        rightFoot: rightFoot,
        leftFoot: leftFoot
    };

    return penguinGroup;
}