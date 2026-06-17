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


// 2. COSTRUZIONE DEL MONDO
buildRistorante(scene);
setupLuci(scene);

// Carichiamo un tavolo al centro della stanza (X=0, Y=0, Z=0)
// Nota: la scala '1' puoi aumentarla o diminuirla (es. 1.5 o 0.5) a seconda di quanto è grande l'asset di Kenney
caricaMobile(scene, 'mobili/tableGlass.glb', {x: 0, y: 0, z: 0}, 1.5);

// Carichiamo una sedia di fianco al tavolo
caricaMobile(scene, 'mobili/chairModernCushion.glb', {x: -1.2, y: 0, z: 0}, 1.5);

// Se vuoi aggiungere il pinguino gerarchico basterà sbloccare questa riga:
// const player = createHierarchicalPenguin();
// scene.add(player);

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