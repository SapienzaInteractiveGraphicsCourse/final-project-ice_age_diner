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

export function checkCollision(penguin, targetPos, radius = 2.2){
    // Collision with furniture
    if (state.colliders && state.colliders.length){
        const targetBox = new THREE.Box3();
        targetBox.min.set(targetPos.x - radius, targetPos.y, targetPos.z - radius);
        targetBox.max.set(targetPos.x + radius, targetPos.y + 4, targetPos.z + radius);

        for (let obj of state.colliders){
            if (!obj) continue;

            const objBox = new THREE.Box3().setFromObject(obj);
            if (objBox.isEmpty()) continue;

            if (targetBox.intersectsBox(objBox)) return true;
        }
    }

    // Collision between penguins
    const penguinRadius = 4.0;
    for (let i=0; i<penguins.length; i++){
        const other = penguins[i].mesh;
        if (other === penguin) continue;

        const currDx = other.position.x - penguin.position.x;
        const currDz = other.position.z - penguin.position.z;
        const currentDist = Math.sqrt(currDx*currDx + currDz*currDz);

        const nextDx = other.position.x - targetPos.x;
        const nextDz = other.position.z - targetPos.z;
        const nextDist = Math.sqrt(nextDx*nextDx + nextDz*nextDz);

        if (nextDist<penguinRadius && nextDist<currentDist){
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
        if (!checkCollision(penguin, nextPosition, 2.2)){
            penguin.position.copy(nextPosition);
        }

        penguin.rotation.y = Math.atan2(moveVector.x, moveVector.z);

        startWalking(penguin);
    }
    else{
        stopWalking(penguin);
    }
}