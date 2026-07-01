import { animateInteractable } from './animations.js';
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

    // listener for mouse click events
    window.addEventListener('click', onMouseClick, false);

    console.log("interaction setup complete.");
}

// function that activates event on mouse click
function onMouseClick(event){
    // position of the mouse in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth)*2 - 1;
    mouse.y = -(event.clientY / window.innerHeight)*2 + 1;

    // update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, interactionCamera);

    // search for intersections
    const intersects = raycaster.intersectObjects(interactionScene.children, true);

    if (intersects.length > 0){

        let clickedObj = null;
        //only if it's interactable

        for (let i = 0; i < intersects.length; i++){
            let obj = intersects[i].object;
            while (obj) {
                if (obj.userData && obj.userData.isInteractable) {
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

                const queueIdx = waitingQueue.indexOf(clickedObj);
                if (queueIdx !== -1) waitingQueue.splice(queueIdx, 1);

                clickedObj.userData.state = 'FOLLOW_WAITER';
                clickedObj.userData.isInteractable = false;
            }
            else if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'READY_TO_ORDER'){
                console.log("Customer interaction: ready to order.");
                const orderFood = clickedObj.userData.order;
                state.orders.push({customer: clickedObj, food: orderFood, status: 'pending'});
                //UPDATE HTML INTERFACE TO SHOW ORDER ON THE RIGHT
                clickedObj.userData.state = 'WAIT_FOR_FOOD';
                clickedObj.remove(clickedObj.userData.bubble);
                return;
            }
            else if (clickedObj.userData.interactionType === 'plate' && clickedObj.userData.isInteractable  ){ 
                if (waiter.userData.hasPlate === false){
                    console.log("Plate interaction: picking up the plate.");
                    interactionScene.remove(clickedObj);
                    waiter.add(clickedObj);
                    clickedObj.position.set(0, 4, 3);
                    waiter.userData.hasPlate = true;
                    waiter.userData.plate = clickedObj;
                    clickedObj.userData.isInteractable = false;
                }
                else{
                    console.log("Waiter already has a plate. Cannot pick up another one.");
                }
            }
            else if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'WAIT_FOR_FOOD'){
                if (waiter.userData.hasPlate){
                    console.log("Customer interaction: delivering food to customer.");
                    const plate = waiter.userData.plate;
                    waiter.remove(plate);
                    interactionScene.add(plate);
                    plate.scale.set(3, 3, 3);
                    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), clickedObj.rotation.y);
                    plate.position.set(clickedObj.position.x + (forward.x * 4.5), 5.2, clickedObj.position.z + (forward.z * 4.5));
                    plate.rotation.set(0, 0, 0);
                    waiter.userData.hasPlate = false;
                    waiter.userData.plate = null;
                    clickedObj.userData.plate = plate;
                    clickedObj.userData.timer = 300;
                    if (clickedObj.userData.bubble) {
                        clickedObj.remove(clickedObj.userData.bubble);
                        clickedObj.userData.bubble = null;
                    }
                    clickedObj.userData.state = 'EATING';
                }
            }
            else if (clickedObj.userData.interactionType === 'chair' && !clickedObj.userData.isOccupied ){

                const followingPenguinData = penguins.find(p =>p.mesh && p.mesh.userData.state === 'FOLLOW_WAITER');

                if (followingPenguinData && followingPenguinData.mesh){
                    const followingPenguin = followingPenguinData.mesh;
                    followingPenguin.userData.state = 'WALK_TO_SEAT';
                    followingPenguin.userData.targetPosition = clickedObj.position.clone();
                    clickedObj.userData.isOccupied = true;
                    followingPenguin.userData.seat = clickedObj;
                }else{
                    console.log("No penguin is currently following the waiter to sit down.");
                }

            }
            else{
                console.log("interaction with:", clickedObj.name);
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