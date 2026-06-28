let raycaster;
let mouse;
let interactionCamera;
let interactionScene;

// function to setup the raycasting and mouse click interactions
function setupInteractions(camera, scene) {
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
function onMouseClick(event) {
    // position of the mouse in normalized device coordinates (-1 to +1) for both components
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, interactionCamera);

    // search for intersctions
    const intersects = raycaster.intersectObjects(interactionScene.children, true);

    if (intersects.length > 0) {
        //only if it's interactable
        const clickedObj = intersects.find(hit => hit.object.userData.isInteractable)?.object;
        
        if (clickedObj) {
            console.log("interaction with:", clickedObj.name);
            
            //rotation
            const rotationAmount = Math.PI / 2;
            let targetRotationY = clickedObj.userData.originalRotation;

            if (!clickedObj.userData.isOpen) {
                // rotation for opening the door
                // CORREZIONE QUI: I segni + e - sono stati invertiti per farle aprire verso l'esterno!
                if (clickedObj.userData.doorType === 'left') {
                    targetRotationY = clickedObj.userData.originalRotation + rotationAmount;
                } else {
                    targetRotationY = clickedObj.userData.originalRotation - rotationAmount;
                }
                clickedObj.userData.isOpen = true;
            } else {
                // rotation for closing the door
                targetRotationY = clickedObj.userData.originalRotation;
                clickedObj.userData.isOpen = false;
            }
            
            // animation using Tween.js for smooth rotation
            if (typeof TWEEN !== 'undefined') {
                new TWEEN.Tween(clickedObj.rotation)
                    .to({ y: targetRotationY }, 800) // 800 milliseconds for the rotation
                    .easing(TWEEN.Easing.Quadratic.Out) // easing function for a smooth effect
                    .start();
            } else {
                clickedObj.rotation.y = targetRotationY;
                console.warn("Tween.js non trovato! Animazione eseguita a scatto.");
            }
        }
    }
}