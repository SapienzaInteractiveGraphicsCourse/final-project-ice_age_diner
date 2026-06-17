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
function caricaMobile(scene, nomeFile, pos = {x: 0, y: 0, z: 0}, scala = 1) {
    
    gltfLoader.load(
        `models/${nomeFile}`,
        (gltf) => {
            const modello = gltf.scene;
            
            // Posizioniamo il mobile sul pavimento
            modello.position.set(pos.x, pos.y, pos.z);
            
            // Scaliamo il modello in modo uniforme
            modello.scale.set(scala, scala, scala);
            
            // ATTIVIAMO LE OMBRE SUL MODELLO CARICATO
            // I file 3D esterni sono composti da molte micro-mesh, dobbiamo attivarle su ognuna
            modello.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Ottimizzazione accademica: se il modello ha già i suoi colori (materiali),
                    // diciamo a Three.js di calcolare correttamente la luce della nostra SpotLight
                    if(child.material) {
                        child.material.roughness = 0.6;
                    }
                }
            });
            
            // Aggiungiamo il mobile alla scena
            scene.add(modello);
            console.log(`Arredo caricato con successo: ${nomeFile}`);
        },
        (xhr) => {
            // Callback opzionale per vedere la percentuale di caricamento in console
            console.log((xhr.loaded / xhr.total * 100) + '% caricato');
        },
        (error) => {
            console.error(`Errore nel caricamento del file ${nomeFile}:`, error);
        }
    );
}