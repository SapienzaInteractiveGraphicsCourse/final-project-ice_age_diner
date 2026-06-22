// js/main.js

// =========================================================================
// INSTANZIAMENTO LOADER GLOBALE
// =========================================================================
const gltfLoader = new THREE.GLTFLoader();

// =========================================================================
// 1. INIZIALIZZAZIONE ELEMENTI CORE (AMBIENTE PROCEDURALE)
// =========================================================================
const scene = new THREE.Scene();
const coloreArtico = 0xd0e3f0; 
scene.background = new THREE.Color(coloreArtico);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
renderer.outputColorSpace = THREE.SRGBColorSpace; 

document.body.appendChild(renderer.domElement);

// =========================================================================
// CONFIGURAZIONE TELECAMERA "ALTEZZA CAMERIERE"
// =========================================================================
camera.position.set(0, 2.8, 7.5);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1.2, -0.5);

controls.minDistance = 4;        
controls.maxDistance = 11;       
controls.minPolarAngle = 0.6;    
controls.maxPolarAngle = 1.45;   

controls.update();

// =========================================================================
// 2. COSTRUZIONE DEL MONDO E LUCI DI BASE
// =========================================================================
buildRistorante(scene);
setupLuci(scene);

const scalaArredi = 1.5;

// Definiamo i 3 tavoli strutturali (X, Z)
const configTavoli = [
    { x: 2.8,  z: -2.5 }, // Tavolo 1: In alto a destra
    { x: 1.0,  z: 0.0  }, // Tavolo 2: Centrale
    { x: 2.8,  z: 2.5  }  // Tavolo 3: In basso a destra
];

// Carichiamo i set di arredi tramite ciclo coordinato
configTavoli.forEach((tavolo) => {
    caricaMobile(scene, 'mobili/tableGlass.glb', { x: tavolo.x, y: 0, z: tavolo.z }, scalaArredi, 0);
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x + 0.8, y: 0, z: tavolo.z + 0.3 }, scalaArredi, Math.PI);
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x + 0.5, y: 0, z: tavolo.z - 1 }, scalaArredi, 0);
});

// B) Il bancone cucina componibile
const xCucina = -3.8; 
const rotCucina = -Math.PI / 2;
const passoZ = 0.65; 
const partenzaZ = -5; 

caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenStove.glb', { x: xCucina, y: 0, z: partenzaZ + passoZ }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 2) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenSink.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 3) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 4) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 5) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 6) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 7) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinetCornerRound.glb', { x: xCucina + 0.68, y: 0, z: partenzaZ + (passoZ * 9) }, scalaArredi, Math.PI / 2);

// C) La porta d'ingresso
caricaMobile(scene, 'mobili/doorwayFront.glb', { x: 4.8, y: 0, z: 3.5 }, scalaArredi, -Math.PI / 2);

// =========================================================================
// 3. GENERAZIONE FARETTI "OCCHIO DI BUE" POTENZIATI E CALIBRATI SUI TAVOLI
// =========================================================================
const luciTavoli = [];
const coloriAlert = [0x00ff00, 0xffaa00, 0xff0000]; // Verde, Arancione, Rosso

// Valori di calibrazione estratti per compensare il pivot decentrato di tableGlass.glb
const offsetX = 0.7;  // Sposta il faretto leggermente verso destra per centrare il tavolo
const offsetZ = -0.3; // Sposta il faretto leggermente verso l'alto (sfondo) per centrare il tavolo

configTavoli.forEach((tavolo, indice) => {
    // Calcoliamo la posizione reale centrata sul mobile
    const centroRealeX = tavolo.x + offsetX;
    const centroRealeZ = tavolo.z + offsetZ;

    // Creiamo lo SpotLight conico con fuoco concentrato
    const farettoTavolo = new THREE.SpotLight(0xffffff, 0, 8, Math.PI / 11, 0.9, 0.5);
    
    // Posizioniamo il faretto sulla verticale corretta (attaccato al soffitto a Y=4.9)
    farettoTavolo.position.set(centroRealeX, 4.9, centroRealeZ);
    
    farettoTavolo.castShadow = true;
    farettoTavolo.shadow.mapSize.width = 1048; 
    farettoTavolo.shadow.mapSize.height = 1048;
    farettoTavolo.shadow.bias = -0.001;

    // Creiamo il punto di mira (target) invisibile ancorato sul centro reale compensato
    const targetTavolo = new THREE.Object3D();
    targetTavolo.position.set(centroRealeX, 0, centroRealeZ);
    scene.add(targetTavolo);
    
    farettoTavolo.target = targetTavolo;
    scene.add(farettoTavolo);

    // Salviamo lo stato del faretto per l'interfaccia utente
    luciTavoli.push({
        luce: farettoTavolo,
        attivo: false,
        statoColore: 0 
    });
});




// =========================================================================
// 4. INTERFACCIA UTENTE E ASCOLTATORI EVENTI (UI)
// =========================================================================

// A) Slider Atmosfera Sfumata (Giorno - Tramonto - Notte)
const sliderTempo = document.getElementById('time-slider');
if (sliderTempo) {
    sliderTempo.addEventListener('input', (evento) => {
        impostaCielo(parseInt(evento.target.value));
    });
    impostaCielo(parseInt(sliderTempo.value));
}

// B) Menu Laterale Destro: Gestione Faretti Occhio di bue dei Tavoli
for (let i = 1; i <= 3; i++) {
    const btn = document.getElementById(`btn-faretto-${i}`);
    if (btn) {
        btn.addEventListener('click', () => {
            const farettoDati = luciTavoli[i - 1];

            if (!farettoDati.attivo) {
                // Accensione: impostiamo il primo colore (Verde)
                farettoDati.attivo = true;
                farettoDati.statoColore = 0;
                farettoDati.luce.color.setHex(coloriAlert[0]);
                farettoDati.luce.intensity = 60.0; // Forte intensità focalizzata
                btn.style.borderColor = "#2ecc71";
            } else {
                // Se è già attivo, cicla tra i colori (Verde -> Arancio -> Rosso -> Spento)
                farettoDati.statoColore++;
                if (farettoDati.statoColore < coloriAlert.length) {
                    farettoDati.luce.color.setHex(coloriAlert[farettoDati.statoColore]);
                    if (farettoDati.statoColore === 1) btn.style.borderColor = "#f1c40f";
                    if (farettoDati.statoColore === 2) btn.style.borderColor = "#e74c3c";
                } else {
                    // Spegnimento definitivo del ciclo
                    farettoDati.attivo = false;
                    farettoDati.luce.intensity = 0;
                    btn.style.borderColor = "#34495e";
                }
            }
        });
    }
}

// =========================================================================
// 5. LOOP DI ANIMAZIONE E TIMING CONTINUO
// =========================================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const tempoDallInizio = clock.getElapsedTime();
    const delta = clock.getDelta(); 

    if (typeof listaIcebergMelting !== 'undefined') {
        listaIcebergMelting.forEach(iceberg => {
            const dati = iceberg.userData;
            if (dati && dati.altezzaInizialeY !== undefined) {
                iceberg.position.y = dati.altezzaInizialeY + Math.sin(tempoDallInizio * dati.velocitaFluttuazione + dati.faseOnda) * 0.15;
                iceberg.rotation.y += dati.velocitaRotazione * delta * 0.5;
            }
        });
    }

    controls.update(); 
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});