import { state } from './state.js';
import { startWalking, stopWalking, animateInteractable, seatPenguin, updateBubble, createPlate } from './animations.js';

export const penguins = [];
export let lastSpawnTime = 0;

export const KITCHEN_POS = {
    FRIDGE: new THREE.Vector3(-65, 0, 15),
    STOVE: new THREE.Vector3(-65, 0, 5),
    COUNTER: new THREE.Vector3(-42, 0, 0),
    IDLE_CHEF: new THREE.Vector3(-55, 0, 5),
    IDLE_WAITER: new THREE.Vector3(-10, 0, 10),
    IDLE_DISHWASHER: new THREE.Vector3(-55, 0, 15),
    SINK: new THREE.Vector3(-65, 0, -10)
};

export const CUSTOMER_POSITIONS = {
    SPAWN: new THREE.Vector3(90, 0, 10),
    DOOR_OUTSIDE: new THREE.Vector3(84, 0, 10),
    DOOR_INSIDE: new THREE.Vector3(74, 0, 10),
}

export const WAITING_POSITION =[
    new THREE.Vector3(74, 0, 18),
    new THREE.Vector3(74, 0, 24),
    new THREE.Vector3(74, 0, 30),
    new THREE.Vector3(74, 0, 36)
]

// Create the model of the penguin based on the role
export function createPenguinModel(role, options = {}){
    const penguinGroup = new THREE.Group();

    // Base materials
    const blackMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 0.8});
    const whiteMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.8});
    const orangeMat = new THREE.MeshStandardMaterial({color: 0xff8c00, roughness: 0.4});
    
    // Materials for the "dress code"
    const yellowGlovesMat = new THREE.MeshStandardMaterial({color: 0xffd700, roughness: 0.6});
    const redOutfitMat = new THREE.MeshStandardMaterial({color: 0xd32f2f, roughness: 0.7});
    const pocketMat = new THREE.MeshStandardMaterial({color: 0xcccccc, roughness: 0.8});

    // Body
    let bodyMat = blackMat;
    if (role === 'customer' && options.shirtColor !== undefined) {
        bodyMat = new THREE.MeshStandardMaterial({color: options.shirtColor, roughness: 0.7});
    }

    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1.3, 1.4, 1.2);
    body.position.y = 1.5;
    penguinGroup.add(body);

    // White belly
    const bellyGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const belly = new THREE.Mesh(bellyGeo, whiteMat);
    belly.scale.set(1.2, 1.35, 0.99);
    belly.position.set(0, 1.4, 0.47);
    penguinGroup.add(belly);

    // Head
    const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const head = new THREE.Mesh(headGeo, blackMat);
    head.position.y = 3.2;
    penguinGroup.add(head);

    // Eyes and pupils
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

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.2, 0.6, 16);
    const beak = new THREE.Mesh(beakGeo, orangeMat);
    beak.rotation.x = Math.PI/2;
    beak.position.set(0, 3.1, 0.9);
    penguinGroup.add(beak);

    // Flippers
    const flipperMat = (role === 'dishwasher') ? yellowGlovesMat : blackMat;
    const flipperGeo = new THREE.SphereGeometry(0.3, 16, 16);

    const leftFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    leftFlipper.scale.set(1, 2.5, 0.5);
    leftFlipper.position.set(-1.2, 1.8, 0);
    leftFlipper.rotation.z = -Math.PI/6;
    penguinGroup.add(leftFlipper);

    const rightFlipper = new THREE.Mesh(flipperGeo, flipperMat);
    rightFlipper.scale.set(1, 2.5, 0.5);
    rightFlipper.position.set(1.2, 1.8, 0);
    rightFlipper.rotation.z = Math.PI/6;
    penguinGroup.add(rightFlipper);

    // Feet
    const footGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);

    const leftFoot = new THREE.Mesh(footGeo, orangeMat);
    leftFoot.position.set(-0.5, 0.075, 0.3);
    leftFoot.rotation.y = -Math.PI/10;
    penguinGroup.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, orangeMat);
    rightFoot.position.set(0.5, 0.075, 0.3);
    rightFoot.rotation.y = Math.PI/10;
    penguinGroup.add(rightFoot);

    // Chef outfit
    if (role === 'chef') {
        // Chef hat
        const hatGroup = new THREE.Group();
        
        const hatBaseGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.4, 16);
        const hatBase = new THREE.Mesh(hatBaseGeo, whiteMat);
        hatBase.position.y = 3.9;
        hatGroup.add(hatBase);

        const hatTopGeo = new THREE.CylinderGeometry(0.65, 0.5, 0.5, 16);
        const hatTop = new THREE.Mesh(hatTopGeo, whiteMat);
        hatTop.position.y = 4.3;
        hatGroup.add(hatTop);

        penguinGroup.add(hatGroup);

        // White apron
        const apronGeo = new THREE.BoxGeometry(0.9, 1.1, 0.05);
        const apron = new THREE.Mesh(apronGeo, whiteMat);
        apron.position.set(0, 1.3, 1.38);
        penguinGroup.add(apron);

        const pocketGeo = new THREE.BoxGeometry(0.4, 0.25, 0.02);
        const pocket = new THREE.Mesh(pocketGeo, pocketMat);
        pocket.position.set(0, 1.1, 1.41);
        penguinGroup.add(pocket);
    }

    // Dishwasher helper outfit
    if (role === 'dishwasher') {
        // bandana
        const bandanaGeo = new THREE.TorusGeometry(0.78, 0.08, 8, 24);
        const bandana = new THREE.Mesh(bandanaGeo, redOutfitMat);
        bandana.position.set(0, 3.4, 0);
        bandana.rotation.x = Math.PI / 2;
        penguinGroup.add(bandana);

        // knot of the bandana
        const knotGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
        const knot1 = new THREE.Mesh(knotGeo, redOutfitMat);
        knot1.position.set(-0.1, 3.4, -0.78);
        knot1.rotation.z = Math.PI / 4;
        penguinGroup.add(knot1);

        const knot2 = new THREE.Mesh(knotGeo, redOutfitMat);
        knot2.position.set(0.1, 3.4, -0.78);
        knot2.rotation.z = -Math.PI / 4;
        penguinGroup.add(knot2);
    }

    // Waiter outfit (the player)
    if (role === 'waiter') {
        const bowtieGroup = new THREE.Group();
        
        const centerGeo = new THREE.SphereGeometry(0.07, 8, 8);
        const center = new THREE.Mesh(centerGeo, redOutfitMat);
        bowtieGroup.add(center);

        const wingGeo = new THREE.ConeGeometry(0.12, 0.22, 4);
        const leftWing = new THREE.Mesh(wingGeo, redOutfitMat);
        leftWing.position.x = -0.14;
        leftWing.rotation.z = Math.PI / 2;
        bowtieGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, redOutfitMat);
        rightWing.position.x = 0.14;
        rightWing.rotation.z = -Math.PI / 2;
        bowtieGroup.add(rightWing);

        bowtieGroup.position.set(0, 2.5, 0.98);
        penguinGroup.add(bowtieGroup);
    }

    penguinGroup.scale.set(2.2, 2.2, 2.2);
    penguinGroup.userData.leftFlipper = leftFlipper;
    penguinGroup.userData.rightFlipper = rightFlipper;
    penguinGroup.userData.leftFoot = leftFoot;
    penguinGroup.userData.rightFoot = rightFoot;

    return penguinGroup;
}

export function spawnPenguin(position, role){
    let options = {};

    if (role === 'customer') {
        const customerColors = [
            0xff5733, // Orange
            0x33ff57, // Green
            0x3357ff, // Blue
            0xf39c12, // Yellow
            0x9b59b6, // Purple
            0x1abc9c, // Turquoise
            0xe74c3c, // Red
            0xe84393, // Pink
            0x00cec9  // Cyan
        ];
        options.shirtColor = customerColors[Math.floor(Math.random() * customerColors.length)];
    }

    const penguin = createPenguinModel(role, options);
    penguin.position.copy(position);
    penguin.userData.role = role;
    penguin.userData.state = 'IDLE';
    penguin.userData.timer = 0;
    penguin.userData.isInteractable = false;
    
    if (role === 'customer') {
        penguin.userData.seat = null;
        penguin.userData.order = null;
    }

    if (role === 'chef') {
        penguin.userData.currentOrder = null;
    }

    if (role === 'waiter' || role === 'dishwasher' || role === "customer") {
        penguin.userData.plate = null;
    }

    if (role === 'chef') penguin.userData.speed = 0.22;
    else if (role === 'dishwasher') penguin.userData.speed = 0.28;
    else if (role === 'customer') penguin.userData.speed = 0.25;
    else penguin.userData.speed = 0.4;

    penguin.userData.hasPlate = false;

    state.scene.add(penguin);

    penguins.push({
        mesh: penguin,
        isMoving: false
    });

    console.log(`A new ${role} penguin has entered the diner!`);
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
    } else {
        stopWalking(penguin);
        return true;
    }
}

export function updateRoutines(){
    updateCustomerSpawn();

    penguins.forEach(penData => {
        const penguin = penData.mesh;
        if (penguin.userData.role === 'chef'){
            updateChefRoutine(penguin);
        }
        else if (penguin.userData.role === 'dishwasher'){
            updateDishwasherRoutine(penguin);
        }
        else if (penguin.userData.role === 'customer'){
            updateCustomerRoutine(penguin);
        }
    });
}

function getFridgeDoor(chef) {
    if (chef.userData.fridgeDoorRef) return chef.userData.fridgeDoorRef;

    let foundDoor = null;
    state.scene.traverse((child) => {
        if (child.userData && child.userData.originalRotation !== undefined) {
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            if (worldPos.distanceTo(KITCHEN_POS.FRIDGE) < 15) {
                foundDoor = child;
            }
        }
    });

    if (foundDoor) {
        chef.userData.fridgeDoorRef = foundDoor;
    }
    return foundDoor;
}

export function spawnCustomer(){
    const occupiedPositions = penguins.filter(p => p.mesh.userData.role === 'customer').map(p => p.mesh.userData.positionIndex);
    let availablePosition = -1;
    for (let i = 0; i < WAITING_POSITION.length; i++) {
        if (!occupiedPositions.includes(i)){
            availablePosition = i;
            break;    
        }
    }
    if (availablePosition === -1) {
        console.log("No available waiting position for customer!");
        return;
    }

    const customer = spawnPenguin(CUSTOMER_POSITIONS.SPAWN, 'customer');

    customer.userData.state = 'WALK_TO_DOOR';
    customer.userData.positionIndex = availablePosition;
    customer.userData.targetPosition = WAITING_POSITION[availablePosition];
}

function getMainDoor(customer) {
    if (customer.userData.mainDoorRef) return customer.userData.mainDoorRef;

    let foundDoor = null;
    state.scene.traverse((child) => {
        if (child.userData && child.userData.doorType === 'single') {
            foundDoor = child.userData.targetToRotate; 
        }
    });

    if (foundDoor) {
        customer.userData.mainDoorRef = foundDoor;
    }
    return foundDoor;
}

function updateCustomerSpawn() {
    const currentTime = Date.now();
    if (currentTime - lastSpawnTime >= 10000) {
        const customerCount = penguins.filter(p => p.mesh.userData.role === 'customer').length;
        if (customerCount < WAITING_POSITION.length) {
            spawnCustomer();
            lastSpawnTime = currentTime;
        }
        
    }
}

function updateChefRoutine(chef){
    const resetFlippers = () => {
        chef.userData.leftFlipper.rotation.set(0, 0, -Math.PI / 6);
        chef.userData.rightFlipper.rotation.set(0, 0, Math.PI / 6);
    };

    switch(chef.userData.state){
        case 'IDLE':
            if (state.orders.length > 0 && state.orders.some(order => order.status === 'pending')) {
                console.log("CHEF: New order received! Heading to the fridge.");
                const nextOrder = state.orders.find(order => order.status === 'pending');
                if (nextOrder) {
                    nextOrder.status = 'cooking';
                    chef.userData.currentOrder = nextOrder;
                    chef.userData.state = 'WALK_FRIDGE';
                }
            }
            break;

        case 'WALK_FRIDGE':
            if (moveTowards(chef, KITCHEN_POS.FRIDGE)){
                chef.rotation.y = -Math.PI / 2;
                chef.userData.state = 'ACTION_FRIDGE';
                chef.userData.timer = 80;
            }
            break;

        case 'ACTION_FRIDGE':
            chef.userData.timer--;
            const doorFridge = getFridgeDoor(chef);
            const axis = doorFridge ? (doorFridge.userData.rotationAxis || 'y') : 'y';
            const origRot = doorFridge ? (doorFridge.userData.originalRotation || 0) : 0;
            const openAngle = (doorFridge && doorFridge.userData.openAngle !== undefined) ? doorFridge.userData.openAngle : -Math.PI / 2;

            if (chef.userData.timer > 60){
                chef.userData.rightFlipper.rotation.set(-Math.PI / 2.5, Math.PI / 6, 0);
                if (doorFridge) {
                    const progress = (80 - chef.userData.timer) / 20;
                    doorFridge.rotation[axis] = origRot + (openAngle * progress);
                    doorFridge.userData.isOpen = true;
                }
            }
            else if (chef.userData.timer > 20){
                chef.userData.leftFlipper.rotation.x = -Math.PI / 4 + Math.sin(chef.userData.timer * 0.4) * 0.1;
                chef.userData.rightFlipper.rotation.x = -Math.PI / 3 + Math.cos(chef.userData.timer * 0.4) * 0.1;
                if (doorFridge) {
                    doorFridge.rotation[axis] = origRot + openAngle;
                }
            }
            else if (chef.userData.timer > 0){
                chef.userData.rightFlipper.rotation.set(-Math.PI / 4, -Math.PI / 12, 0);
                chef.userData.leftFlipper.rotation.set(0, 0, -Math.PI / 6);
                if (doorFridge) {
                    const progress = chef.userData.timer / 20;
                    doorFridge.rotation[axis] = origRot + (openAngle * progress);
                }
            }

            if (chef.userData.timer <= 0) {
                console.log("CHEF: ingredients grabbed! Now to the stove.");
                if (doorFridge) {
                    doorFridge.rotation[axis] = origRot;
                    doorFridge.userData.isOpen = false;
                }
                resetFlippers();
                chef.userData.state = 'WALK_STOVE';
            }
            break;

        case 'WALK_STOVE':
            if (moveTowards(chef, KITCHEN_POS.STOVE)) {
                chef.rotation.y = -Math.PI / 2;
                chef.userData.state = 'ACTION_STOVE';
                chef.userData.timer = 300;
            }
            break;

        case 'ACTION_STOVE':
            chef.userData.timer--;
            chef.userData.leftFlipper.rotation.set(-Math.PI / 2.2, 0, -Math.PI / 12 + Math.sin(chef.userData.timer * 0.2) * 0.15);
            chef.userData.rightFlipper.rotation.set(-Math.PI / 2.2, 0, Math.PI / 12 + Math.cos(chef.userData.timer * 0.2) * 0.15);

            if (chef.userData.timer <= 0) {
                console.log("CHEF: Cooking finished! Now picking up the plate.");
                resetFlippers();
                chef.userData.state = 'ACTION_PICK_PLATE';
                chef.userData.timer = 50; 
            }
            break;

        case 'ACTION_PICK_PLATE':
            chef.userData.timer--;
            chef.userData.leftFlipper.rotation.set(-Math.PI / 4, 0, -Math.PI / 12);
            chef.userData.rightFlipper.rotation.set(-Math.PI / 4, 0, Math.PI / 12);
            
            if (chef.userData.timer <= 0) {
                console.log("CHEF: Plate picked up! Walking to the counter.");
                const newplate = createPlate(chef.userData.currentOrder.food);
                newplate.name = 'plate';
                // newplate.scale.set(0.5, 0.5, 0.5); 
                newplate.position.set(0, 4, 3);
                chef.add(newplate);
                chef.userData.hasPlate = true;
                chef.userData.state = 'WALK_COUNTER';
            }
            break;

        case 'WALK_COUNTER':
            const reachedCounter = moveTowards(chef, KITCHEN_POS.COUNTER);
            
            if (chef.userData.hasPlate) {
                chef.userData.leftFlipper.rotation.set(-Math.PI / 2.5, 0, -Math.PI / 16);
                chef.userData.rightFlipper.rotation.set(-Math.PI / 2.5, 0, Math.PI / 16);
            }

            if (reachedCounter) {
                chef.rotation.y = Math.PI / 2;
                chef.userData.state = 'ACTION_COUNTER';
                chef.userData.timer = 60;
            }
            break;

        case 'ACTION_COUNTER':
            chef.userData.timer--;
            
            if (chef.userData.timer > 20) {
                const progress = (60 - chef.userData.timer) / 40;
                const targetAngle = -Math.PI / 2.5 + (Math.PI / 4 * progress);
                chef.userData.leftFlipper.rotation.set(targetAngle, 0, -Math.PI / 16);
                chef.userData.rightFlipper.rotation.set(targetAngle, 0, Math.PI / 16);
            }
            else{
                resetFlippers();
            }

            if (chef.userData.timer <= 0) {
                console.log("CHEF: Order delivered on the counter!");
                if (chef.userData.hasPlate && chef.children.find(child => child.name === 'plate')) {
                    chef.userData.hasPlate = false;
                    const completedOrder = chef.children.find(child => child.name === 'plate')
                    chef.remove(completedOrder);
                    completedOrder.userData.isInteractable = true;
                    state.scene.add(completedOrder);
                    completedOrder.position.set(KITCHEN_POS.COUNTER.x +8, KITCHEN_POS.COUNTER.y + 4.6, KITCHEN_POS.COUNTER.z );
                    completedOrder.rotation.set(0, 0, 0);
                    chef.userData.currentOrder.status = 'ready';
                }
                

                if (state.orders.length > 0 && state.orders.some(order => order.status === 'pending')) {
                    console.log("CHEF: New order received! Heading to the fridge.");
                    const nextOrder = state.orders.find(order => order.status === 'pending');
                    if (nextOrder) {
                        nextOrder.status = 'cooking';
                        chef.userData.currentOrder = nextOrder;
                        chef.userData.state = 'WALK_FRIDGE';
                    }
                }
                else {
                    console.log("CHEF: No more orders. Returning to idle position.");
                    chef.userData.state = 'WALK_IDLE';
                }
                
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
            dishwasher.rotation.y = (-Math.PI / 2) + Math.sin(dishwasher.userData.timer * 0.2) * 0.1;
            if (dishwasher.userData.timer <= 0) {
                console.log("DISHWASHER: Plate washed! Now to the counter.");
                dishwasher.userData.state = 'WALK_COUNTER';  
            }
    }
}

function updateCustomerRoutine(customer) {
    switch(customer.userData.state) {
        /*case 'IDLE':
            break;*/
        
        case 'WALK_TO_DOOR':
            if (moveTowards(customer, CUSTOMER_POSITIONS.DOOR_OUTSIDE)) {
                customer.rotation.y = -Math.PI / 2;
                const mainDoor = getMainDoor(customer);

                if (mainDoor && !mainDoor.userData.isOpen) {
                    mainDoor.userData.isOpen = true;

                    let angleToOpen = mainDoor.userData.openAngle;
                    if (angleToOpen === undefined) {
                        angleToOpen = -Math.PI/2; 
                    }
                    const targetRotationY = mainDoor.userData.originalRotation + angleToOpen;
                    
                    animateInteractable(mainDoor, targetRotationY, mainDoor.userData.rotationAxis || 'y');
                    
                    customer.userData.timer = 50; 
                    customer.userData.state = 'WAIT_FOR_DOOR_ANIMATION';
                } else {
                    customer.userData.state = 'WALK_INSIDE';
                }
            }
            break;

        case 'WAIT_FOR_DOOR_ANIMATION':
            customer.userData.timer--;
            if (customer.userData.timer <= 0) {
                customer.userData.state = 'WALK_INSIDE';
            }
            break;

        case 'WALK_INSIDE':
            if (moveTowards(customer, CUSTOMER_POSITIONS.DOOR_INSIDE)) {
                const mainDoor = getMainDoor(customer);
                if (mainDoor && mainDoor.userData.isOpen) {
                    mainDoor.userData.isOpen = false;
                    animateInteractable(mainDoor, mainDoor.userData.originalRotation, mainDoor.userData.rotationAxis || 'y');
                }
                customer.userData.state = 'WALK_TO_WAITING';
            }
            break;

        case 'WALK_TO_WAITING':
            if (moveTowards(customer, customer.userData.targetPosition)) {
                customer.rotation.y = -Math.PI / 2;
                customer.userData.state = 'WAIT_FOR_WAITER';
            }
            break;
        
        case 'WAIT_FOR_WAITER':
            if (!customer.userData.isInteractable) {
                customer.userData.isInteractable = true;
                customer.userData.interactionType = 'customer';
                customer.userData.timer = 0;
            }
            break;

        case 'FOLLOW_WAITER':
            const waiter = penguins.find(p => p.mesh.userData.role === 'waiter').mesh;
            const distanceToWaiter = customer.position.distanceTo(waiter.position);
            if (distanceToWaiter > 10) {
                moveTowards(customer, waiter.position);
            }else{
                stopWalking(customer);
                const lookPos = new THREE.Vector3(waiter.position.x, customer.position.y, waiter.position.z);
                customer.lookAt(lookPos);
            }
            break;
        
        case 'WALK_TO_SEAT':
            const chair = customer.userData.seat;
            if (chair) {
                if (moveTowards(customer, chair.position)) {
                    seatPenguin(customer, chair);
                    customer.userData.state = 'SEATED';
                }
            }
            break;

        case 'SEATED':
            const chairOccuppied = customer.userData.seat;
            chairOccuppied.userData.isOccupied = true;
            chairOccuppied.userData.isInteractable = false;

            customer.userData.state = 'THINKING';
            customer.userData.timer = 500;
            updateBubble(customer, '...');
            break;

        case 'THINKING':
            customer.userData.timer--;
            if (customer.userData.timer <= 0) {
                console.log("CUSTOMER: I'm ready to order!");
                customer.userData.order = state.menu[Math.floor(Math.random() * state.menu.length)];
                customer.userData.isInteractable = true;
                customer.userData.timer = 30000;
                customer.userData.state = 'READY_TO_ORDER';
                updateBubble(customer, '!');
            }
            break;

        case 'READY_TO_ORDER':
            customer.userData.timer--;
            if (customer.userData.timer <= 10000) {
                console.log("CUSTOMER: I've been waiting too long! I'm angry!");
                customer.userData.state = 'ANGRY';
                updateBubble(customer, '!!!');
            }
            break;

        case 'WAIT_FOR_FOOD':
            customer.userData.timer--;
            if (customer.userData.timer <= 10000) {
                console.log("CUSTOMER: I've been waiting too long! I'm angry!");
                customer.userData.state = 'ANGRY';
                updateBubble(customer, '!!!');
            }
            break;

        case 'EATING':
            customer.userData.timer--;
            customer.userData.isInteractable = false;
            if (customer.userData.timer <= 0) {
                const plate = customer.userData.plate;
                if (plate) {
                    while (plate.children.length > 1) {
                        const foodItem = plate.children[1];
                        plate.remove(foodItem);
                    }
                }
                plate.userData.isInteractable = true;
                console.log("CUSTOMER: eated food")
                customer.userData.state = 'LEAVING';
            }
            
            break;

        case 'ANGRY':
            //ADD ANGRY ANIMATION
            customer.userData.timer--;
            if (customer.userData.timer <= 0) {
                console.log("CUSTOMER: I've been waiting too long! I'm leaving!");
                customer.userData.state = 'LEAVING';
                updateBubble(customer, '!!!');
            }

            break;

        case 'LEAVING':
            if (moveTowards(customer, CUSTOMER_POSITIONS.DOOR_INSIDE)) {
                customer.rotation.y = -Math.PI / 2;
                const mainDoor = getMainDoor(customer);
            }
            break;

    }
}

export function testChefOrder() {
    penguins.forEach(pData => {
        const p = pData.mesh;
        if (p.userData.role === 'chef' && p.userData.state === 'IDLE') {
            console.log("CHEF: Ho ricevuto un ordine! Vado a prendere gli ingredienti.");
            p.userData.state = 'WALK_FRIDGE';
        }
    });
}
window.testChefOrder = testChefOrder;