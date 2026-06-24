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
// CONFIGURAZIONE TELECAMERA "ALTEZZA CAMERIERE" (INTRO DA LONTANO)
// =========================================================================
// FIX: Impostiamo subito la posizione lontana per il menu iniziale
camera.position.set(0, 8.0, 15.5); 

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
// Il mirino iniziale punta verso l'alto per inquadrare il panorama dall'alto
controls.target.set(0, 5.0, 0);

controls.minDistance = 4;        
controls.maxDistance = 11;       
controls.minPolarAngle = 0.6;    
controls.maxPolarAngle = 1.45;   

// Mettere TRUE se vuoi riattivare i movimenti del mouse come rotazione, traslazione e zoom
controls.enableRotate = false; 
controls.enableZoom = false;   
controls.enablePan = false;    

controls.update();


// =========================================================================
// GESTIONE CAMBIO TELECAMERA CON TRANSIZIONE FLUIDA (3 PULSANTI)
// =========================================================================
const btnGenerale = document.getElementById('btn-generale');
const btnSala = document.getElementById('btn-sala');
const btnCucina = document.getElementById('btn-cucina');

// STATO DELLA TELECAMERA: Impostiamo i valori di partenza coerenti con il menu iniziale (0, 8.0, 15.5)
// così la telecamera resta immobile finché non si preme "Inizia Gioco"
const camTargetPos = new THREE.Vector3(0, 8.0, 15.5);   
const camTargetLook = new THREE.Vector3(0, 5.0, 0);  

// Funzione di utilità per gestire lo stato active su 3 bottoni contemporaneamente
function impostaBottoneAttivo(attivo, inattivo1, inattivo2) {
    attivo.classList.add('active');
    inattivo1.classList.remove('active');
    inattivo2.classList.remove('active');
}

if (btnGenerale && btnSala && btnCucina) {
    
    // --- CONFIGURAZIONE VISTA GENERALE (Ritorno ai valori di caricamento standard del locale) ---
    btnGenerale.addEventListener('click', () => {
        impostaBottoneAttivo(btnGenerale, btnSala, btnCucina);
        camTargetPos.set(0, 2.8, 7.5);     // Posizione interna standard
        camTargetLook.set(0, 1.2, -0.5);   // Target interno standard
    });

    // --- CONFIGURAZIONE VISTA SALA ---
    btnSala.addEventListener('click', () => {
        impostaBottoneAttivo(btnSala, btnGenerale, btnCucina);
        camTargetPos.set(2.0, 2.2, 5.5);   
        camTargetLook.set(1.5, 1.0, 0.0);  
    });

    // --- CONFIGURAZIONE VISTA CUCINA ---
    btnCucina.addEventListener('click', () => {
        impostaBottoneAttivo(btnCucina, btnGenerale, btnSala);
        camTargetPos.set(-2.8, 2.2, 4.8);   
        camTargetLook.set(-3.2, 1.2, -1.8); 
    });
}

// =========================================================================
// LOGICA PULSANTE START MENU
// =========================================================================
const startMenu = document.getElementById('start-menu');
const btnStart = document.getElementById('btn-start');

if (btnStart && startMenu) {
    btnStart.addEventListener('click', () => {
        // Nasconde il menu con la dissolvenza CSS
        startMenu.classList.add('hidden');
        
        // Attiva la transizione fluida: la telecamera scenderà in picchiata dentro il locale
        camTargetPos.set(0, 2.8, 7.5);
        camTargetLook.set(0, 1.2, -0.5);
    });
}

// =========================================================================
// 2. COSTRUZIONE DEL MONDO E LUCI DI BASE
// ========================================================================= 
buildRistorante(scene);
setupLuci(scene);
aggiungiDecorations(scene);

const scalaArredi = 1.5;

// --- A) I 3 TAVOLI STRUTTURALI (X, Z) ---
const configTavoli = [
    { x: 2.8,  z: -2.5 }, // Tavolo 1: In alto a destra
    { x: 1.0,  z: 0.0  }, // Tavolo 2: Centrale
    { x: 2.8,  z: 2.5  }  // Tavolo 3: In basso a destra
];

configTavoli.forEach((tavolo) => {
    caricaMobile(scene, 'mobili/tableGlass.glb', { x: tavolo.x, y: 0, z: tavolo.z }, scalaArredi, 0);
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x + 0.8, y: 0, z: tavolo.z + 0.3 }, scalaArredi, Math.PI);
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x + 0.5, y: 0, z: tavolo.z - 1 }, scalaArredi, 0);
});

// =========================================================================
// B) NUOVO ASSETTO MOBILI CUCINA (CONTATTO PERFETTO SENZA BUCHI O COMPENETRAZIONI)
// =========================================================================

const larghezzaMobileScalato = 0.65; 

//fila 1 (sotto)
const valX1=-4.3
const valZ1=-4.3
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX1, y: 0, z: valZ1 }, scalaArredi, Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenSink.glb',    { x: valX1, y: 0, z: valZ1+larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX1, y: 0, z: valZ1+2*larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX1, y: 0, z: valZ1+3*larghezzaMobileScalato }, scalaArredi, Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenStove.glb',   { x: valX1, y: 0, z: valZ1+4*larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX1, y: 0, z: valZ1+5*larghezzaMobileScalato }, scalaArredi, Math.PI / 2);  
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX1, y: 0, z: valZ1+6*larghezzaMobileScalato }, scalaArredi, Math.PI / 2);  
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX1, y: 0, z: valZ1+7*larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 

//fila 1 (sopra)
const valX12 = -4.7;
const valY12 = 3; // Altezza calibrata per i pensili (se metti 5 volano troppo in alto rispetto ai muri)
const valZ12 = -4.3;

caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 }, scalaArredi, Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + 2 * larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + 3 * larghezzaMobileScalato }, scalaArredi, Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + 4 * larghezzaMobileScalato }, scalaArredi, Math.PI / 2); 
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + 5 * larghezzaMobileScalato }, scalaArredi, Math.PI / 2);  
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + 6 * larghezzaMobileScalato }, scalaArredi, Math.PI / 2);  
caricaMobile(scene, 'mobili/kitchenCabinetUpperDouble.glb', { x: valX12, y: valY12, z: valZ12 + 7 * larghezzaMobileScalato }, scalaArredi, Math.PI / 2);

//fila 2 (sotto)
const valX2=-2.2
const valZ2=-4.3
caricaMobile(scene, 'mobili/kitchenFridgeLarge.glb',{ x: valX2, y: 0, z: -5 }, scalaArredi, -Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenCabinet.glb',{ x: valX2, y: 0, z: valZ2 }, scalaArredi, -Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenCabinet.glb',{ x: valX2, y: 0, z: valZ2+larghezzaMobileScalato }, scalaArredi, -Math.PI / 2);
caricaMobile(scene, 'mobili/kitchenCabinet.glb',{ x: valX2, y: 0, z: valZ2+2*larghezzaMobileScalato }, scalaArredi, -Math.PI / 2);  
caricaMobile(scene, 'mobili/kitchenCabinet.glb',{ x: valX2, y: 0, z: valZ2+3*larghezzaMobileScalato }, scalaArredi, -Math.PI / 2);  

//fila 3 (orizzontale - Crea la L partendo dal fondo della Fila 1)
// Si ancora esattamente alla fine della Fila 1 sulla coordinata Z
const valX3 = -5;
const valZ3 = valZ1 + 7 * larghezzaMobileScalato; 

// Posizioniamo i 4 moduli in orizzontale verso destra (lungo l'asse X)
// Partiamo da +1 per non sovrapporci all'ultimo blocco della Fila 1
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX3 + 1 * larghezzaMobileScalato, y: 0, z: valZ3 }, scalaArredi, Math.PI);
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX3 + 2 * larghezzaMobileScalato, y: 0, z: valZ3 }, scalaArredi, Math.PI); 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX3 + 3 * larghezzaMobileScalato, y: 0, z: valZ3 }, scalaArredi, Math.PI);  
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: valX3 + 4 * larghezzaMobileScalato, y: 0, z: valZ3 }, scalaArredi, Math.PI);

// --- C) LA PORTA D'INGRESSO ---
caricaMobile(scene, 'mobili/doorwayFront.glb', { x: 4.8, y: 0, z: 3.5 }, scalaArredi, -Math.PI / 2);



// =========================================================================
// ALLESTIMENTO OGGETTI SULLE MENSOLE DELLA PARETE DESTRA (CORRETTO)
// =========================================================================
const altezzaSuperficieMensola = 1.42; // Altezza per poggiare sopra la mensola
const coordinataXMensola = 4.75;       // Allineamento lungo il muro destro

// --- MENSOLA 1 (Fondo stanza - Quadro Caffè) ---
// La Radio: spostata più a sinistra (Z = -2.2) e ruotata per guardare il ristorante (-Math.PI / 2)
caricaMobile(scene, 'mobili/radio.glb', { 
    x: coordinataXMensola, 
    y: altezzaSuperficieMensola, 
    z: -2.9 
}, scalaArredi, -Math.PI / 2); 

// La Pianta Grande (pottedPlant): spostata più a sinistra (Z = -1.6) vicino alla radio
caricaMobile(scene, 'mobili/pottedPlant.glb', { 
    x: coordinataXMensola, 
    y: altezzaSuperficieMensola, 
    z: -2 
}, scalaArredi, 0);


// --- MENSOLA 2 (Fronte stanza - Quadro Croissant) ---
// La Pianta Piccola (plantSmall): caricata sul lato sinistro della seconda mensola (Z = 1.4)
caricaMobile(scene, 'mobili/plantSmall2.glb', { 
    x: coordinataXMensola, 
    y: altezzaSuperficieMensola, 
    z: 2.5 
}, scalaArredi*2, 0);

// La Lampada Rotonda: posizionata sul lato destro della seconda mensola (Z = 2.0)
caricaMobile(scene, 'mobili/lampRoundTable.glb', { 
    x: coordinataXMensola, 
    y: altezzaSuperficieMensola, 
    z: 2.0 
}, scalaArredi*1.3, 0);

// =========================================================================
// 3. GENERAZIONE FARETTI "OCCHIO DI BUE" CALIBRATI SUI TAVOLI
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
// 5. LOOP DI ANIMAZIONE E TIMING CONTINUO (CON INTERPOLAZIONE TELECAMERA)
// =========================================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const tempoDallInizio = clock.getElapsedTime();
    const delta = clock.getDelta(); 

    // --- ANIMAZIONE FLUTTUAZIONE ICEBERG ---
    if (typeof listaIcebergMelting !== 'undefined') {
        listaIcebergMelting.forEach(iceberg => {
            const dati = iceberg.userData;
            if (dati && dati.altezzaInizialeY !== undefined) {
                iceberg.position.y = dati.altezzaInizialeY + Math.sin(tempoDallInizio * dati.velocitaFluttuazione + dati.faseOnda) * 0.15;
                iceberg.rotation.y += dati.velocitaRotazione * delta * 0.5;
            }
        });
    }

    // --- TRANSIZIONE FLUIDA DELLA TELECAMERA ---
    // Controlla che le variabili di destinazione dei bottoni esistano per evitare errori al primo avvio
    if (typeof camTargetPos !== 'undefined' && typeof camTargetLook !== 'undefined') {
        // 0.05 regola la morbidezza: più è basso, più la transizione sarà lenta e cinematografica
        camera.position.lerp(camTargetPos, 0.05);
        controls.target.lerp(camTargetLook, 0.05);
    }

    // Aggiorna i controlli e renderizza la scena
    controls.update(); 
    renderer.render(scene, camera);
}

animate();

// --- GESTIONE RIDIMENSIONAMENTO FINESTRA ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});