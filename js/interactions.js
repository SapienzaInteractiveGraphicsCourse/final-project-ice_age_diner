import { animateInteractable, pickUpPlate, putDownPlate } from './animations.js';
import { penguins, waitingQueue } from './penguin.js';
import { state } from './state.js';

let raycaster;
let mouse;
let interactionCamera;
let interactionScene;

// function to setup the raycasting and mouse click interactions
export function setupInteractions(camera, scene){
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Store the camera and scene for later use in the click event
    interactionCamera = camera;
    interactionScene = scene;
    window.addEventListener('click', onMouseClick, false);
    console.log("interaction setup complete.");
}

function onMouseClick(event){
    mouse.x = (event.clientX / window.innerWidth)*2 - 1;
    mouse.y = -(event.clientY / window.innerHeight)*2 + 1;

    raycaster.setFromCamera(mouse, interactionCamera);
    const intersects = raycaster.intersectObjects(interactionScene.children, true);

    if (intersects.length > 0){
        let clickedObj = null;
        for (let i = 0; i < intersects.length; i++){
            let obj = intersects[i].object;
            while (obj) {
                if (obj.userData && obj.userData.isInteractable){
                    clickedObj = obj;
                    break;
                }
                obj = obj.parent;
            }
            if (clickedObj) break;
        }

        if (clickedObj){
            const waiterData = penguins.find(p => p.mesh.userData.role === 'waiter');
            const waiter = waiterData ? waiterData.mesh : null;

            if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'WAIT_FOR_WAITER'){
                console.log("Customer interaction: calling waiter for customer.");
                
                // Rimuoviamo dalla coda e impostiamo lo stato di attesa assegnazione sedia
                const queueIdx = waitingQueue.indexOf(clickedObj);
                if (queueIdx !== -1) waitingQueue.splice(queueIdx, 1);

                clickedObj.userData.state = 'WAIT_FOR_SEAT_ASSIGNMENT';
                clickedObj.userData.isInteractable = false;
            }
            else if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'READY_TO_ORDER'){
                console.log("Customer interaction: ready to order.");
                const orderFood = clickedObj.userData.order;
                state.orders.push({customer: clickedObj, food: orderFood, status: 'pending'});
                clickedObj.userData.state = 'WAIT_FOR_FOOD';
                if (clickedObj.userData.bubble) {
                    clickedObj.remove(clickedObj.userData.bubble);
                }
                return;
            }
            else if (clickedObj.userData.interactionType === 'plate' && clickedObj.userData.isInteractable){ 
                if (waiter && waiter.userData.hasPlate === false){
                    console.log("Plate interaction: picking up the plate.");
                    interactionScene.remove(clickedObj);
                    pickUpPlate(waiter, clickedObj);
                    clickedObj.userData.isInteractable = false;
                }
                else{
                    console.log("Waiter already has a plate. Cannot pick up another one.");
                }
            }
            else if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'WAIT_FOR_FOOD'){
                if (waiter && waiter.userData.hasPlate){
                    console.log("Customer interaction: delivering food.");
                    const plate = putDownPlate(waiter, interactionScene, clickedObj);
                    clickedObj.userData.plate = plate;
                    clickedObj.userData.timer = 300;
                    if (clickedObj.userData.bubble) {
                        clickedObj.remove(clickedObj.userData.bubble);
                        clickedObj.userData.bubble = null;
                    }
                    clickedObj.userData.state = 'EATING';
                }
            }
            // Interazione sulla sedia: Cerca il cliente che attende l'assegnazione
            else if (clickedObj.userData.interactionType === 'chair' && !clickedObj.userData.isOccupied){
                const followingPenguinData = penguins.find(p => p.mesh && p.mesh.userData.state === 'WAIT_FOR_SEAT_ASSIGNMENT');

                if (followingPenguinData && followingPenguinData.mesh){
                    const followingPenguin = followingPenguinData.mesh;
                    followingPenguin.userData.state = 'WALK_TO_SEAT';
                    followingPenguin.userData.targetPosition = clickedObj.position.clone();
                    clickedObj.userData.isOccupied = true;
                    followingPenguin.userData.seat = clickedObj;
                }
            }
            else if (clickedObj.userData.interactionType === 'counter'){
                if (waiter && waiter.userData.hasPlate && waiter.userData.plate.userData.interactionType === 'dirty_plate'){
                    console.log("Waiter: putting dirty plate on the counter");
                    const plate = waiter.userData.plate;
                    waiter.remove(plate);
                    interactionScene.add(plate);

                    const dirtyZ = 10 + Math.random()*8;
                    plate.position.set(-36, 4.6, dirtyZ);
                    plate.rotation.set(0,0,0);
                    plate.scale.set(4,4,4);

                    waiter.userData.hasPlate = false;
                    waiter.userData.plate = null;
                }
            }
            else{
                const rotationTarget = clickedObj.userData.targetToRotate || clickedObj;
                if (rotationTarget.userData.originalRotation === undefined) return;

                let targetAngle = rotationTarget.userData.originalRotation;
                let angleToOpen = rotationTarget.userData.openAngle;
                if (angleToOpen === undefined){
                    const defaultAmount = Math.PI/2;
                    angleToOpen = (clickedObj.userData.doorType === 'left') ? defaultAmount : -defaultAmount;
                }

                if (!rotationTarget.userData.isOpen){
                    targetAngle = rotationTarget.userData.originalRotation + angleToOpen;
                    rotationTarget.userData.isOpen = true;
                }
                else{
                    targetAngle = rotationTarget.userData.originalRotation;
                    rotationTarget.userData.isOpen = false;
                }

                const axis = rotationTarget.userData.rotationAxis || 'y';
                animateInteractable(rotationTarget, targetAngle, axis);
            }
        }
    }
}