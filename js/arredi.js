// js/arredi.js

/**
 * Funzione generica per caricare un mobile di Kenney e posizionarlo nel ristorante
 * @param {THREE.Scene} scene - La scena in cui aggiungere il modello
 * @param {string} nomeFile - Il nome del file dentro la cartella models/ (es. 'mobili/tableGlass.glb')
 * @param {object} pos - Coordinate di posizionamento {x, y, z}
 * @param {number} scala - Fattore di scala per ridimensionarlo se è troppo grande/piccolo
 * @param {number} rotY - Rotazione in radianti sull'asse Y (es. Math.PI)
 */
function caricaMobile(scene, nomeFile, pos = {x: 0, y: 0, z: 0}, scala = 1, rotY = 0) {
    // Sfrutta il gltfLoader istanziato globalmente in main.js
    gltfLoader.load(
        `models/${nomeFile}`,
        (gltf) => {
            const modello = gltf.scene;
            
            // Impostiamo la posizione nello spazio 3D
            modello.position.set(pos.x, pos.y, pos.z);
            
            // Impostiamo la scala uniforme (X, Y, Z)
            modello.scale.set(scala, scala, scala);
            
            // Applichiamo la rotazione sull'asse verticale Y (in radianti)
            modello.rotation.y = rotY;
            
            // Attiviamo il calcolo delle ombre per ogni singola parte del modello 3D
            modello.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;     // Il mobile proietta l'ombra sul pavimento
                    child.receiveShadow = true;  // Il mobile può ricevere ombre da altri oggetti
                    
                    // Calibriamo la rugosità dei materiali per non renderli troppo riflettenti sotto le luci
                    if (child.material) {
                        child.material.roughness = 0.6;
                    }
                }
            });
            
            // Aggiungiamo il modello completo alla scena di gioco
            scene.add(modello);
        },
        undefined,
        (error) => {
            console.error(`Errore durante il caricamento del modello models/${nomeFile}:`, error);
        }
    );
}