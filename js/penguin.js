import { state } from './state.js';
import { startWalking, stopWalking } from './animations.js';

export const penguins = [];

export const KITCHEN_POS = {
    FRIDGE: new THREE.Vector3(-65, 0, 15),
    STOVE: new THREE.Vector3(-65, 0, 5),
    COUNTER: new THREE.Vector3(-42, 0, 0),
    IDLE_CHEF: new THREE.Vector3(-55, 0, 5),
    IDLE_WAITER: new THREE.Vector3(-10, 0, 10),
    IDLE_DISHWASHER: new THREE.Vector3(-55, 0, 15),
    SINK: new THREE.Vector3(-65, 0, -10)
};

//Creates the model of a penguin
export function createPenguinModel(){
    const penguinGroup = new THREE.Group();

    //Define base colors
    const blackMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.8});
    const whiteMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.8});
    const orangeMat = new THREE.MeshStandardMaterial({color: 0xff8c00, roughness: 0.4});

    //Body --> vertically stretched sphere
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const body = new THREE.Mesh(bodyGeo, blackMat);
    body.scale.set(1.3, 1.4, 1.2);
    body.position.y = 1.5;
    penguinGroup.add(body);

    //White belly
    const bellyGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const belly = new THREE.Mesh(bellyGeo, whiteMat);
    belly.scale.set(1.2, 1.35, 0.99);
    belly.position.set(0, 1.4, 0.47);
    penguinGroup.add(belly);

    //Head
    const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const head = new THREE.Mesh(headGeo, blackMat);
    head.position.y = 3.2;
    penguinGroup.add(head);

    //Eyes and pupils
    const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.1, 16, 16);

    const leftEye = new THREE.Mesh(eyeGeo, whiteMat);
    leftEye.position.set(-0.3, 3.3, 0.7);
    const leftPupil = new THREE.Mesh(pupilGeo, blackMat);
    leftPupil.scale.set(1, 1, 0.2);
    leftPupil.position.set(0, 0, 0.14);
    leftEye.add(leftPupil);
    penguinGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, whiteMat);
    rightEye.position.set(0.3, 3.3, 0.7);
    const rightPupil = new THREE.Mesh(pupilGeo, blackMat);
    rightPupil.scale.set(1, 1, 0.2);
    rightPupil.position.set(0, 0, 0.14);
    rightEye.add(rightPupil);
    penguinGroup.add(rightEye);

    //Beak
    const beakGeo = new THREE.ConeGeometry(0.2, 0.6, 16);
    const beak = new THREE.Mesh(beakGeo, orangeMat);
    beak.rotation.x = Math.PI/2;
    beak.position.set(0, 3.1, 0.9);
    penguinGroup.add(beak);

    //Flippers
    const flipperGeo = new THREE.SphereGeometry(0.3, 16, 16);

    const leftFlipper = new THREE.Mesh(flipperGeo, blackMat);
    leftFlipper.scale.set(1, 2.5, 0.5);
    leftFlipper.position.set(-1.2, 1.8, 0);
    leftFlipper.rotation.z = -Math.PI/6;
    penguinGroup.add(leftFlipper);

    const rightFlipper = new THREE.Mesh(flipperGeo, blackMat);
    rightFlipper.scale.set(1, 2.5, 0.5);
    rightFlipper.position.set(1.2, 1.8, 0);
    rightFlipper.rotation.z = Math.PI/6;
    penguinGroup.add(rightFlipper);

    //Feet
    const footGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);

    const leftFoot = new THREE.Mesh(footGeo, orangeMat);
    leftFoot.position.set(-0.5, 0.075, 0.3);
    leftFoot.rotation.y = -Math.PI/10;
    penguinGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, orangeMat);
    rightFoot.position.set(0.5, 0.075, 0.3);
    rightFoot.rotation.y = Math.PI/10;
    penguinGroup.add(rightFoot);

    penguinGroup.scale.set(2.2, 2.2, 2.2);
    penguinGroup.userData.leftFlipper = leftFlipper;
    penguinGroup.userData.rightFlipper = rightFlipper;
    penguinGroup.userData.leftFoot = leftFoot;
    penguinGroup.userData.rightFoot = rightFoot;

    return penguinGroup;
}

export function spawnPenguin(position, role){
    const penguin = createPenguinModel();
    penguin.position.copy(position);
    penguin.userData.role = role;
    penguin.userData.state = 'IDLE';
    penguin.userData.timer = 0;
    penguin.userData.speed = 0.4;
    penguin.userData.hasPlate = false;

    state.scene.add(penguin);

    penguins.push({
        mesh: penguin,
        isMoving: false
    });

    console.log("A new penguin has entered the diner!");
    return penguin;
}

export function moveTowards(penguin, targetPos){
    if (!penguin) return;

    const dx = targetPos.x - penguin.position.x;
    const dz = targetPos.z - penguin.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.5) {
        const dirX = dx / distance;
        const dirZ = dz / distance;

        penguin.position.x += dirX * penguin.userData.speed;
        penguin.position.z += dirZ * penguin.userData.speed;
        penguin.rotation.y = Math.atan2(dirX, dirZ);

        startWalking(penguin);
        return false;
    }else {
        stopWalking(penguin);
        return true;
    }
}

export function updateRoutines(){
    penguins.forEach(penData => {
        const penguin = penData.mesh;
        if (penguin.userData.role === 'chef'){
            updateChefRoutine(penguin);
        }
        else if (penguin.userData.role === 'dishwasher'){
            updateDishwasherRoutine(penguin);
        }
    });
}

function updateChefRoutine(chef) {
    switch(chef.userData.state) {
        case 'IDLE':
            break;

        case 'WALK_FRIDGE':
            if (moveTowards(chef, KITCHEN_POS.FRIDGE)) {
                // moved to fridge, now perform action
                chef.rotation.y = -Math.PI / 2;
                chef.userData.state = 'ACTION_FRIDGE';
                chef.userData.timer = 60; // 1 second to "grab" ingredients
            }
            break;

        case 'ACTION_FRIDGE':
            chef.userData.timer--;
            if (chef.userData.timer <= 0) {
                console.log("CHEF: ingredients grabbed! Now to the stove.");
                chef.userData.state = 'WALK_STOVE';
            }
            break;

        case 'WALK_STOVE':
            if (moveTowards(chef, KITCHEN_POS.STOVE)) {
                // stove reached, now perform cooking action
                chef.rotation.y = -Math.PI / 2;
                chef.userData.state = 'ACTION_STOVE';
                chef.userData.timer = 300;
            }
            break;

        case 'ACTION_STOVE':
            chef.userData.timer--;
            // Animate the chef's rotation slightly to simulate stirring or cooking
            chef.rotation.y = (-Math.PI / 2) + Math.sin(chef.userData.timer * 0.2) * 0.1;

            if (chef.userData.timer <= 0) {
                console.log("CHEF: Dish ready! Taking it to the counter.");
                chef.userData.hasPlate = true;
                chef.userData.state = 'WALK_COUNTER';
            }
            break;

        case 'WALK_COUNTER':
            if (moveTowards(chef, KITCHEN_POS.COUNTER)) {
                chef.rotation.y = Math.PI / 2;
                chef.userData.state = 'ACTION_COUNTER';
                chef.userData.timer = 60;
            }
            break;

        case 'ACTION_COUNTER':
            chef.userData.timer--;
            if (chef.userData.timer <= 0) {
                console.log("CHEF: Order delivered on the counter!");
                chef.userData.hasPlate = false;

                // TO BE ADDED PLATE ON COUNTER LOGIC HERE

                chef.userData.state = 'WALK_IDLE';
            }
            break;

        case 'WALK_IDLE':
            if (moveTowards(chef, KITCHEN_POS.IDLE_CHEF)) {
                chef.rotation.y = Math.PI;
                chef.userData.state = 'IDLE';
            }
            break;
    }
}

function updateDishwasherRoutine(dishwasher) {
    switch(dishwasher.userData.state) {
        case 'IDLE':
            break;

        case 'WALK_COUNTER':
            if (moveTowards(dishwasher, KITCHEN_POS.COUNTER)) {
                dishwasher.rotation.y = Math.PI / 2;
                dishwasher.userData.state = 'ACTION_COUNTER';
                dishwasher.userData.timer = 60;
            }
            break;

        case 'ACTION_COUNTER':
            dishwasher.userData.timer--;
            //LOGIC TO PICK UP DIRTY PLATE FROM COUNTER HERE
            if (dishwasher.userData.timer <= 0) {
                console.log("DISHWASHER: Dirty plate picked up! Now to the sink.");
                dishwasher.userData.state = 'WALK_SINK';
            }
            break;

        case 'WALK_SINK':
            if (moveTowards(dishwasher, KITCHEN_POS.SINK)) {
                dishwasher.rotation.y = -Math.PI / 2;
                dishwasher.userData.state = 'ACTION_SINK';
                dishwasher.userData.timer = 300;
            }
            break;

        case 'ACTION_SINK':
            dishwasher.userData.timer--;
            // Animate the dishwasher's rotation slightly to simulate washing
            dishwasher.rotation.y = (-Math.PI / 2) + Math.sin(dishwasher.userData.timer * 0.2) * 0.1;
            if (dishwasher.userData.timer <= 0) {
                console.log("DISHWASHER: Plate washed! Now to the counter.");
                dishwasher.userData.state = 'WALK_COUNTER';  //put counter to know if there are plate to pickup
            }
    }
}

//function to TEST chef order routine
export function testChefOrder() {
    penguins.forEach(pData => {
        const p = pData.mesh;
        if (p.userData.role === 'chef' && p.userData.state === 'IDLE') {
            console.log("CHEF: Ho ricevuto un ordine! Vado a prendere gli ingredienti.");
            p.userData.state = 'WALK_FRIDGE';
        }
    });
}