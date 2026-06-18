// js/main.js

// =========================================================================
// INSTANZIAMENTO LOADER GLOBALE
// =========================================================================
// Necessario a livello globale per permettere a buildRistorante e caricaMobile di funzionare
const gltfLoader = new THREE.GLTFLoader();

// =========================================================================
// 1. INIZIALIZZAZIONE ELEMENTI CORE (AMBIENTE PROCEDURALE)
// =========================================================================
const scene = new THREE.Scene();
const coloreArtico = 0xd0e3f0; // Colore iniziale diurno dello sfondo
scene.background = new THREE.Color(coloreArtico);

// Camera impostata con un FOV ottimale per la stanza a tutto schermo
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 

// Aggiornato alla proprietà moderna standard per la gestione dei colori sRGB
renderer.outputColorSpace = THREE.SRGBColorSpace; 

document.body.appendChild(renderer.domElement);

// =========================================================================
// CONFIGURAZIONE TELECAMERA "ALTEZZA CAMERIERE" (PROSPETTIVA ISOMETRICA)
// =========================================================================
// Posizioniamo la telecamera bassa e vicina al fronte (Z=7.5) per l'immersione
camera.position.set(0, 2.8, 7.5);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Il target punta a Y=1.2 (altezza cameriere) e Z=-0.5 per inquadrare il locale
controls.target.set(0, 1.2, -0.5);

// --- LIMITI DI NAVIGAZIONE ---
controls.minDistance = 4;        // Impedisce di zoomare troppo dentro gli arredi
controls.maxDistance = 11;       // Impedisce di allontanarsi uscendo dalla mappa
controls.minPolarAngle = 0.6;    // Impedisce una vista aerea zenitale completamente piatta
controls.maxPolarAngle = 1.45;   // Blocco di sicurezza: impedisce di andare sotto il pavimento

controls.update();

// =========================================================================
// 2. COSTRUZIONE DEL MONDO
// =========================================================================
buildRistorante(scene);
setupLuci(scene);

const scalaArredi = 1.5;

// Definiamo i 3 tavoli esattamente come nel disegno strutturale (X, Z)
const configTavoli = [
    { x: 2.8,  z: -2.5 }, // Tavolo 1: In alto a destra (vicino al muro di fondo)
    { x: 1.0,  z: 0.0  }, // Tavolo 2: Centrale, più spostato verso sinistra
    { x: 2.8,  z: 2.5  }  // Tavolo 3: In basso a destra (vicino a noi)
];

// Carichiamo i set di arredi tramite ciclo coordinato
configTavoli.forEach((tavolo) => {
    // TAVOLO
    caricaMobile(scene, 'mobili/tableGlass.glb', { x: tavolo.x, y: 0, z: tavolo.z }, scalaArredi, 0);
    // SEDIA RIVOLTA DI SPALLE
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x + 0.8, y: 0, z: tavolo.z + 0.3 }, scalaArredi, Math.PI);
    // SEDIA RIVOLTA VERSO DI NOI
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x + 0.5, y: 0, z: tavolo.z - 1 }, scalaArredi, 0);
});

// -------------------------------------------------------------------------
// B) IL BANCONE CUCINA COMPONIBILE (Incastri millimetrici)
// -------------------------------------------------------------------------
const xCucina = -3.8; 
const rotCucina = -Math.PI / 2;
const passoZ = 0.65; 
const partenzaZ = -5; // Appoggiato alla vetrata di fondo

caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenStove.glb', { x: xCucina, y: 0, z: partenzaZ + passoZ }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 2) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenSink.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 3) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 4) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 5) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 6) }, scalaArredi, rotCucina);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 7) }, scalaArredi, rotCucina);

// Angolo terminale arrotondato ruotato a 90° per chiudere la penisola
caricaMobile(scene, 'mobili/kitchenCabinetCornerRound.glb', { 
    x: xCucina + 0.68, 
    y: 0, 
    z: partenzaZ + (passoZ * 9) 
}, scalaArredi, Math.PI / 2);

// -------------------------------------------------------------------------
// C) LA PORTA D'INGRESSO
// -------------------------------------------------------------------------
caricaMobile(scene, 'mobili/doorwayFront.glb', { x: 4.8, y: 0, z: 3.5 }, scalaArredi, -Math.PI / 2);

// =========================================================================
// 3. LOOP DI ANIMAZIONE E TIMING CONTINUO
// =========================================================================
// Inizializziamo un clock per misurare i secondi stabili (evita accelerazioni su schermi a 144Hz)
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const tempoDallInizio = clock.getElapsedTime();
    const delta = clock.getDelta(); // Tempo trascorso tra il frame precedente e questo

    // Sfoglia l'array degli iceberg e falli dondolare dolcemente sulle onde
    if (typeof listaIcebergMelting !== 'undefined') {
        listaIcebergMelting.forEach(iceberg => {
            const dati = iceberg.userData;
            
            // Verifica di sicurezza per evitare errori se l'oggetto asincrono non è ancora caricato completamente
            if (dati && dati.altezzaInizialeY !== undefined) {
                // Moto armonico per l'altezza Y (ondeggia su e giù)
                iceberg.position.y = dati.altezzaInizialeY + Math.sin(tempoDallInizio * dati.velocitaFluttuazione + dati.faseOnda) * 0.15;
                
                // Rotazione asimmetrica legata al delta temporale (stabile a qualsiasi frame rate)
                iceberg.rotation.y += dati.velocitaRotazione * delta * 0.5;
            }
        });
    }

    // Aggiornamento dei controlli obbligatorio per l'effetto fluidità (Damping)
    controls.update(); 
    
    renderer.render(scene, camera);
}

animate();

// Gestione del ridimensionamento della finestra (Full Screen reattivo)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});