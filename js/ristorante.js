// js/ristorante.js

// =========================================================================
// VARIABILI GLOBALI DI RIFERIMENTO
// =========================================================================
// Dichiarate qui per permettere alla funzione impostaCielo di controllarle
let luceAmbientaleGlobale;
let soleGlobale;

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

    // Materiali (Mantenuti i tuoi valori esatti)
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

    // =========================================================================
    // B) PARETE RETRO (DI FONDO) CON 3 GRANDI VETRATE (Z = -5)
    // =========================================================================
    // Sostituiamo la vecchia parete solida con una struttura a pilastri e vetri trasparenti.
    
    // Materiale per il Vetro: MeshPhysicalMaterial per riflessi realistici e trasparenza
    const matVetro = new THREE.MeshPhysicalMaterial({
        color: 0xccf2ff,        // Tonalità azzurro ghiaccio
        transparent: true,     // Abilita la trasparenza
        opacity: 0.25,          // Molto trasparente
        roughness: 0.1,         // Lucido
        metalness: 0.1,
        transmission: 0.9,      // Fa passare la luce esterna
        ior: 1.5,               // Indice di rifrazione del vetro
        side: THREE.DoubleSide  // Visibile da dentro e fuori
    });

    // 1. Il muretto basso di base (Zoccolo)
    const geoZoccolo = new THREE.PlaneGeometry(10, 0.6);
    const zoccolo = new THREE.Mesh(geoZoccolo, matPareti);
    zoccolo.position.set(0, 0.3, -5); // Posizionato a Z = -5 (muro di fondo)
    zoccolo.castShadow = true;
    zoccolo.receiveShadow = true;
    stanzaGroup.add(zoccolo);

    // 2. La trave superiore del soffitto
    const geoTrave = new THREE.PlaneGeometry(10, 0.6);
    const trave = new THREE.Mesh(geoTrave, matPareti);
    trave.position.set(0, 4.7, -5);   
    trave.castShadow = true;
    trave.receiveShadow = true;
    stanzaGroup.add(trave);

    // 3. I 4 Pilastri verticali di ghiaccio
    const geoPilastro = new THREE.PlaneGeometry(0.4, 3.8);
    const posizioniPilastriX = [-4.8, -1.6, 1.6, 4.8];
    
    posizioniPilastriX.forEach(posX => {
        const pilastro = new THREE.Mesh(geoPilastro, matPareti);
        pilastro.position.set(posX, 2.5, -5); // Centrato verticalmente a Y = 2.5
        pilastro.castShadow = true;
        pilastro.receiveShadow = true;
        stanzaGroup.add(pilastro);
    });

    // 4. I 3 Grandi Pannelli di Vetro che guardano l'oceano
    const geoVetro = new THREE.PlaneGeometry(2.8, 3.8);
    const posizioniVetriX = [-3.2, 0, 3.2]; 
    
    posizioniVetriX.forEach(posX => {
        const vetro = new THREE.Mesh(geoVetro, matVetro);
        vetro.position.set(posX, 2.5, -5); 
        vetro.receiveShadow = true; 
        stanzaGroup.add(vetro);
    });

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
    // Assegniamo la luce alla variabile globale
    luceAmbientaleGlobale = new THREE.AmbientLight(0xeeffff, 0.3);
    scene.add(luceAmbientaleGlobale);

    // Assegniamo la SpotLight alla variabile globale (Mantenute le tue coordinate)
    soleGlobale = new THREE.SpotLight(0xffffff, 0.75); 
    soleGlobale.position.set(-3, 11, -3); 
    soleGlobale.target.position.set(0, 0, 0); 
    scene.add(soleGlobale.target);

    soleGlobale.angle = Math.PI / 3.5; 
    soleGlobale.penumbra = 0.4;        
    soleGlobale.castShadow = true;
    soleGlobale.shadow.mapSize.width = 2048;  
    soleGlobale.shadow.mapSize.height = 2048; 
    soleGlobale.shadow.camera.near = 0.5;
    soleGlobale.shadow.camera.far = 25;

    scene.add(soleGlobale);
}

// =========================================================================
// FUNZIONE DI CAMBIO CICLO GIORNO / NOTTE (Chiamata dai pulsanti HTML)
// =========================================================================
function impostaCielo(stato) {
    let coloreCielo, intensitaAmbiente, intensitaSole;

    if (stato === 'giorno') {
        coloreCielo = 0xd0e3f0;        // Azzurro artico chiaro diurno
        intensitaAmbiente = 0.3;       // Intensità iniziale del tuo codice
        intensitaSole = 0.75;          // Intensità iniziale della tua SpotLight
    } else if (stato === 'notte') {
        coloreCielo = 0x0a0f1d;        // Blu notte polare profondo
        intensitaAmbiente = 0.05;      // Chiarore minimo notturno
        intensitaSole = 0.15;          // La SpotLight diventa un debole riflesso della luna
    }

    // Cambiamo il colore dello sfondo
    scene.background.setHex(coloreCielo);
    
    // Cambiamo il colore della nebbia allineandolo allo sfondo
    if (scene.fog) {
        scene.fog.color.setHex(coloreCielo);
    }

    // Applichiamo le nuove intensità alle sorgenti luminose
    if (luceAmbientaleGlobale) {
        luceAmbientaleGlobale.intensity = intensitaAmbiente;
    }

    if (soleGlobale) {
        soleGlobale.intensity = intensitaSole;
    }
}