// js/main.js

// 1. INIZIALIZZAZIONE ELEMENTI CORE
const scene = new THREE.Scene();
const coloreArtico = 0xd0e3f0;
scene.background = new THREE.Color(coloreArtico);
scene.fog = new THREE.Fog(coloreArtico, 15, 45);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 14); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; 
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2, 0); 
controls.maxPolarAngle = Math.PI / 2 + 0.1; 
controls.update();


// =========================================================================
// 2. COSTRUZIONE DEL MONDO
// =========================================================================
buildRistorante(scene);
setupLuci(scene);

const scalaArredi = 1.5;

// Definiamo i 3 tavoli esattamente come nel tuo disegno (X, Z)
const configTavoli = [
    { x: 2.8,  z: -2.5 }, // Tavolo 1: In alto a destra (vicino al muro di fondo)
    { x: 1.0,  z: 0.0  }, // Tavolo 2: Centrale, più spostato verso sinistra
    { x: 2.8,  z: 2.5  }  // Tavolo 3: In basso a destra (vicino a noi)
];

// Carichiamo i set di arredi
configTavoli.forEach((tavolo) => {
    //TAVOLO
    caricaMobile(scene, 'mobili/tableGlass.glb', { x: tavolo.x, y: 0, z: tavolo.z }, scalaArredi, 0);
    //SEDIA RIVOLTA DI SPALLE
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x+0.8, y: 0, z: tavolo.z + 0.3 }, scalaArredi, Math.PI);
    //SEDIA RIVOLTA VERSO DI NOI
    caricaMobile(scene, 'mobili/chairModernCushion.glb', { x: tavolo.x+0.5, y: 0, z: tavolo.z - 1 }, scalaArredi, 0);
});

//********************************** */

// -------------------------------------------------------------------------
// B) IL BANCONE CUCINA COMPONIBILE (Allineamento perfetto)
// -------------------------------------------------------------------------
const xCucina = -3.8; 
const rotCucina = -Math.PI / 2;
const passoZ = 0.65; 

// Punto di partenza per appoggiarsi al muro in fondo
const partenzaZ = -5; 

// Pezzo 1: KitchenCabinet (Attaccato al muro di fondo)
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ }, scalaArredi, rotCucina);

// Pezzo 2: KitchenStove (Fornelli)
caricaMobile(scene, 'mobili/kitchenStove.glb', { x: xCucina, y: 0, z: partenzaZ + passoZ }, scalaArredi, rotCucina);

// Pezzo 3: KitchenCabinet
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 2) }, scalaArredi, rotCucina);

// Pezzo 4: KitchenSink (Lavandino)
caricaMobile(scene, 'mobili/kitchenSink.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 3) }, scalaArredi, rotCucina);

// Pezzo 5: KitchenCabinet 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 4) }, scalaArredi, rotCucina);

// Pezzo 6: KitchenCabinet 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 5) }, scalaArredi, rotCucina);

// Pezzo 7: KitchenCabinet 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 6) }, scalaArredi, rotCucina);

// Pezzo 8: KitchenCabinet 
caricaMobile(scene, 'mobili/kitchenCabinet.glb', { x: xCucina, y: 0, z: partenzaZ + (passoZ * 7) }, scalaArredi, rotCucina);

// Pezzo 9: KitchenCabinetCornerRound
caricaMobile(scene, 'mobili/kitchenCabinetCornerRound.glb', { 
    x: xCucina + 0.68, 
    y: 0, 
    z: partenzaZ + (passoZ * 9) 
}, scalaArredi, Math.PI / 2);






// -------------------------------------------------------------------------
// C) LA PORTA D'INGRESSO (A Destra in basso, vicino a noi)
// -------------------------------------------------------------------------
// Posizionata sul lato destro (X positivo), avanzata (Z positivo) e ruotata di -90 gradi (-Math.PI / 2)
caricaMobile(scene, 'mobili/doorwayFront.glb', { x: 4.8, y: 0, z: 3.5 }, scalaArredi, -Math.PI / 2);

// 3. LOOP DI CALCOLO CONTINUO
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});