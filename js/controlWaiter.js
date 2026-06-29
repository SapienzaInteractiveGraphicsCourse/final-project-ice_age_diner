const keysPressed = {w: false, a: false, s: false, d: false};

function setupControls(penguin){
    window.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();
        if (key in keysPressed) keysPressed[key] = true;
    });

    window.addEventListener("keyup", (event) => {
        const key = event.key.toLowerCase();
        if (key in keysPressed) keysPressed[key] = false;
    });
}

// Checks if the next position of the penguin hits an object
function checkCollisions(targetPos, radius){
    if (!window.colliders) return false;

    // Create a bounding box around the penguin
    const playerBox = new THREE.Box3();
    playerBox.min.set(targetPos.x - radius, targetPos.y, targetPos.z - radius);
    playerBox.max.set(targetPos.x + radius, targetPos.y +4, targetPos.z + radius);

    for (let obj of window.colliders){
        if (!obj) continue;

        // Create a box for the object in the map
        const objBox = new THREE.Box3().setFromObject(obj);

        // Ignore empty objects
        if (objBox.isEmpty()) continue;

        // If the boxes intersecate, there's a collision
        if (playerBox.intersectsBox(objBox)){
            return true;
        }
    }
    return false;
}

function updateMovement(penguin){
    if (!penguin || typeof camera == "undefined") return;

    const speed = 0.4;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, forward).normalize();

    const moveVector = new THREE.Vector3(0,0,0);

    if (keysPressed["w"]) moveVector.add(forward.clone().multiplyScalar(speed));
    if (keysPressed["s"]) moveVector.add(forward.clone().multiplyScalar(-speed));
    if (keysPressed["a"]) moveVector.add(right.clone().multiplyScalar(speed));
    if (keysPressed["d"]) moveVector.add(right.clone().multiplyScalar(-speed));

    if (moveVector.lengthSq()>0){
        const nextPosition = penguin.position.clone().add(moveVector);

        // Move only if there's no collision
        if (!checkCollisions(nextPosition, 1.5)){
            penguin.position.copy(nextPosition);
        }

        penguin.rotation.y = Math.atan2(moveVector.x, moveVector.z);

        if (typeof startWalking == "function") startWalking(penguin);
    }
    else{
        if (typeof stopWalking == "function") stopWalking(penguin);  
    }
}