import { animateInteractable, pickUpPlate, putDownPlate, putPlateOnCounter, releaseCounterSpot, stackPlates, stopCallingWaiter, startEating, hideAngerSymbol, updateBubble, shakeHead, showWarningPopup } from './animations.js';
import { penguins, waitingQueue, KITCHEN_POS } from './penguin.js';
import { state } from './state.js';

let raycaster;
let mouse;
let interactionCamera;
let interactionScene;

let xTexture =  null;
const INTERACTION_RANGE = {
    plate: 12,
    dirty_plate: 12,
    counter: 14,
    tray: 12,
    customer: 16
};
let clickedPoint = null;

function distanceFromWaiter(waiter, object){
    if (!waiter) return Infinity;

    let targetPos = clickedPoint;

    if (!targetPos){
        if (!object) return Infinity;
        targetPos = new THREE.Vector3();
        object.getWorldPosition(targetPos);
    }

    const dx = targetPos.x - waiter.position.x;
    const dz = targetPos.z - waiter.position.z;

    return Math.sqrt(dx*dx + dz*dz);
}

function isInRange(waiter, object, type, whatToDo){
    const range = INTERACTION_RANGE[type];
    if (range === undefined) return true;

    if (distanceFromWaiter(waiter, object) <= range) return true;

    showWarningPopup("Get closer to " + whatToDo + "!");
    return false;
}

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
        clickedPoint = null;

        for (let i = 0; i < intersects.length; i++){
            let obj = intersects[i].object;
            while (obj) {
                if (obj.userData && obj.userData.isInteractable){
                    clickedObj = obj;
                    clickedPoint = intersects[i].point.clone();
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

                hideAngerSymbol(clickedObj);
                if (clickedObj.userData.bubble){
                    clickedObj.remove(clickedObj.userData.bubble);
                    clickedObj.userData.bubble = null;
                }
                
                clickedObj.userData.timer = 3600;
                clickedObj.userData.state = 'WAIT_FOR_SEAT_ASSIGNMENT';
                clickedObj.userData.isInteractable = false;
            }
            else if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'READY_TO_ORDER'){
                if (!isInRange(waiter, clickedObj, 'customer', "take the order")) return;

                console.log("Customer interaction: ready to order.");
                const orderFood = clickedObj.userData.order;
                state.orders.push({customer: clickedObj, food: orderFood, status: 'pending'});
                clickedObj.userData.state = 'WAIT_FOR_FOOD';
                
                hideAngerSymbol(clickedObj);
                
                clickedObj.userData.timer = 3600;

                stopCallingWaiter(clickedObj);
                updateBubble(clickedObj, orderFood);
                
                return;
            }
            else if ((clickedObj.userData.interactionType === 'plate' || clickedObj.userData.interactionType === 'dirty_plate') && clickedObj.userData.isInteractable){
                if (!isInRange(waiter, clickedObj, clickedObj.userData.interactionType, "reach the plate")) return;

                if (waiter && waiter.userData.hasPlate === false){
                    console.log("Plate interaction: picking up the first plate.");
                    releaseCounterSpot(clickedObj.position.z);
                    interactionScene.remove(clickedObj);
                    pickUpPlate(waiter, clickedObj);
                    clickedObj.userData.isInteractable = false;
                    if (clickedObj.userData.foodName){
                        state.heldFood = clickedObj.userData.foodName;
                    }
                }
                else if (waiter && waiter.userData.hasPlate){
                    const heldPlate = waiter.userData.plate;
                    if (heldPlate.userData.interactionType === 'dirty_plate'){
                        console.log("Plate interaction: picking up another plate.");
                        interactionScene.remove(clickedObj);
                        stackPlates(heldPlate, clickedObj);
                        clickedObj.userData.isInteractable = false;
                    }
                }
                else{
                    console.log("Plate are of two different types");
                }
            }
            else if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'WAIT_FOR_FOOD'){
                if (!isInRange(waiter, clickedObj, 'customer', "serve the customer")) return;

                if (waiter && waiter.userData.hasPlate){
                    console.log("Customer interaction: delivering food.");
                    const customerOrder = clickedObj.userData.order;
                    const plateName = waiter.userData.plate.userData.foodName;

                    if (customerOrder !== plateName){
                        console.log("The food on the plate does not match the customer's order.");
                        updateBubble(clickedObj, 'X');
                        shakeHead(clickedObj, () => {
                            updateBubble(clickedObj, customerOrder);
                        });
                        return;
                    }
                    state.puttingPlateSound.play();
                    const plate = putDownPlate(waiter, interactionScene, clickedObj);
                    clickedObj.userData.plate = plate;
                    state.heldFood = null;

                    hideAngerSymbol(clickedObj);
                    clickedObj.userData.timer = 300;

                    if (state.orders) {
                        state.orders = state.orders.filter(order => order.customer !== clickedObj);
                    }

                    if (clickedObj.userData.bubble) {
                        clickedObj.remove(clickedObj.userData.bubble);
                        clickedObj.userData.bubble = null;
                    }
                    clickedObj.userData.state = 'EATING';
                    startEating(clickedObj);
                }
            }
            else if (clickedObj.userData.interactionType === 'counter'){
                if (!isInRange(waiter, clickedObj, 'counter', "reach the counter")) return;

                if (waiter && waiter.userData.hasPlate){
                    const heldPlate = waiter.userData.plate;

                    if (heldPlate.userData.interactionType === 'plate'){
                        const placed = putPlateOnCounter(waiter, interactionScene, KITCHEN_POS.COUNTER);

                        if (placed){
                            console.log("Counter interaction: putting the plate back on the counter.");
                            state.puttingPlateSound.play();
                            state.heldFood = null;
                        }
                        else {
                            showWarningPopup("There's no free spot on the counter!");
                        }
                    }
                    else {
                        showWarningPopup("Dirty plates go on the tray, not on the counter.");
                    }
                }
            }
            else if (clickedObj.userData.interactionType === 'tray' && clickedObj.userData.isInteractable){
                if (!isInRange(waiter, clickedObj, 'tray', "reach the tray")) return;

                if (waiter && waiter.userData.hasPlate) {
                    const heldPlate = waiter.userData.plate;
                    
                    if (heldPlate.userData.interactionType === 'dirty_plate') {
                        console.log("tray interaction: putting down dirty plate on tray.");
                        
                        waiter.remove(heldPlate);
                        state.puttingPlateSound.play();
                        const platesToTray = [heldPlate];
                        for (let i = heldPlate.children.length - 1; i >= 0; i--) {
                            const child = heldPlate.children[i];
                            if (child.userData && child.userData.interactionType === 'dirty_plate') {
                                heldPlate.remove(child);
                                platesToTray.push(child);
                            }
                        }
                        
                        platesToTray.forEach(p => {
                            stackPlates(clickedObj, p);
                            p.userData.isInteractable = false; 
                        });
                        
                        waiter.userData.hasPlate = false;
                        waiter.userData.plate = null;
                        new TWEEN.Tween(waiter.userData.rightFlipper.rotation)
                            .to({ x: 0, y: 0, z: Math.PI/6 }, 300)
                            .easing(TWEEN.Easing.Quadratic.In)
                            .start();
                    }
                
                }
                else{
                    console.log("problem with tray interaction: waiter doesn't have a plate or the plate is not dirty.");
                }
                
            }
            else if (clickedObj.userData.interactionType === 'chair' && !clickedObj.userData.isOccupied){

                const forwardDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), clickedObj.rotation.y).normalize();
                const tablePos = clickedObj.position.clone().add(forwardDir.multiplyScalar(7.0));
                
                let isTableDirty = false;
                interactionScene.traverse((child) => {
                    if (child.userData && child.userData.interactionType === 'dirty_plate' && child.parent === interactionScene) {
                        const platePos = new THREE.Vector3();
                        child.getWorldPosition(platePos);
                        
                        const dx = platePos.x - tablePos.x;
                        const dz = platePos.z - tablePos.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        
                        if (dist < 6.0) {
                            isTableDirty = true;
                        }
                    }
                });

                if (isTableDirty) {
                    showWarningPopup("Clean the table first!");
                    return;
                }

                const currentTableId = clickedObj.userData.tableId;
                let isTableOccupiedByAnother = false;

                if (currentTableId) {
                    interactionScene.traverse((child) => {
                        if (child.userData && 
                            child.userData.interactionType === 'chair' && 
                            child.userData.tableId === currentTableId && 
                            child !== clickedObj) { 
                            
                            if (child.userData.isOccupied) {
                                isTableOccupiedByAnother = true;
                            }
                        }
                    });
                }

                if (isTableOccupiedByAnother) {
                    showWarningPopup("Table has already another customer.");
                    console.log("Table has already another customer.");
                    return; 
                }
                const followingPenguinData = penguins.find(p => p.mesh && p.mesh.userData.state === 'WAIT_FOR_SEAT_ASSIGNMENT');

                if (followingPenguinData && followingPenguinData.mesh){
                    const followingPenguin = followingPenguinData.mesh;
                    hideAngerSymbol(followingPenguin);
                    followingPenguin.userData.state = 'WALK_TO_SEAT';
                    followingPenguin.userData.targetPosition = clickedObj.position.clone();
                    clickedObj.userData.isOccupied = true;
                    followingPenguin.userData.seat = clickedObj;
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