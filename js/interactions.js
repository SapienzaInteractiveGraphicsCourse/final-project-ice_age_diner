import { animateInteractable } from './animations.js';

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

    // search for intersctions
    const intersects = raycaster.intersectObjects(interactionScene.children, true);

    if (intersects.length > 0){
        //only if it's interactable
        const clickedObj = intersects.find(hit => hit.object.userData.isInteractable)?.object;

        if (clickedObj){
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