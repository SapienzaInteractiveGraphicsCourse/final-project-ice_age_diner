// js/ristorante.js

// =========================================================================
// VARIABILI GLOBALI DI RIFERIMENTO
// =========================================================================
let luceAmbientaleGlobale;
let soleGlobale;
let meshMare; 
const listaIcebergMelting = []; 
const listaFaretti = []; // <--- Conterrà i faretti e i loro materiali emissivi

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
        roughness: 0.4,  
        clearcoat: 1.5,
        clearcoatRoughness: 0.4
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

    // =========================================================================
    // PRIMO MURO ORIZZONTALE (COMPOSIZIONE AD ARCO CON TEXTURE SCALATA CORRETTAMENTE)
    // =========================================================================
    const gruppoMuroCucina = new THREE.Group();
    gruppoMuroCucina.position.set(-3.25, 2.25, 2.05); 

    // 1. MATERIALE COLONNA SINISTRA (Larghezza 0.5, Altezza 4.5)
    const texColonnaSX = textureLoader.load('textures/ghiaccio_muro.jpg');
    texColonnaSX.wrapS = THREE.RepeatWrapping; texColonnaSX.wrapT = THREE.RepeatWrapping;
    texColonnaSX.repeat.set(0.2, 1.8); // Scala proporzionale per mantenere i mattoni grandi uguali
    const matColonnaSX = new THREE.MeshStandardMaterial({ map: texColonnaSX, roughness: 0.6 });

    const geoColonnaSX = new THREE.BoxGeometry(0.5, 4.5, 0.2);
    const colonnaSX = new THREE.Mesh(geoColonnaSX, matColonnaSX);
    colonnaSX.position.set(-1.5, 0, 0); 
    colonnaSX.castShadow = true; colonnaSX.receiveShadow = true;
    gruppoMuroCucina.add(colonnaSX);

    // 2. MATERIALE COLONNA DESTRA (Larghezza 0.5, Altezza 4.5)
    const texColonnaDX = textureLoader.load('textures/ghiaccio_muro.jpg');
    texColonnaDX.wrapS = THREE.RepeatWrapping; texColonnaDX.wrapT = THREE.RepeatWrapping;
    texColonnaDX.repeat.set(0.2, 1.8); 
    const matColonnaDX = new THREE.MeshStandardMaterial({ map: texColonnaDX, roughness: 0.6 });

    const geoColonnaDX = new THREE.BoxGeometry(0.5, 4.5, 0.2);
    const colonnaDX = new THREE.Mesh(geoColonnaDX, matColonnaDX);
    colonnaDX.position.set(1.5, 0, 0); 
    colonnaDX.castShadow = true; colonnaDX.receiveShadow = true;
    gruppoMuroCucina.add(colonnaDX);

    // 3. MATERIALE TRAVE SUPERIORE (Larghezza 2.5, Altezza 0.7)
    const texTrave = textureLoader.load('textures/ghiaccio_muro.jpg');
    texTrave.wrapS = THREE.RepeatWrapping; texTrave.wrapT = THREE.RepeatWrapping;
    texTrave.repeat.set(1.0, 0.28); // Scala proporzionale alla forma allungata e bassa della trave
    const matTrave = new THREE.MeshStandardMaterial({ map: texTrave, roughness: 0.6 });

    const geoTraveArco = new THREE.BoxGeometry(2.5, 0.7, 0.2);
    const traveSopra = new THREE.Mesh(geoTraveArco, matTrave);
    traveSopra.position.set(0, 1.9, 0); 
    traveSopra.castShadow = true; traveSopra.receiveShadow = true;
    gruppoMuroCucina.add(traveSopra);

    stanzaGroup.add(gruppoMuroCucina);

    // =========================================================================
    // SECONDO MURO VERTICALE (CHIUSURA CUCINA CON TEXTURE GHIACCIO)
    // =========================================================================
    const gruppoMuroChiusura = new THREE.Group();
    gruppoMuroChiusura.position.set(-1.5, 2.25, -1.5);

    const geoMuroChiusura = new THREE.BoxGeometry(0.2, 4.5, 7.2); 
    const meshMuroChiusura = new THREE.Mesh(geoMuroChiusura, matPareti);

    meshMuroChiusura.castShadow = true;
    meshMuroChiusura.receiveShadow = true;
    gruppoMuroChiusura.add(meshMuroChiusura);

    stanzaGroup.add(gruppoMuroChiusura);

    // =========================================================================
    // F) GRIGLIA STRUTTURALE SUL SOFFITTO (Y = 5) E FARETTI NOTTURNI (Riconnessi dentro la funzione)
    // =========================================================================
    const matGriglia = new THREE.MeshStandardMaterial({ color: 0x1a2e3b, roughness: 0.5, metalness: 0.8 });
    const spessoreTrave = 0.08; const altezzaTrave = 0.08; const lunghezzaTotale = 10; 
    const passiGriglia = [-3, 0, 3]; 
    
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

    passiGriglia.forEach(x => {
        passiGriglia.forEach(z => {
            const farettoGroup = new THREE.Group();
            farettoGroup.position.set(x, 4.9, z);

            const geoCorpo = new THREE.CylinderGeometry(0.06, 0.1, 0.12, 16);
            const matCorpo = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
            const corpo = new THREE.Mesh(geoCorpo, matCorpo);
            corpo.position.y = -0.06;
            farettoGroup.add(corpo);

            const geoLampadina = new THREE.SphereGeometry(0.04, 16, 16);
            const matLampadina = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: 0x000000, 
                roughness: 0.1
            });
            const lampadina = new THREE.Mesh(geoLampadina, matLampadina);
            lampadina.position.y = -0.11;
            farettoGroup.add(lampadina);

            const luceFaretto = new THREE.SpotLight(0xfff0dd, 0, 8, Math.PI / 4, 0.5, 1); 
            luceFaretto.position.set(0, -0.12, 0);
            luceFaretto.castShadow = true;
            luceFaretto.shadow.mapSize.width = 512;
            luceFaretto.shadow.mapSize.height = 512;
            
            const targetInvisibile = new THREE.Object3D();
            targetInvisibile.position.set(0, -5, 0);
            farettoGroup.add(targetInvisibile);
            luceFaretto.target = targetInvisibile;

            farettoGroup.add(luceFaretto);
            stanzaGroup.add(farettoGroup);

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
    // GENERATORE DI ICEBERG REALI
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
                velocitaFluttuazione: 1.5 + Math.random() * 1.5,
                faseOnda: Math.random() * Math.PI * 2,
                altezzaInizialeY: iceberg.position.y,
                velocitaRotazione: (Math.random() - 0.5) * 0.08
            };

            scene.add(iceberg);
            listaIcebergMelting.push(iceberg); 
        }
    }, undefined, (err) => {
        const geoFallback = new THREE.IcosahedronGeometry(1, 0);
        for (let i = 0; i < numeroIcebergReali; i++) {
            const iceberg = new THREE.Mesh(geoFallback, matIcebergReale);
            let posX = (Math.random() - 0.5) * 160;
            let posZ = (Math.random() - 0.5) * 160;
            if (Math.abs(posX) < 22 && Math.abs(posZ) < 22) posZ -= 35;

            const scY = 3 + Math.random() * 6;
            iceberg.scale.set(4 + Math.random() * 8, scY, 4 + Math.random() * 8);
            iceberg.position.set(posX, -0.2, posZ);
            iceberg.castShadow = true; iceberg.receiveShadow = true;
            iceberg.userData = { 
                velocitaFluttuazione: 2.2, 
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
    luceAmbientaleGlobale = new THREE.AmbientLight(0xeeffff, 0.45);
    scene.add(luceAmbientaleGlobale);

    soleGlobale = new THREE.DirectionalLight(0xffffff, 0.75); 
    soleGlobale.position.set(30, 50, -20); 
    soleGlobale.castShadow = true;
    
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





function impostaCielo(valoreSlider) {
    const v = valoreSlider / 100;
    const stati = {
        giorno: { cielo: 0xd0e3f0, mare: 0x1c3a4e, amb: 0.7, sole: 0.7, soleCol: 0xffffff, faretti: 0.0 },
        tramonto: { cielo: 0xf39c12, mare: 0x3a2312, amb: 0.40, sole: 0.85, soleCol: 0xff6b4a, faretti: 0.4 },
        notte:     { cielo: 0x070b12, mare: 0x0b141d, amb: 0.08, sole: 0.25, soleCol: 0x7fa1ff, faretti: 1.0 }
    };

    let colCielo = new THREE.Color();
    let colMare = new THREE.Color();
    let intAmb, intSole, colSole, intFaretti;

    if (v <= 0.5) {
        const t = v / 0.5;
        colCielo.lerpColors(new THREE.Color(stati.giorno.cielo), new THREE.Color(stati.tramonto.cielo), t);
        colMare.lerpColors(new THREE.Color(stati.giorno.mare), new THREE.Color(stati.tramonto.mare), t);
        colSole = new THREE.Color().lerpColors(new THREE.Color(stati.giorno.soleCol), new THREE.Color(stati.tramonto.soleCol), t);
        intAmb = THREE.MathUtils.lerp(stati.giorno.amb, stati.tramonto.amb, t);
        intSole = THREE.MathUtils.lerp(stati.giorno.sole, stati.tramonto.sole, t);
        intFaretti = THREE.MathUtils.lerp(stati.giorno.faretti, stati.tramonto.faretti, t);
    } else {
        const t = (v - 0.5) / 0.5;
        colCielo.lerpColors(new THREE.Color(stati.tramonto.cielo), new THREE.Color(stati.notte.cielo), t);
        colMare.lerpColors(new THREE.Color(stati.tramonto.mare), new THREE.Color(stati.notte.mare), t);
        colSole = new THREE.Color().lerpColors(new THREE.Color(stati.tramonto.soleCol), new THREE.Color(stati.notte.soleCol), t);
        intAmb = THREE.MathUtils.lerp(stati.tramonto.amb, stati.notte.amb, t);
        intSole = THREE.MathUtils.lerp(stati.tramonto.sole, stati.notte.sole, t);
        intFaretti = THREE.MathUtils.lerp(stati.tramonto.faretti, stati.notte.faretti, t);
    }

    if (typeof scene !== 'undefined') {
        scene.background = colCielo;
        if (scene.fog) scene.fog.color = colCielo;
    }
    if (meshMare && meshMare.material) meshMare.material.color = colMare;
    if (luceAmbientaleGlobale) luceAmbientaleGlobale.intensity = intAmb;
    if (soleGlobale) {
        soleGlobale.intensity = intSole;
        soleGlobale.color = colSole;
    }
    if (typeof listaFaretti !== 'undefined') {
        listaFaretti.forEach(faretto => {
            faretto.luce.intensity = intFaretti;
            const colEmissive = new THREE.Color(0x000000).lerp(new THREE.Color(0xfff0dd), intFaretti);
            faretto.materialeLampadina.emissive = colEmissive;
        });
    }
}



function aggiungiDecorations(scene) {
    const textureLoader = new THREE.TextureLoader();

    // =========================================================================
    // 1. LAVAGNA DEL MENÙ (SPOSTATA SUL NUOVO MURO VERTICALE DELLA CUCINA)
    
    const gruppoLavagna = new THREE.Group();
    
    gruppoLavagna.position.set(-1.38, 2.2, -1.5); 

    const textureMenuSinistra = textureLoader.load("textures/menu.jpg");
    const geoLavagna = new THREE.BoxGeometry(0.13, 2, 3); 
    const matLavagna = new THREE.MeshStandardMaterial({ map: textureMenuSinistra, roughness: 0.6 });
    const meshLavagna = new THREE.Mesh(geoLavagna, matLavagna);
    meshLavagna.castShadow = true;
    meshLavagna.receiveShadow = true;
    gruppoLavagna.add(meshLavagna);

    // Cornice posteriore (ora posizionata a Z negativo rispetto al gruppo per stare dietro il pannello)
    const geoCornice = new THREE.BoxGeometry(0.08, 2.1, 3.1);
    const matCornice = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const meshCornice = new THREE.Mesh(geoCornice, matCornice);
    meshCornice.position.x = -0.03; 
    gruppoLavagna.add(meshCornice);
    
    scene.add(gruppoLavagna);
    
    // =========================================================================
    // 2. PARETE DESTRA: COMPOSIZIONE GENERALE

    function creaPosterDestra(nomeTexture, posZ, posY) {
        const gruppoPoster = new THREE.Group();
        gruppoPoster.position.set(4.9, posY, posZ);

        const tex = textureLoader.load("textures/" + nomeTexture);
        const geoP = new THREE.BoxGeometry(0.09, 1.0, 0.8);
        const matP = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
        const meshP = new THREE.Mesh(geoP, matP);
        meshP.castShadow = true;
        gruppoPoster.add(meshP);

        const geoC = new THREE.BoxGeometry(0.06, 1.06, 0.86);
        const matC = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const meshC = new THREE.Mesh(geoC, matC);
        meshC.position.x = 0.01; 
        gruppoPoster.add(meshC);

        scene.add(gruppoPoster);
    }

    creaPosterDestra("quadro1.jpg", -2.5, 2.5); 
    creaPosterDestra("quadro2.jpg",  0.0, 3.5); 
    creaPosterDestra("quadro3.jpg",  2.5, 2.5); 

    // --- POSTER/LAVAGNA CENTRALE PARETE DESTRA
    const gruppoLavagnaDestra = new THREE.Group();
    gruppoLavagnaDestra.position.set(4.9, 1.7, 0); 

    const textureCentroDestra = textureLoader.load("textures/insegna.jpg");
    const geoLavagnaD = new THREE.BoxGeometry(0.13, 1.5, 2.3); 
    const matLavagnaD = new THREE.MeshStandardMaterial({ map: textureCentroDestra, roughness: 0.6 });
    const meshLavagnaD = new THREE.Mesh(geoLavagnaD, matLavagnaD);
    meshLavagnaD.castShadow = true;
    gruppoLavagnaDestra.add(meshLavagnaD);

    const geoCorniceD = new THREE.BoxGeometry(0.11, 1.6, 2.4);
    const matCorniceD = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const meshCorniceD = new THREE.Mesh(geoCorniceD, matCorniceD);
    meshCorniceD.position.x = 0.02; 
    gruppoLavagnaDestra.add(meshCorniceD);
    scene.add(gruppoLavagnaDestra);

    // MENSOLE BIANCHE
    const matMensola = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const geoMensola = new THREE.BoxGeometry(0.3, 0.1, 1.5); 

    const meshMensola1 = new THREE.Mesh(geoMensola, matMensola);
    meshMensola1.position.set(4.75, 1.4, -2.5); 
    meshMensola1.castShadow = true;
    meshMensola1.receiveShadow = true;
    scene.add(meshMensola1);

    const meshMensola2 = new THREE.Mesh(geoMensola, matMensola);
    meshMensola2.position.set(4.75, 1.4, 2.5);  
    meshMensola2.castShadow = true;
    meshMensola2.receiveShadow = true;
    scene.add(meshMensola2);
}