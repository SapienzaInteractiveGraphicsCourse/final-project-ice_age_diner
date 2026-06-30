import { animateInteractable } from './animations.js';
import {penguins} from './penguin.js';

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

            if (clickedObj.userData.interactionType === 'customer' && clickedObj.userData.state === 'WAIT_FOR_WAITER'){
                console.log("Customer interaction: calling waiter for customer.");
                clickedObj.userData.state = 'FOLLOW_WAITER';
                clickedObj.userData.isInteractable = false;
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