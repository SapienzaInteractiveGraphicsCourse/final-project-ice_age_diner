const keysPressed = { w: false, a: false, s: false, d: false };

function setupControls(penguin) {
    // when a key is pressed, we set the corresponding key in keysPressed to true
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        
        if (key in keysPressed) {
            keysPressed[key] = true;
        }
        
    });

    // when a key is released, we set the corresponding key in keysPressed to false
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        
        if (key in keysPressed) {
            keysPressed[key] = false;
        }
    });
}

function updateMovement(penguin) {
    if (!penguin) return;

    const moveSpeed = 0.12; // speed of the penguin's movement per frame
    let moveX = 0;
    let moveZ = 0;

    // INPUT from keyboard
    // 
    // In Three.js: +X is right, -X is left, -Z is "forward/into the screen", +Z is "backward/out of the screen"
    if (keysPressed.w) moveZ = -1; // Moves toward the top of the screen (-Z)
    if (keysPressed.s) moveZ = 1;  // Moves toward the bottom of the screen (+Z)
    if (keysPressed.a) moveX = -1; // Moves toward the left (-X)
    if (keysPressed.d) moveX = 1;  // Moves toward the right (+X)

    // check if any movement is happening
    if (moveX !== 0 || moveZ !== 0) {
        
        // NORMALIZATION of movement vector
        // This ensures that diagonal movement isn't faster than straight movement.
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const normX = moveX / length;
        const normZ = moveZ / length;

        //rotation
        const targetAngle = Math.atan2(normX, normZ);
        penguin.rotation.y = targetAngle;

        // movement
        penguin.position.x += normX * moveSpeed;
        penguin.position.z += normZ * moveSpeed;

        startWalking(penguin);
    } else {
        // stop walking if no keys are pressed
        stopWalking(penguin);
    }
}