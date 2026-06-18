// js/arredi.js

// Inizializziamo il caricatore GLTF di Three.js
const gltfLoader = new THREE.GLTFLoader();

/**
 * Funzione generica per caricare un mobile di Kenney e posizionarlo nel ristorante
 * @param {THREE.Scene} scene - La scena in cui aggiungere il modello
 * @param {string} nomeFile - Il nome del file dentro la cartella models/ (es. 'table.glb')
 * @param {object} pos - Coordinate di posizionamento {x, y, z}
 * @param {number} scala - Fattore di scala per ridimensionarlo se è troppo grande/piccolo
 */


function caricaMobile(scene, nomeFile, pos = {x: 0, y: 0, z: 0}, scala = 1, rotY = 0) {
    gltfLoader.load(
        `models/${nomeFile}`,
        (gltf) => {
            const modello = gltf.scene;
            
            modello.position.set(pos.x, pos.y, pos.z);
            modello.scale.set(scala, scala, scala);
            
            // APPLICHIAMO LA ROTAZIONE SULL'ASSE Y (in radianti)
            modello.rotation.y = rotY;
            
            modello.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if(child.material) child.material.roughness = 0.6;
                }
            });
            
            scene.add(modello);
        }
    );
}