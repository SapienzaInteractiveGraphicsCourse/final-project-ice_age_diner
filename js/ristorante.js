// js/ristorante.js

// js/ristorante.js

// =========================================================================
// VARIABILI GLOBALI DI RIFERIMENTO
// =========================================================================
let luceAmbientaleGlobale;
let soleGlobale;
let meshMare; 
const listaIcebergMelting = []; 
const listaFaretti = []; // <--- NUOVA: Conterrà i faretti e i loro materiali emissivi

function buildRistorante(scene) {
    const stanzaGroup = new THREE.Group();

    // Caricamento texture classiche delle pareti e del pavimento
    const textureLoader = new THREE.TextureLoader();
    const textureMuro = textureLoader.load('textures/ghiaccio_muro.jpg');
    const texturePavimento = textureLoader.load('textures/ghiaccio_pavimento.jpg');

    textureMuro.wrapS = THREE.RepeatWrapping; 
    textureMuro.wrapT = THREE.RepeatWrapping; 
    textureMuro.repeat.set(4, 2); 

    texturePavimento.wrapS = THREE.RepeatWrapping;
    texturePavimento.wrapT = THREE.RepeatWrapping;
    texturePavimento.repeat.set(1, 1); 

    // Materiali del ristorante - Configurato in MeshPhysicalMaterial per supportare il clearcoat del ghiaccio
    const matPavimento = new THREE.MeshPhysicalMaterial({ 
        map: texturePavimento, 
        roughness: 0.2,  
        clearcoat: 1.5,
        clearcoatRoughness: 0.3
    });
    const matPareti = new THREE.MeshStandardMaterial({ map: textureMuro, roughness: 0.6 });

    // A) Pavimento del locale (10x10 metri, esteso da -5 a +5 su X e Z)
    const geoPavimento = new THREE.PlaneGeometry(10, 10);
    const pavimento = new THREE.Mesh(geoPavimento, matPavimento);
    pavimento.rotation.x = -Math.PI / 2; 
    pavimento.receiveShadow = true; 
    stanzaGroup.add(pavimento);

    // B) PARETE RETRO CON LE 3 GRANDI VETRATE (Z = -5)
    const matVetro = new THREE.MeshPhysicalMaterial({
        color: 0xccf2ff,
        transparent: true,
        opacity: 0.25,
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.9,
        ior: 1.5,
        side: THREE.DoubleSide
    });

    const geoZoccolo = new THREE.PlaneGeometry(10, 0.6);
    const zoccolo = new THREE.Mesh(geoZoccolo, matPareti);
    zoccolo.position.set(0, 0.3, -5); 
    zoccolo.castShadow = true;
    zoccolo.receiveShadow = true;
    stanzaGroup.add(zoccolo);

    const geoTrave = new THREE.PlaneGeometry(10, 0.6);
    const trave = new THREE.Mesh(geoTrave, matPareti);
    trave.position.set(0, 4.7, -5);   
    trave.castShadow = true;
    trave.receiveShadow = true;
    stanzaGroup.add(trave);

    const geoPilastro = new THREE.PlaneGeometry(0.4, 3.8);
    const posizioniPilastriX = [-4.8, -1.6, 1.6, 4.8];
    posizioniPilastriX.forEach(posX => {
        const pilastro = new THREE.Mesh(geoPilastro, matPareti);
        pilastro.position.set(posX, 2.5, -5); 
        pilastro.castShadow = true;
        pilastro.receiveShadow = true;
        stanzaGroup.add(pilastro);
    });

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

    // F) GRIGLIA STRUTTURALE SUL SOFFITTO (Y = 5) E FARETTI NOTTURNI
    const matGriglia = new THREE.MeshStandardMaterial({ color: 0x1a2e3b, roughness: 0.5, metalness: 0.8 });
    const spessoreTrave = 0.08; const altezzaTrave = 0.08; const lunghezzaTotale = 10; 
    const passiGriglia = [-3, 0, 3]; // Ridotti i passi a 3 per avere un'ottima distribuzione (9 faretti totali agli incroci)
    
    passiGriglia.forEach(coordinata => {
        const geoTraveX = new THREE.BoxGeometry(lunghezzaTotale, altezzaTrave, spessoreTrave);
        const traveX = new THREE.Mesh(geoTraveX, matGriglia);
        traveX.position.set(0, 4.95, coordinata);
        traveX.castShadow = true;
        stanzaGroup.add(traveX);

        const geoTraveZ = new THREE.BoxGeometry(spessoreTrave, altezzaTrave, lunghezzaTotale);
        const traveZ = new THREE.Mesh(geoTraveZ, matGriglia);
        traveZ.position.set(coordinata, 4.95, 0);
        traveZ.castShadow = true;
        stanzaGroup.add(traveZ);
    });

    // POSIZIONAMENTO DEI FARETTI AGLI INCROCI DELLA GRIGLIA
    passiGriglia.forEach(x => {
        passiGriglia.forEach(z => {
            // Gruppo contenitore per il faretto
            const farettoGroup = new THREE.Group();
            farettoGroup.position.set(x, 4.9, z);

            // 1. Il corpo metallico del faretto (un piccolo cono/cilindro)
            const geoCorpo = new THREE.CylinderGeometry(0.06, 0.1, 0.12, 16);
            const matCorpo = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
            const corpo = new THREE.Mesh(geoCorpo, matCorpo);
            corpo.position.y = -0.06;
            farettoGroup.add(corpo);

            // 2. La lampadina interna (materiale speciale con proprietà Emissive)
            const geoLampadina = new THREE.SphereGeometry(0.04, 16, 16);
            const matLampadina = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0x000000, // Spenta di default (giorno)
                roughness: 0.1
            });
            const lampadina = new THREE.Mesh(geoLampadina, matLampadina);
            lampadina.position.y = -0.11;
            farettoGroup.add(lampadina);

            // 3. La sorgente di luce reale (SpotLight che punta verso il pavimento)
            const luceFaretto = new THREE.SpotLight(0xfff0dd, 0, 8, Math.PI / 4, 0.5, 1); 
            luceFaretto.position.set(0, -0.12, 0);
            luceFaretto.castShadow = true;
            luceFaretto.shadow.mapSize.width = 512;
            luceFaretto.shadow.mapSize.height = 512;
            
            // Creiamo un target invisibile subito sotto il faretto per direzionare il fascio verso il basso
            const targetInvisibile = new THREE.Object3D();
            targetInvisibile.position.set(0, -5, 0);
            farettoGroup.add(targetInvisibile);
            luceFaretto.target = targetInvisibile;

            farettoGroup.add(luceFaretto);
            stanzaGroup.add(farettoGroup);

            // Salviamo i riferimenti nell'array globale per poterli manipolare al cambio orario
            listaFaretti.push({
                luce: luceFaretto,
                materialeLampadina: matLampadina
            });
        });
    });

    scene.add(stanzaGroup);

    // =========================================================================
    // AMBIENTE ESTERNO: MARE PROCEDURALE REATTIVO ALLE LUCI
    // =========================================================================
    const geoMare = new THREE.PlaneGeometry(500, 500);
    const matMare = new THREE.MeshStandardMaterial({ 
        color: 0x1c3a4e, 
        roughness: 0.2,
        metalness: 0.1
    });
    meshMare = new THREE.Mesh(geoMare, matMare);
    meshMare.rotation.x = -Math.PI / 2;
    meshMare.position.y = -0.05; 
    meshMare.receiveShadow = true;
    scene.add(meshMare);

    // =========================================================================
    // GENERATORE DI ICEBERG REALI (CON ANCORAGGIO DI SICUREZZA AMPLIATO A 22 METRI)
    // =========================================================================
    const numeroIcebergReali = 25; 
    
    const textureIceberg = textureLoader.load('textures/ghiaccio_muro.jpg');
    textureIceberg.wrapS = THREE.RepeatWrapping;
    textureIceberg.wrapT = THREE.RepeatWrapping;
    textureIceberg.repeat.set(1, 1);

    const matIcebergReale = new THREE.MeshStandardMaterial({
        map: textureIceberg,
        color: 0xd9f3ff,     
        roughness: 0.3,
        metalness: 0.1
    });

    // Intercettatore URL per bloccare richieste 404 di texture non indicizzate nel server locale
    const managerBypass = new THREE.LoadingManager();
    managerBypass.setURLModifier((url) => {
        if (url.endsWith('.jpg') || url.endsWith('.png')) {
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }
        return url; 
    });

    const gltfLoaderIceberg = new THREE.GLTFLoader(managerBypass);

    gltfLoaderIceberg.load('models/esterni/rock_moss_set_01_4k.gltf', (gltf) => {
        let geoEstratta = null;

        gltf.scene.traverse((child) => {
            if (child.isMesh && !geoEstratta) {
                geoEstratta = child.geometry; 
            }
        });

        if (!geoEstratta) {
            geoEstratta = new THREE.IcosahedronGeometry(1, 0);
        }

        for (let i = 0; i < numeroIcebergReali; i++) {
            const iceberg = new THREE.Mesh(geoEstratta, matIcebergReale);

            let posX, posZ;
            let siTrovaDentroLaStanza = true;

            while (siTrovaDentroLaStanza) {
                posX = (Math.random() - 0.5) * 160;
                posZ = (Math.random() - 0.5) * 160;

                // CORREZIONE CRITICA: Esteso a 22.0 unità per tenere conto del raggio delle mesh scalate
                if (Math.abs(posX) > 22.0 || Math.abs(posZ) > 22.0) {
                    siTrovaDentroLaStanza = false;
                }
            }

            const scX = 4 + Math.random() * 8;
            const scY = 3 + Math.random() * 6;
            const scZ = 4 + Math.random() * 8;
            iceberg.scale.set(scX, scY, scZ);

            iceberg.position.set(posX, -0.2, posZ);

            iceberg.rotation.x = Math.random() * 0.2; 
            iceberg.rotation.y = Math.random() * Math.PI * 2;
            iceberg.rotation.z = Math.random() * 0.2;

            iceberg.castShadow = true;
            iceberg.receiveShadow = true;

            iceberg.userData = {
                // VELOCITÀ AGGIORNATA: Oscillazione più rapida (range 1.5 - 3.0) per un movimento evidente
                velocitaFluttuazione: 1.5 + Math.random() * 1.5,
                faseOnda: Math.random() * Math.PI * 2,
                altezzaInizialeY: iceberg.position.y,
                velocitaRotazione: (Math.random() - 0.5) * 0.08
            };

            scene.add(iceberg);
            listaIcebergMelting.push(iceberg); 
        }
        console.log("Iceberg Poly Haven posizionati in sicurezza in mare aperto!");
    }, undefined, (err) => {
        console.warn("Algoritmo di fallback d'emergenza attivato.");
        const geoFallback = new THREE.IcosahedronGeometry(1, 0);
        for (let i = 0; i < numeroIcebergReali; i++) {
            const iceberg = new THREE.Mesh(geoFallback, matIcebergReale);
            let posX = (Math.random() - 0.5) * 160;
            let posZ = (Math.random() - 0.5) * 160;
            
            // Stesso blocco di sicurezza a 22 anche nel fallback procedurale
            if (Math.abs(posX) < 22 && Math.abs(posZ) < 22) posZ -= 35;

            const scY = 3 + Math.random() * 6;
            iceberg.scale.set(4 + Math.random() * 8, scY, 4 + Math.random() * 8);
            iceberg.position.set(posX, -0.2, posZ);
            iceberg.castShadow = true; iceberg.receiveShadow = true;
            iceberg.userData = { 
                velocitaFluttuazione: 2.2, // Velocizzato nel fallback
                faseOnda: Math.random(), 
                altezzaInizialeY: iceberg.position.y, 
                velocitaRotazione: 0.04 
            };
            scene.add(iceberg);
            listaIcebergMelting.push(iceberg);
        }
    });
} 

function setupLuci(scene) {
    // 1. LUCE AMBIENTALE DIFFUSA: Aumentiamo l'intensità diurna di base (da 0.3 a 0.6)
    // per dare una forte luminosità generale a tutto il panorama esterno.
    luceAmbientaleGlobale = new THREE.AmbientLight(0xeeffff, 0.6);
    scene.add(luceAmbientaleGlobale);

    // 2. SOLE DIRETZIONALE: Sostituiamo la vecchia SpotLight con una DirectionalLight.
    // I suoi raggi paralleli illumineranno il ristorante, il mare e gli iceberg all'infinito.
    soleGlobale = new THREE.DirectionalLight(0xffffff, 1.2); 
    soleGlobale.position.set(-30, 50, 20); // Posizionato in alto e lateralmente come un vero sole polare
    
    // Attiviamo le ombre direzionali sul mondo
    soleGlobale.castShadow = true;
    
    // Ampliamo l'area di calcolo delle ombre del sole (l'ortografica "box") 
    // per coprire sia il ristorante sia gli iceberg vicini visibili dalle vetrate
    soleGlobale.shadow.camera.left = -30;
    soleGlobale.shadow.camera.right = 30;
    soleGlobale.shadow.camera.top = 30;
    soleGlobale.shadow.camera.bottom = -30;
    
    soleGlobale.shadow.mapSize.width = 2048;  
    soleGlobale.shadow.mapSize.height = 2048; 
    soleGlobale.shadow.camera.near = 0.5;
    soleGlobale.shadow.camera.far = 150;

    scene.add(soleGlobale);
}

function impostaCielo(stato) {
    let coloreCielo, coloreMare, intensitaAmbiente, intensitaSole, coloreSole;
    let intensitaFaretti, coloreEmissiveFaretto;

    if (stato === 'giorno') {
        coloreCielo = 0xd0e3f0;        
        coloreMare = 0x1c3a4e;         
        intensitaAmbiente = 0.6;       
        intensitaSole = 1.2;           
        coloreSole = 0xffffff;
        
        // Di giorno i faretti sono completamente spenti
        intensitaFaretti = 0;
        coloreEmissiveFaretto = 0x000000;
    } else if (stato === 'notte') {
        coloreCielo = 0x070b12;        
        coloreMare = 0x0b141d;         
        intensitaAmbiente = 0.08;      
        intensitaSole = 0.25;          
        coloreSole = 0x7fa1ff;         
        
        // Di notte i faretti si accendono con una bella luce calda e intensa sul tavolo/pavimento
        intensitaFaretti = 1; 
        coloreEmissiveFaretto = 0xfff0dd; // Bagliore caldo della lampadina calda
    }

    if (typeof scene !== 'undefined') {
        scene.background = new THREE.Color(coloreCielo);
        if (scene.fog) {
            scene.fog.color.setHex(coloreCielo);
        }
    }

    if (meshMare && meshMare.material) {
        meshMare.material.color.setHex(coloreMare);
    }

    if (luceAmbientaleGlobale) {
        luceAmbientaleGlobale.intensity = intensitaAmbiente;
    }

    if (soleGlobale) {
        soleGlobale.intensity = intensitaSole;
        soleGlobale.color.setHex(coloreSole);
    }

    // AGGIORNAMENTO DINAMICO DEI FARETTI
    listaFaretti.forEach(faretto => {
        // Regola la potenza della luce proiettata a terra
        faretto.luce.intensity = intensitaFaretti;
        // Cambia il colore del materiale della sfera interna per farla sembrare accesa/accesa a neon
        faretto.materialeLampadina.emissive.setHex(coloreEmissiveFaretto);
    });
}