import { state } from './state.js';
import { penguins } from './penguin.js';
import { startWalking, stopWalking } from './animations.js';

const keysPressed = {w: false, a: false, s: false, d: false};

export function setupControls(penguin){
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
export function checkCollisions(targetPos, radius){
    if (!state.colliders) return false;

    // Create a bounding box around the penguin
    const playerBox = new THREE.Box3();
    playerBox.min.set(targetPos.x - radius, targetPos.y, targetPos.z - radius);
    playerBox.max.set(targetPos.x + radius, targetPos.y +4, targetPos.z + radius);

    for (let obj of state.colliders){
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

export function checkPenguinCollision(movingPenguin, targetPos) {
    const collisionRadius = 4.0;

    for (let i = 0; i < penguins.length; i++) {
        const otherPenguin = penguins[i].mesh;

        // if the other penguin is the same as the moving one, skip it
        if (movingPenguin === otherPenguin) continue;

        // compute the distance between the proposed position and the other penguin's position
        const dx = targetPos.x - otherPenguin.position.x;
        const dz = targetPos.z - otherPenguin.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        // if the distance is less than the sum of the radii, there's a collision
        if (distance < (collisionRadius * 2)) {
            return true;
        }
    }

    return false;
}

export function updateMovement(penguin){
    if (!penguin || !state.camera) return;

    const camera = state.camera;
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
        if (!checkCollisions(nextPosition, 2.2) && !checkPenguinCollision(penguin, nextPosition)){
            penguin.position.copy(nextPosition);
        }

        penguin.rotation.y = Math.atan2(moveVector.x, moveVector.z);

        startWalking(penguin);
    }
    else{
        stopWalking(penguin);
    }
}