import { state } from './state.js';
import {
    startWalking, stopWalking, animateInteractable, seatPenguin,
    resetFlippers, animateChefFridgeReach, animateChefStove, setChefPickupPose,
    setChefCarryPose, animateChefCounterRelease, pickUpPlate,
    startReadingMenu, stopReadingMenu, startCallingWaiter, stopCallingWaiter,
    stopEating, showAngerSymbol, hideAngerSymbol, triggerAngerFlap,
    animateChefTrashToss, COUNTER_PLATE_X, COUNTER_PLATE_Y
} from './animations.js';
import {
    configureCollisions, moveTowards, isAreaFree,
    acquireDoorLane, releaseDoorLane, getDoorLaneOwner, watchdogDoorLane
} from './collisions.js';
import {updateBubble, createNameTag, createPlate, getFreeCounterSpot,
    releaseCounterSpot, stackPlates, updateNameTagColor} from './utils.js';
export { moveTowards };

export const penguins = [];
export const waitingQueue = [];
export let lastSpawnTime = 0;

export const KITCHEN_POS = {
    FRIDGE: new THREE.Vector3(-65, 0, 24),
    TRASH: new THREE.Vector3(-64, 0, 27),
    STOVE: new THREE.Vector3(-65, 0, 4.5),
    COUNTER: new THREE.Vector3(-44, 0, 0),
    IDLE_CHEF: new THREE.Vector3(-55, 0, 5),
    IDLE_WAITER: new THREE.Vector3(-10, 0, 10),
    IDLE_DISHWASHER: new THREE.Vector3(-55, 0, -18),
    SINK: new THREE.Vector3(-65, 0, -12),
    COUNTER_DISHWASHER: new THREE.Vector3(-44, 0, -18)
};

export const CUSTOMER_POSITIONS = {
    SPAWN: new THREE.Vector3(124, 0, 20),
    DOOR_OUTSIDE: new THREE.Vector3(84, 0, 10), 
    DOOR_INSIDE: new THREE.Vector3(74, 0, 10),
    DOOR_WAIT_INSIDE: new THREE.Vector3(68, 0, 10),
    DOOR_INSIDE_LEAVE: new THREE.Vector3(65, 0, 10),
    DESPAWN: new THREE.Vector3(124, 0, 10)
};

const ANGER_THRESHOLD = 1200;
const CUSTOMER_SPEED = 0.25;
const CUSTOMER_ANGRY_SPEED = 0.42;

const DOOR_ANIMATION_FRAMES = 60;

const QUEUE_START_X = 74;
const QUEUE_START_Z = 36;
const QUEUE_SPACING = 6;
const QUEUE_EXIT_X = 65;
const AISLE_Z = 10;
const SEAT_AISLE_Z = 17;

export const WAITING_POSITION = [];
for (let i = 0; i < 3; i++) {
    WAITING_POSITION.push(new THREE.Vector3(QUEUE_START_X, 0, QUEUE_START_Z - (i*QUEUE_SPACING)));
}
for (let i = 0; i < 4; i++) {
    WAITING_POSITION.push(new THREE.Vector3(92 + (i*8), 0, 20));
}

const INSIDE_POSITIONS = WAITING_POSITION.slice(0, 3);
const OUTSIDE_POSITIONS = WAITING_POSITION.slice(3);
export const leavingQueue = [];

const SLOT_CLEAR_RADIUS = 4.0;
const DOOR_AREA_RADIUS = 5.0;
const DOOR_CLEAR_Z = 20;

configureCollisions({
    agentsProvider: () => penguins,
    doorPoints: [CUSTOMER_POSITIONS.DOOR_INSIDE, CUSTOMER_POSITIONS.DOOR_OUTSIDE]
});

function isSpotFree(spot, exclude, radius = SLOT_CLEAR_RADIUS){
    return isAreaFree(spot, exclude, radius, mesh => mesh.userData.role === 'customer');
}

function isUsingDoor(customer){
    const st = customer.userData.state;

    const isEntering = (
        st === 'WALK_TO_DOOR' ||
        st === 'WAIT_FOR_DOOR_ANIMATION' ||
        st === 'WALK_INSIDE' ||
        st === 'ALIGN_TO_QUEUE' ||
        (st === 'WALK_TO_WAITING' && customer.position.z < DOOR_CLEAR_Z)
    );

    const isLeaving = (st === 'LEAVING' && leavingQueue.includes(customer));

    return isEntering || isLeaving;
}

function insideCustomers(){
    return waitingQueue.filter(c => c.userData.hasEnteredInside);
}

function outsideCustomers(){
    return waitingQueue.filter(c => !c.userData.hasEnteredInside);
}

function insideSlotOf(customer){
    const r = insideCustomers().indexOf(customer);
    if (r < 0) return null;
    return INSIDE_POSITIONS[Math.min(r, INSIDE_POSITIONS.length - 1)];
}

function outsideSlotOf(customer){
    const r = outsideCustomers().indexOf(customer);
    if (r < 0) return null;
    return OUTSIDE_POSITIONS[Math.min(r, OUTSIDE_POSITIONS.length - 1)];
}

function canEnter(customer){
    if (customer.userData.hasEnteredInside) return false;
    if (outsideCustomers()[0] !== customer) return false;
    if (leavingQueue.length > 0) return false;

    const insideCount = insideCustomers().length;
    if (insideCount >= INSIDE_POSITIONS.length) return false;

    const entrySlot = INSIDE_POSITIONS[insideCount];
    if (!isSpotFree(entrySlot, customer)) return false;
    if (!isSpotFree(CUSTOMER_POSITIONS.DOOR_INSIDE, customer, DOOR_AREA_RADIUS)) return false;

    if (!acquireDoorLane(customer)) return false;

    customer.userData.pendingSlot = entrySlot;
    return true;
}

function canExit(customer){
    if (getDoorLaneOwner() === customer) return true;

    const ready = leavingQueue.find(c => c.userData.subState === 'AWAIT_DOOR_LANE');
    if (ready !== customer) return false;

    return acquireDoorLane(customer);
}

const LEAVE_STALL_LIMIT = 480;
function updateLeaveStallWatch(customer){
    const ud = customer.userData;

    if (!ud.leaveStallPos){
        ud.leaveStallPos = customer.position.clone();
        ud.leaveStallSub = ud.subState;
        ud.leaveStallTimer = 0;
        return;
    }

    if (ud.subState !== ud.leaveStallSub){
        ud.leaveStallSub = ud.subState;
        ud.leaveStallTimer = 0;
        ud.leaveStallPos.copy(customer.position);
        return;
    }

    if (ud.subState === 'AWAIT_DOOR_LANE') return;

    if (customer.position.distanceTo(ud.leaveStallPos) > 0.2){
        ud.leaveStallTimer = 0;
        ud.leaveStallPos.copy(customer.position);
        return;
    }

    ud.leaveStallTimer++;
    if (ud.leaveStallTimer > LEAVE_STALL_LIMIT){
        ud.leaveStallTimer = 0;
        forceLeavingProgress(customer);
    }
}

function forceLeavingProgress(customer){
    const ud = customer.userData;

    switch (ud.subState){
        case 'BACK_AWAY_FROM_TABLE':
            if (ud.seat){
                ud.seat.userData.isOccupied = false;
                ud.seat.userData.isInteractable = true;
                ud.seat = null;
            }
            ud.subState = 'AWAIT_DOOR_LANE';
            break;

        case 'LEAVE_QUEUE_SIDESTEP':
            ud.subState = 'WALK_TO_AISLE';
            break;

        case 'WALK_TO_AISLE':
            ud.subState = ud.exitFromQueue ? 'WALK_TO_DOOR_INSIDE' : 'WALK_DOWN_AISLE';
            break;

        case 'WALK_DOWN_AISLE':
            ud.subState = 'WALK_TO_DOOR_INSIDE';
            break;

        case 'WALK_TO_DOOR_INSIDE':
            ud.timer = DOOR_ANIMATION_FRAMES;
            ud.subState = 'WAIT_FOR_DOOR';
            break;

        case 'WAIT_FOR_DOOR':
            ud.subState = 'WALK_TO_DOOR_OUTSIDE';
            break;

        case 'WALK_TO_DOOR_OUTSIDE':
            ud.subState = 'WALK_TO_DESPAWN';
            break;

        case 'WALK_TO_DESPAWN':
            despawnCustomer(customer);
            break;
    }
}

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
    const bodyGeo = new THREE.SphereGeometry(1, 32, 32);
    const body = new THREE.Mesh(bodyGeo, blackMat);
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
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 3.0, 0);
    const headGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const head = new THREE.Mesh(headGeo, blackMat);
    head.position.y = 0.2;
    headGroup.add(head);

    // Eyes and pupils
    const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const pupilGeo = new THREE.SphereGeometry(0.1, 16, 16);

    const leftEye = new THREE.Mesh(eyeGeo, whiteMat);
    leftEye.position.set(-0.3, 0.3, 0.7);
    const leftPupil = new THREE.Mesh(pupilGeo, blackMat);
    leftPupil.scale.set(1, 1, 0.2);
    leftPupil.position.set(0, 0, 0.14);
    leftEye.add(leftPupil);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, whiteMat);
    rightEye.position.set(0.3, 0.3, 0.7);
    const rightPupil = new THREE.Mesh(pupilGeo, blackMat);
    rightPupil.scale.set(1, 1, 0.2);
    rightPupil.position.set(0, 0, 0.14);
    rightEye.add(rightPupil);
    headGroup.add(rightEye);

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.2, 0.6, 16);
    const beak = new THREE.Mesh(beakGeo, orangeMat);
    beak.rotation.x = Math.PI/2;
    beak.position.set(0, 0.1, 0.9);
    headGroup.add(beak);

    penguinGroup.add(headGroup);

    // Flippers
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

    if (role === 'customer' && options.shirtColor !== undefined) {
        const shirtMat = new THREE.MeshStandardMaterial({
            color: options.shirtColor, 
            roughness: 0.7, 
            side: THREE.DoubleSide
        });

        const shirtBodyGeo = new THREE.SphereGeometry(1.02, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.9);
        const shirtBody = new THREE.Mesh(shirtBodyGeo, shirtMat);
        shirtBody.scale.set(1.3, 1.4, 1.2);
        shirtBody.position.y = 1.5;
        penguinGroup.add(shirtBody);

        const shirtBellyGeo = new THREE.SphereGeometry(0.81, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.9);
        const shirtBelly = new THREE.Mesh(shirtBellyGeo, shirtMat);
        shirtBelly.scale.set(1.2, 1.35, 0.99);
        shirtBelly.position.set(0, 1.4, 0.47);
        penguinGroup.add(shirtBelly);

        const sleeveGeo = new THREE.SphereGeometry(0.31, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const leftSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
        leftFlipper.add(leftSleeve);

        const rightSleeve = new THREE.Mesh(sleeveGeo, shirtMat);
        rightFlipper.add(rightSleeve);
    }
    else if (role === 'chef') {
        // Hat
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

        const APRON_R = 0.84;
        const APRON_CENTER = new THREE.Vector3(0, 1.4, 0.47);
        const APRON_SCALE = new THREE.Vector3(1.2, 1.35, 0.99);

        const apronMat = new THREE.MeshStandardMaterial({
            color: 0xf7f4ec,
            roughness: 0.95,
            metalness: 0.0,
            side: THREE.DoubleSide,
            flatShading: true
        });

        const apronTrimMat = new THREE.MeshStandardMaterial({
            color: 0xd8d3c6,
            roughness: 0.95,
            metalness: 0.0,
            side: THREE.DoubleSide,
            flatShading: true
        });

        const makeApronPanel = (radius, halfWidth, thetaFrom, thetaTo, material) => {
            const geo = new THREE.SphereGeometry(
                radius, 14, 8,
                Math.PI/2 - halfWidth, halfWidth * 2,
                thetaFrom, thetaTo - thetaFrom
            );
            const mesh = new THREE.Mesh(geo, material);
            mesh.scale.copy(APRON_SCALE);
            mesh.position.copy(APRON_CENTER);
            return mesh;
        };

        const apronBib = makeApronPanel(APRON_R, 0.62, 0.87, 1.62, apronMat);
        penguinGroup.add(apronBib);
        const apronSkirt = makeApronPanel(APRON_R + 0.02, 0.97, 1.58, 2.45, apronMat);
        penguinGroup.add(apronSkirt);
        const apronTopHem = makeApronPanel(APRON_R + 0.01, 0.63, 0.86, 0.93, apronTrimMat);
        penguinGroup.add(apronTopHem);
        const apronBottomHem = makeApronPanel(APRON_R + 0.03, 0.98, 2.37, 2.46, apronTrimMat);
        penguinGroup.add(apronBottomHem);

        const pocketGeo = new THREE.BoxGeometry(0.6, 0.42, 0.03);
        const pocket = new THREE.Mesh(pocketGeo, pocketMat);
        pocket.position.set(0, 1.0, 1.27);
        pocket.rotation.x = 0.36;
        penguinGroup.add(pocket);

        const pocketSeamGeo = new THREE.BoxGeometry(0.02, 0.42, 0.02);
        const pocketSeam = new THREE.Mesh(pocketSeamGeo, apronTrimMat);
        pocketSeam.position.set(0, 1.0, 1.29);
        pocketSeam.rotation.x = 0.36;
        penguinGroup.add(pocketSeam);

        // Strings around the neck
        const leftNeckCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.45, 2.13, 0.99),
            new THREE.Vector3(-0.85, 2.2, 0.9),
            new THREE.Vector3(-0.95, 2.65, 0.15),
            new THREE.Vector3(-0.55, 2.8, -0.45),
            new THREE.Vector3(-0.05, 2.75, -0.6)
        ]);
        const leftNeckStrapGeo = new THREE.TubeGeometry(leftNeckCurve, 20, 0.035, 8, false);
        const leftNeckStrap = new THREE.Mesh(leftNeckStrapGeo, whiteMat);
        penguinGroup.add(leftNeckStrap);

        const rightNeckCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.45, 2.13, 0.99), 
            new THREE.Vector3(0.85, 2.2, 0.9),   
            new THREE.Vector3(0.95, 2.65, 0.15), 
            new THREE.Vector3(0.55, 2.8, -0.45),
            new THREE.Vector3(0.05, 2.75, -0.6)  
        ]);
        const rightNeckStrapGeo = new THREE.TubeGeometry(rightNeckCurve, 20, 0.035, 8, false);
        const rightNeckStrap = new THREE.Mesh(rightNeckStrapGeo, whiteMat);
        penguinGroup.add(rightNeckStrap);

        // Neck knot
        const neckKnotGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const neckKnot = new THREE.Mesh(neckKnotGeo, whiteMat);
        neckKnot.position.set(0, 2.75, -0.65); 
        penguinGroup.add(neckKnot);

        // Strings around the waist
        const leftWaistCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.83, 1.39, 0.94),
            new THREE.Vector3(-1.1, 1.3, 1.0),
            new THREE.Vector3(-1.28, 1.3, 0.2),
            new THREE.Vector3(-1.0, 1.3, -0.8),
            new THREE.Vector3(-0.05, 1.3, -1.25)
        ]);
        const leftWaistStrapGeo = new THREE.TubeGeometry(leftWaistCurve, 20, 0.035, 8, false);
        const leftWaistStrap = new THREE.Mesh(leftWaistStrapGeo, whiteMat);
        penguinGroup.add(leftWaistStrap);

        const rightWaistCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.83, 1.39, 0.94),   
            new THREE.Vector3(1.1, 1.3, 1.0),     
            new THREE.Vector3(1.28, 1.3, 0.2),    
            new THREE.Vector3(1.0, 1.3, -0.8),    
            new THREE.Vector3(0.05, 1.3, -1.25)   
        ]);
        const rightWaistStrapGeo = new THREE.TubeGeometry(rightWaistCurve, 20, 0.035, 8, false);
        const rightWaistStrap = new THREE.Mesh(rightWaistStrapGeo, whiteMat);
        penguinGroup.add(rightWaistStrap);

        // Knot behind the back
        const knotGeo = new THREE.ConeGeometry(0.06, 0.25, 4);
        
        const waistKnot1 = new THREE.Mesh(knotGeo, whiteMat);
        waistKnot1.position.set(-0.1, 1.35, -1.25);
        waistKnot1.rotation.z = Math.PI / 4;
        waistKnot1.rotation.x = -Math.PI / 6; 
        penguinGroup.add(waistKnot1);

        const waistKnot2 = new THREE.Mesh(knotGeo, whiteMat);
        waistKnot2.position.set(0.1, 1.35, -1.25);
        waistKnot2.rotation.z = -Math.PI / 4;
        waistKnot2.rotation.x = -Math.PI / 6;
        penguinGroup.add(waistKnot2);
    }
    else if (role === 'dishwasher') {
        // Dishwasher helper outfit
        leftFlipper.material = yellowGlovesMat;
        rightFlipper.material = yellowGlovesMat;

        const bandanaGeo = new THREE.TorusGeometry(0.72, 0.07, 8, 24);
        const bandana = new THREE.Mesh(bandanaGeo, redOutfitMat);
        bandana.position.set(0, 3.65, 0);
        bandana.rotation.x = Math.PI/2;
        penguinGroup.add(bandana);

        const knotGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
        const knot1 = new THREE.Mesh(knotGeo, redOutfitMat);
        knot1.position.set(-0.1, 3.65, -0.73);
        knot1.rotation.z = Math.PI/4;
        knot1.rotation.x = -Math.PI/6;
        penguinGroup.add(knot1);

        const knot2 = new THREE.Mesh(knotGeo, redOutfitMat);
        knot2.position.set(0.1, 3.65, -0.73);
        knot2.rotation.z = -Math.PI / 4;
        knot2.rotation.x = -Math.PI / 6;
        penguinGroup.add(knot2);
    } 
    else if (role === 'waiter') {
        // Waiter outfit
        const bowtieGroup = new THREE.Group();
        const centerGeo = new THREE.SphereGeometry(0.07, 8, 8);
        const center = new THREE.Mesh(centerGeo, redOutfitMat);
        bowtieGroup.add(center);

        const wingGeo = new THREE.ConeGeometry(0.12, 0.22, 4);
        const leftWing = new THREE.Mesh(wingGeo, redOutfitMat);
        leftWing.position.x = -0.14;
        leftWing.rotation.z = -Math.PI / 2; 
        bowtieGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, redOutfitMat);
        rightWing.position.x = 0.14;
        rightWing.rotation.z = Math.PI / 2; 
        bowtieGroup.add(rightWing);

        bowtieGroup.position.set(0, 2.5, 0.98);
        penguinGroup.add(bowtieGroup);
    }

    penguinGroup.traverse(child => {
        if (child.isMesh){
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    penguinGroup.scale.set(2.2, 2.2, 2.2);
    penguinGroup.userData.head = headGroup;
    penguinGroup.userData.leftFlipper = leftFlipper;
    penguinGroup.userData.rightFlipper = rightFlipper;
    penguinGroup.userData.leftFoot = leftFoot;
    penguinGroup.userData.rightFoot = rightFoot;

    return penguinGroup;
}

export function spawnPenguin(position, role){
    let options = {};
    let nameTag = null;
    if (role === 'customer') {
        const customerColors = [
            0xff5733, 0x33ff57, 0x3357ff, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe74c3c, 0xe84393, 0x00cec9
        ];
        options.shirtColor = customerColors[Math.floor(Math.random() * customerColors.length)];

        const usedNames = penguins
            .filter(p => p.mesh && p.mesh.userData && p.mesh.userData.role === 'customer' && p.mesh.userData.nameTag)
            .map(p => p.mesh.userData.nameTag);

        const availableNames = state.penguins_name.filter(name => !usedNames.includes(name));

        if (availableNames.length > 0) {
            nameTag = availableNames[Math.floor(Math.random() * availableNames.length)];
        }
        else{
            nameTag = state.penguins_name[Math.floor(Math.random() * state.penguins_name.length)];
        }
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
        penguin.userData.hasEnteredInside = false;
        penguin.userData.nameTag = nameTag;
        const nameSprite = createNameTag(penguin.userData.nameTag);
        nameSprite.position.set(0, 4.5, 0);
        penguin.add(nameSprite);
        penguin.userData.nameSprite = nameSprite;
    }

    if (role === 'chef') {
        penguin.userData.currentOrder = null;
        penguin.userData.flipperTweenStarted = false;
    }

    if (role === 'chef' || role === 'dishwasher') penguin.rotation.y = Math.PI/2;

    if (role === 'waiter' || role === 'dishwasher' || role === "customer") {
        penguin.userData.plate = null;
    }

    if (role === 'chef') penguin.userData.speed = 0.28;
    else if (role === 'dishwasher') penguin.userData.speed = 0.28;
    else if (role === 'customer') penguin.userData.speed = CUSTOMER_SPEED;
    else penguin.userData.speed = 1.6;

    penguin.userData.hasPlate = false;

    state.scene.add(penguin);

    penguins.push({
        mesh: penguin,
        isMoving: false
    });

    console.log(`A new ${role} penguin has entered the diner!`);
    return penguin;
}

export function removeFromQueue(customer){
    const idx = waitingQueue.indexOf(customer);
    if (idx > -1){
        waitingQueue.splice(idx, 1);
    }
}

function removeBubble(customer){
    if (customer.userData.bubble){
        customer.remove(customer.userData.bubble);
        customer.userData.bubble = null;
    }
}

function despawnCustomer(customer){
    hideAngerSymbol(customer);
    removeBubble(customer);
    stopCallingWaiter(customer);

    releaseDoorLane(customer);
    removeFromQueue(customer);

    const lIdx = leavingQueue.indexOf(customer);
    if (lIdx > -1) leavingQueue.splice(lIdx, 1);

    const pIdx = penguins.findIndex(p => p.mesh === customer);
    if (pIdx > -1) penguins.splice(pIdx, 1);

    state.scene.remove(customer);
}

export function closeRestaurantForTheDay(){
    const customers = penguins
        .filter(p => p.mesh && p.mesh.userData.role === 'customer')
        .map(p => p.mesh);

    customers.forEach(customer => {
        const ud = customer.userData;

        if (ud.state === 'LEAVING') return;
        if (ud.seat) return;

        if (ud.hasEnteredInside){
            hideAngerSymbol(customer);
            removeBubble(customer);
            stopCallingWaiter(customer);
            stopReadingMenu(customer);

            ud.isInteractable = false;
            ud.subState = undefined;
            ud.state = 'LEAVING';
        }
        else{
            despawnCustomer(customer);
        }
    });
}

export function getActiveCustomerCount(){
    return penguins.filter(p => p.mesh && p.mesh.userData.role === 'customer').length;
}

let _dayWasInProgress = false;
export function updateRoutines(){
    if (_dayWasInProgress && !state.dayInProgress){
        closeRestaurantForTheDay();
    }
    _dayWasInProgress = !!state.dayInProgress;

    if (state.dayInProgress) updateCustomerSpawn();
    
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

    state.someone_is_leaving = leavingQueue.length > 0;
    watchdogDoorLane(isUsingDoor);
    updateMainDoorState();
}

function findLeftoverPlate(){
    if (!state.scene) return null;

    return state.scene.children.find(child =>
        child.userData &&
        child.userData.interactionType === 'plate' &&
        child.userData.isInteractable === true
    ) || null;
}

function shouldCleanLeftovers(){
    return !state.dayInProgress && getActiveCustomerCount() === 0;
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
    if (waitingQueue.length >= WAITING_POSITION.length) return;
    if (outsideCustomers().length >= OUTSIDE_POSITIONS.length) return;
    if (!isSpotFree(CUSTOMER_POSITIONS.SPAWN, null)) return;

    const customer = spawnPenguin(CUSTOMER_POSITIONS.SPAWN, 'customer');
    waitingQueue.push(customer);

    customer.userData.hasEnteredInside = false;
    customer.userData.positionIndex = waitingQueue.indexOf(customer);
    customer.userData.targetPosition = outsideSlotOf(customer);
    customer.userData.state = 'WALK_TO_WAITING_OUTSIDE';
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
        if (waitingQueue.length < WAITING_POSITION.length) {
            spawnCustomer();
            lastSpawnTime = currentTime;
        }
    }
}

function updateMainDoorState() {
    const customerData = penguins.find(p => p.mesh.userData.role === 'customer');
    if (!customerData) return;
    const mainDoor = getMainDoor(customerData.mesh);
    if (!mainDoor) return;

    let shouldBeOpen = penguins.some(p => {
        const mesh = p.mesh;
        if (mesh.userData.role !== 'customer') return false;
        const s = mesh.userData.state;
        
        const isEntering = (
            s === 'WAIT_FOR_DOOR_ANIMATION' || 
            s === 'WALK_INSIDE' ||
            (s === 'WALK_TO_DOOR' && mesh.position.distanceTo(CUSTOMER_POSITIONS.DOOR_OUTSIDE) < 5)
        );
        
        const sub = mesh.userData.subState;
        const isLeaving = (
            s === 'LEAVING' && (
                (sub === 'WALK_TO_DOOR_INSIDE' && mesh.position.distanceTo(CUSTOMER_POSITIONS.DOOR_WAIT_INSIDE) < 8) ||
                sub === 'WAIT_FOR_DOOR' ||
                sub === 'WALK_TO_DOOR_OUTSIDE' ||
                (sub === 'WALK_TO_DESPAWN' && mesh.position.distanceTo(CUSTOMER_POSITIONS.DOOR_OUTSIDE) < 8)
            )
        );

        return isEntering || isLeaving;
    });

    if (shouldBeOpen && !mainDoor.userData.isOpen) {
        mainDoor.userData.isOpen = true;
        state.openingDoorSound.play();
        let angleToOpen = mainDoor.userData.openAngle !== undefined ? mainDoor.userData.openAngle : -Math.PI/2; 
        const targetRotationY = mainDoor.userData.originalRotation + angleToOpen;
        animateInteractable(mainDoor, targetRotationY, mainDoor.userData.rotationAxis || 'y');
    } 
    else if (!shouldBeOpen && mainDoor.userData.isOpen) {
        mainDoor.userData.isOpen = false;
        animateInteractable(mainDoor, mainDoor.userData.originalRotation, mainDoor.userData.rotationAxis || 'y');
    }
}

function updateChefRoutine(chef){
    switch(chef.userData.state){
        case 'IDLE':
            if (state.orders.length > 0 && state.orders.some(order => order.status === 'pending')) {
                const nextOrder = state.orders.find(order => order.status === 'pending');
                if (nextOrder) {
                    nextOrder.status = 'cooking';
                    chef.userData.currentOrder = nextOrder;
                    chef.userData.state = 'WALK_FRIDGE';
                }
            }
            else if (shouldCleanLeftovers()) {
                const leftover = findLeftoverPlate();
                if (leftover) {
                    chef.userData.leftoverPlate = leftover;
                    chef.userData.state = 'WALK_TO_LEFTOVER';
                }
            }
            break;

        case 'WALK_TO_LEFTOVER': {
            const leftover = chef.userData.leftoverPlate;
            if (!leftover || leftover.parent !== state.scene) {
                chef.userData.leftoverPlate = null;
                chef.userData.state = 'WALK_IDLE';
                break;
            }

            const pickSpot = new THREE.Vector3(KITCHEN_POS.COUNTER.x, 0, leftover.position.z);
            if (moveTowards(chef, pickSpot)) {
                chef.rotation.y = Math.PI / 2;
                chef.userData.timer = 40;
                chef.userData.state = 'ACTION_TAKE_LEFTOVER';
            }
            break;
        }

        case 'ACTION_TAKE_LEFTOVER': {
            chef.userData.timer--;
            setChefPickupPose(chef);

            if (chef.userData.timer <= 0) {
                const leftover = chef.userData.leftoverPlate;

                if (leftover && leftover.parent === state.scene) {
                    releaseCounterSpot(leftover.position.z);

                    state.scene.remove(leftover);
                    leftover.userData.isInteractable = false;
                    leftover.name = 'plate';
                    pickUpPlate(chef, leftover);

                    chef.userData.state = 'WALK_TO_TRASH';
                }
                else {
                    chef.userData.leftoverPlate = null;
                    chef.userData.state = 'WALK_IDLE';
                }
            }
            break;
        }

        case 'WALK_TO_TRASH':
            if (chef.userData.hasPlate) setChefCarryPose(chef);

            if (moveTowards(chef, KITCHEN_POS.TRASH)) {
                chef.rotation.y = -Math.PI / 2;
                chef.userData.timer = 50;
                chef.userData.state = 'ACTION_TRASH';
            }
            break;

        case 'ACTION_TRASH':
            chef.userData.timer--;
            if (chef.userData.timer === 40) {
                animateChefTrashToss(chef);
            }

            if (chef.userData.timer === 22) {
                const plate = chef.userData.plate;
                if (plate) {
                    chef.remove(plate);
                    state.scene.remove(plate);
                }
                chef.userData.hasPlate = false;
                chef.userData.plate = null;
                chef.userData.leftoverPlate = null;
            }

            if (chef.userData.timer <= 0) {
                resetFlippers(chef);
                chef.userData.state = 'IDLE';
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

            animateChefFridgeReach(chef, chef.userData.timer, doorFridge, axis, origRot, openAngle);

            if (chef.userData.timer <= 0) {
                if (doorFridge) {
                    doorFridge.rotation[axis] = origRot;
                    doorFridge.userData.isOpen = false;
                }
                resetFlippers(chef);
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
            animateChefStove(chef, chef.userData.timer);

            if (chef.userData.timer <= 0) {
                chef.userData.state = 'ACTION_PICK_PLATE';
                chef.userData.timer = 50; 
            }
            break;

        case 'ACTION_PICK_PLATE':
            chef.userData.timer--;
            setChefPickupPose(chef);

            if (chef.userData.timer <= 0) {
                const newplate = createPlate(chef.userData.currentOrder.food);
                newplate.name = 'plate';
                newplate.position.set(1.5, 1.8, 1.5);
                chef.add(newplate);
                newplate.scale.set(2, 2, 2);
                chef.userData.hasPlate = true;
                chef.userData.flipperTweenStarted = false;
                const counterSpot = getFreeCounterSpot(KITCHEN_POS.COUNTER);
                chef.userData.targetCounterZ = counterSpot ? counterSpot.z : 0;
                if (!chef.userData.flipperTweenStarted){
                    chef.userData.flipperTweenStarted = true;
                    pickUpPlate(chef, newplate);
                }
                chef.userData.state = 'WALK_COUNTER';
            }
            break;

        case 'WALK_COUNTER': {
            const targetCounter = new THREE.Vector3(KITCHEN_POS.COUNTER.x, 0, chef.userData.targetCounterZ);
            const reachedCounter = moveTowards(chef, targetCounter);

            if (chef.userData.hasPlate) {
                setChefCarryPose(chef);
            }

            if (reachedCounter) {
                chef.rotation.y = Math.PI / 2;
                chef.userData.timer = 80;
                chef.userData.counterTweenStarted = false;
                chef.userData.state = 'ACTION_COUNTER';
            }
            break;
        }

        case 'ACTION_COUNTER':
            if (!chef.userData.counterTweenStarted) {
                chef.userData.counterTweenStarted = true;

                const completedOrder = chef.children.find(child => child.name === 'plate');

                const dropPosition = new THREE.Vector3(
                    COUNTER_PLATE_X,
                    KITCHEN_POS.COUNTER.y + COUNTER_PLATE_Y,
                    chef.userData.targetCounterZ
                );

                animateChefCounterRelease(chef, completedOrder, state.scene, dropPosition, () => {
                    if (!completedOrder) return;

                    completedOrder.userData.isInteractable = true;
                    completedOrder.userData.interactionType = 'plate';

                    if (chef.userData.currentOrder) {
                        chef.userData.currentOrder.status = 'ready';
                    }
                    state.foodReadySound.play();
                });

                chef.userData.hasPlate = false;
                chef.userData.plate = null;
            }

            chef.userData.timer--;
            if (chef.userData.timer <= 0) {
                chef.userData.counterTweenStarted = false;

                if (state.orders.length > 0 && state.orders.some(order => order.status === 'pending')) {
                    const nextOrder = state.orders.find(order => order.status === 'pending');
                    if (nextOrder) {
                        nextOrder.status = 'cooking';
                        chef.userData.currentOrder = nextOrder;
                        chef.userData.state = 'WALK_FRIDGE';
                    }
                }
                else {
                    chef.userData.state = 'WALK_IDLE';
                }
                chef.userData.counterTweenStarted = false;
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

//DISHWASHER ROUTINE
function updateDishwasherRoutine(dishwasher) {
    switch(dishwasher.userData.state) {
        case 'IDLE':
            let tray = null;
            state.scene.traverse((child) => {
                if (child.userData && child.userData.interactionType === 'tray') {
                    tray = child;
                }
            });

            if (tray) {
                let dirtyCount = 0;
                tray.children.forEach(c => {
                    if (c.userData && c.userData.interactionType === 'dirty_plate') {
                        dirtyCount++;
                    }
                });

                if (dirtyCount > 0) {
                    dishwasher.userData.targetTray = tray; 
                    dishwasher.userData.state = 'WALK_COUNTER';
                }
            }
            break;

        case 'WALK_COUNTER':
            if (moveTowards(dishwasher, KITCHEN_POS.COUNTER_DISHWASHER)) {
                dishwasher.rotation.y = Math.PI/2;
                dishwasher.userData.state = 'ACTION_COUNTER';
                dishwasher.userData.timer = 40;
            }
            break;

        case 'ACTION_COUNTER':
            dishwasher.userData.timer--;
            
            if (dishwasher.userData.timer <= 0) {
                const targetTray = dishwasher.userData.targetTray;
                
                const plateStack = new THREE.Group();
                plateStack.userData.interactionType = 'dirty_plate'; 
                
                const platesToWash = [];
                for (let i = targetTray.children.length - 1; i >= 0; i--) {
                    const child = targetTray.children[i];
                    if (child.userData && child.userData.interactionType === 'dirty_plate') {
                        targetTray.remove(child);
                        platesToWash.push(child);
                    }
                }
                
                if (platesToWash.length > 0) {
                    platesToWash.forEach(p => {
                        stackPlates(plateStack, p);
                    });
                    
                    pickUpPlate(dishwasher, plateStack);
                    targetTray.userData.stackCount = 0;
                    
                }

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
            
            if (dishwasher.userData.timer === 299 && dishwasher.userData.hasPlate) {

                 const stack = dishwasher.userData.plate;
                 
                 dishwasher.remove(stack);
                 state.scene.add(stack);
                 
                 stack.position.set(KITCHEN_POS.SINK.x, 4.6, KITCHEN_POS.SINK.z);
                 stack.scale.set(4, 4, 4); 
                 stack.rotation.set(0, 0, 0);
                 
                 new TWEEN.Tween(dishwasher.userData.rightFlipper.rotation)
                     .to({ x: 0, y: 0, z: Math.PI/6 }, 300)
                     .easing(TWEEN.Easing.Quadratic.In)
                     .start();
                 
                 dishwasher.userData.hasPlate = false;
                 dishwasher.userData.plate = null;
                 dishwasher.userData.washingStack = stack; 
            }
            dishwasher.rotation.y = (-Math.PI / 2) + Math.sin(dishwasher.userData.timer * 0.2) * 0.1;

            if (dishwasher.userData.timer <= 0) {
                if (dishwasher.userData.washingStack) {
                    state.scene.remove(dishwasher.userData.washingStack);
                    dishwasher.userData.washingStack = null;
                }
                
                let tray = null;
                state.scene.traverse((child) => {
                    if (child.userData && child.userData.interactionType === 'tray') {
                        tray = child;
                    }
                });

                if (tray) {
                    let dirtyCount = 0;
                    tray.children.forEach(c => {
                        if (c.userData && c.userData.interactionType === 'dirty_plate') {
                            dirtyCount++;
                        }
                    });

                    if (dirtyCount > 0){
                        console.log("Ci sono altri piatti! Vado subito a prenderli.");
                        dishwasher.userData.targetTray = tray; 
                        dishwasher.userData.state = 'WALK_COUNTER';
                    }
                    else{
                        console.log("Nessun altro piatto, torno in attesa.");
                        dishwasher.userData.state = 'WALK_IDLE'; 
                    }
                }
                else{
                    dishwasher.userData.state = 'WALK_IDLE';
                }
            }
            break;

        case 'WALK_IDLE':
            if (moveTowards(dishwasher, KITCHEN_POS.IDLE_DISHWASHER)) {
                dishwasher.rotation.y = Math.PI/2;
                dishwasher.userData.state = 'IDLE';
            }
            break;
    }
}

function updateCustomerRoutine(customer) {
    switch(customer.userData.state) {
        case 'WALK_TO_DOOR': {
            if (!acquireDoorLane(customer)) {
                customer.userData.doorWaypoints = null;
                customer.userData.state = 'WALK_TO_WAITING_OUTSIDE';
                break;
            }

            if (!customer.userData.doorWaypoints){
                if (customer.position.z > 15){
                    customer.userData.doorWaypoints = [
                        new THREE.Vector3(customer.position.x, 0, CUSTOMER_POSITIONS.DOOR_OUTSIDE.z),
                        CUSTOMER_POSITIONS.DOOR_OUTSIDE
                    ];
                }
                else{
                    customer.userData.doorWaypoints = [CUSTOMER_POSITIONS.DOOR_OUTSIDE];
                }
                customer.userData.doorWpIdx = 0;
            }

            const currentWp = customer.userData.doorWaypoints[customer.userData.doorWpIdx];

            if (moveTowards(customer, currentWp)) {
                customer.userData.doorWpIdx++;
                if (customer.userData.doorWpIdx >= customer.userData.doorWaypoints.length) {
                    customer.rotation.y = -Math.PI/2;
                    const mainDoor = getMainDoor(customer);

                    if (mainDoor && mainDoor.userData.isOpen) {
                        customer.userData.timer = 60;
                        customer.userData.state = 'WAIT_FOR_DOOR_ANIMATION';
                        customer.userData.doorWaypoints = null;
                    }
                    else{
                        customer.userData.doorWpIdx--;
                    }
                }
            }
            break;
        }

        case 'WALK_TO_WAITING_OUTSIDE': {
            if (canEnter(customer)) {
                customer.userData.doorWaypoints = null;
                customer.userData.state = 'WALK_TO_DOOR';
                break;
            }

            const outSlot = outsideSlotOf(customer) || customer.userData.targetPosition;
            customer.userData.targetPosition = outSlot;

            if (!outSlot) { stopWalking(customer); break; }

            if (customer.position.distanceTo(outSlot) <= 0.5){
                customer.position.x = outSlot.x;
                customer.position.z = outSlot.z;
                customer.rotation.y = -Math.PI/2;
                stopWalking(customer);
                customer.userData.state = 'WAITING_OUTSIDE';
                break;
            }

            if (!isSpotFree(outSlot, customer)){
                stopWalking(customer);
                break;
            }

            if (moveTowards(customer, outSlot)){
                customer.rotation.y = -Math.PI/2;
                customer.userData.state = 'WAITING_OUTSIDE';
            }
            break;
        }

        case 'WAITING_OUTSIDE': {
            if (canEnter(customer)) {
                customer.userData.doorWaypoints = null;
                customer.userData.state = 'WALK_TO_DOOR';
                break;
            }

            const newSpot = outsideSlotOf(customer);
            if (newSpot && customer.position.distanceTo(newSpot) > 0.5 && isSpotFree(newSpot, customer)){
                customer.userData.targetPosition = newSpot;
                customer.userData.state = 'WALK_TO_WAITING_OUTSIDE';
            }
            else{
                stopWalking(customer);
            }
            break;
        }

        case 'WAIT_FOR_DOOR_ANIMATION':
            customer.userData.timer--;
            if (customer.userData.timer <= 0) {
                customer.userData.state = 'WALK_INSIDE';
            }
            break;

        case 'WALK_INSIDE':
            if (moveTowards(customer, CUSTOMER_POSITIONS.DOOR_INSIDE)) {
                customer.userData.hasEnteredInside = true;
                customer.userData.state = 'ALIGN_TO_QUEUE';
            }
            break;

        case 'ALIGN_TO_QUEUE': {
            const alignPos = new THREE.Vector3(QUEUE_START_X, 0, CUSTOMER_POSITIONS.DOOR_INSIDE.z);
            if (moveTowards(customer, alignPos)) {
                customer.userData.state = 'WALK_TO_WAITING';
            }
            break;
        }

        case 'WALK_TO_WAITING': {
            let inSlot = customer.userData.pendingSlot;

            if (!inSlot){
                inSlot = insideSlotOf(customer);
                customer.userData.pendingSlot = inSlot;
            }

            if (!inSlot){
                stopWalking(customer);
                break;
            }
            customer.userData.targetPosition = inSlot;

            if (customer.position.z >= DOOR_CLEAR_Z) releaseDoorLane(customer);

            if (customer.position.distanceTo(inSlot) <= 0.5){
                customer.position.x = inSlot.x;
                customer.position.z = inSlot.z;
                customer.rotation.y = -Math.PI/2;
                stopWalking(customer);
                releaseDoorLane(customer);
                customer.userData.pendingSlot = null;
                customer.userData.state = 'WAIT_FOR_WAITER';
                break;
            }

            if (!isSpotFree(inSlot, customer)){
                stopWalking(customer);
                break;
            }

            if (moveTowards(customer, inSlot)){
                customer.rotation.y = -Math.PI/2;
                releaseDoorLane(customer);
                customer.userData.pendingSlot = null;
                customer.userData.state = 'WAIT_FOR_WAITER';
            }
            break;
        }
        
        case 'WAIT_FOR_WAITER':
            if (!customer.userData.isInteractable) {
                customer.userData.isInteractable = true;
                customer.userData.interactionType = 'customer';
                customer.userData.timer = 3600;
            }

            customer.userData.timer--;
            if (customer.userData.timer === ANGER_THRESHOLD) {
                updateBubble(customer, '!!!');
                showAngerSymbol(customer);
            }

            if (customer.userData.timer <= ANGER_THRESHOLD && (ANGER_THRESHOLD - customer.userData.timer) % 600 === 0) {
                triggerAngerFlap(customer);
            }

            if (customer.userData.timer <= 0) {
                customer.userData.isInteractable = false;
                customer.userData.leftAngry = true;
                customer.userData.state = 'LEAVING';
                break;
            }

            const assignedSpot = insideSlotOf(customer);
            if (assignedSpot && customer.position.distanceTo(assignedSpot) > 0.5 && isSpotFree(assignedSpot, customer)){
                customer.userData.targetPosition = assignedSpot;
                customer.userData.pendingSlot = assignedSpot;
                customer.userData.state = 'WALK_TO_WAITING';
            }
            else{
                stopWalking(customer);
            }
            break;

        case 'WAIT_FOR_SEAT_ASSIGNMENT':
            if (typeof stopWalking !== 'undefined') stopWalking(customer);

            customer.userData.timer--;
            if (customer.userData.timer === ANGER_THRESHOLD) {
                updateBubble(customer, '!!!');
                showAngerSymbol(customer);
            }

            if (customer.userData.timer <= ANGER_THRESHOLD && (ANGER_THRESHOLD - customer.userData.timer) % 600 === 0) {
                triggerAngerFlap(customer);
            }

            if (customer.userData.timer <= 0){
                customer.userData.isInteractable = false;
                customer.userData.state ='LEAVING';
            }
            break;
        
        case 'WALK_TO_SEAT':
            const chair = customer.userData.seat;
            if (chair) {
                if (!customer.userData.seatWaypoints) {
                    const backDir = new THREE.Vector3(0, 0, -1).applyQuaternion(chair.quaternion).normalize();
                    const sideDir = new THREE.Vector3(1, 0, 0).applyQuaternion(chair.quaternion).normalize();

                    const stepSide = chair.position.clone().add(sideDir.multiplyScalar(4)); 
                    const stepBack = stepSide.clone().add(backDir.multiplyScalar(6));       

                    const waypoints = [];

                    if (Math.abs(customer.position.x - QUEUE_START_X) < 1){
                        waypoints.push(new THREE.Vector3(QUEUE_EXIT_X, 0, customer.position.z));
                    }

                    const aisleEntryX = waypoints.length ? QUEUE_EXIT_X : customer.position.x;

                    waypoints.push(
                        new THREE.Vector3(aisleEntryX, 0, SEAT_AISLE_Z),
                        new THREE.Vector3(stepBack.x, 0, SEAT_AISLE_Z),
                        stepBack,
                        stepSide,
                        chair.position
                    );

                    customer.userData.seatWaypoints = waypoints;
                    customer.userData.currentWaypointIdx = 0;
                }

                const waypoints = customer.userData.seatWaypoints;
                const idx = customer.userData.currentWaypointIdx;

                if (idx < waypoints.length) {
                    const targetPos = waypoints[idx];
                    const isLastWaypoint = (idx === waypoints.length - 1);

                    if (isLastWaypoint){
                        const dx = targetPos.x - customer.position.x;
                        const dz = targetPos.z - customer.position.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);

                        if (dist > 0.5){
                            customer.position.x += (dx / dist) * customer.userData.speed;
                            customer.position.z += (dz / dist) * customer.userData.speed;
                            customer.rotation.y = Math.atan2(dx / dist, dz / dist);
                            startWalking(customer);
                        }
                        else{
                            customer.userData.currentWaypointIdx++;
                        }
                    }
                    else{
                        if (moveTowards(customer, targetPos)) {
                            customer.userData.currentWaypointIdx++;
                        }
                    }
                }
                else{
                    stopWalking(customer);
                    seatPenguin(customer, chair);
                    customer.userData.seatWaypoints = null;
                    customer.userData.state = 'SEATED';
                    if (customer.userData.nameSprite){
                        updateNameTagColor(customer.userData.nameSprite, customer.userData.nameTag, 'white');
                    }
                }
            }
            break;

        case 'SEATED':
            const chairOccuppied = customer.userData.seat;
            chairOccuppied.userData.isOccupied = true;
            chairOccuppied.userData.isInteractable = false;

            customer.userData.state = 'THINKING';
            customer.userData.timer = 250;
            updateBubble(customer, '...');
            startReadingMenu(customer);
            break;

        case 'THINKING':
            customer.userData.timer--;
            if (customer.userData.timer <= 0) {
                customer.userData.order = state.menu[Math.floor(Math.random() * state.menu.length)].name;
                customer.userData.isInteractable = true;
                customer.userData.timer = 3600;
                state.customerCallingSound.play();
                customer.userData.state = 'READY_TO_ORDER';
                updateBubble(customer, '!');
                stopReadingMenu(customer);
                startCallingWaiter(customer);

            }
            break;

        case 'READY_TO_ORDER':
            customer.userData.timer--;
            if (customer.userData.timer === ANGER_THRESHOLD) {
                updateBubble(customer, '!!!');
                showAngerSymbol(customer);
            }

            if (customer.userData.timer <= ANGER_THRESHOLD && (ANGER_THRESHOLD - customer.userData.timer) % 600 === 0) {
                triggerAngerFlap(customer);
            }

            if (customer.userData.timer <= 0){
                customer.userData.isInteractable = false;
                customer.userData.leftAngry = true;
                customer.userData.state = 'LEAVING';
            }
            break;

        case 'WAIT_FOR_FOOD':
            customer.userData.timer--;
            if (customer.userData.timer === ANGER_THRESHOLD) {
                updateBubble(customer, '!!!');
                showAngerSymbol(customer);
            }

            if (customer.userData.timer <= ANGER_THRESHOLD && (ANGER_THRESHOLD - customer.userData.timer) % 600 === 0) {
                triggerAngerFlap(customer);
            }
            
            if (customer.userData.timer <= 0){
                customer.userData.isInteractable = false;
                customer.userData.leftAngry = true;
                if (customer.userData.bubble) {
                    customer.remove(customer.userData.bubble);
                    customer.userData.bubble = null;
                }
                customer.userData.state = 'LEAVING';
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
                    plate.userData.isInteractable = true;
                    plate.userData.interactionType = 'dirty_plate';
                }

                stopEating(customer);
                customer.userData.timer = 20;
                customer.userData.state = 'FINISH_EATING';
            }
            break;
        
        case 'FINISH_EATING':
            customer.userData.timer--;
            if (customer.userData.timer <= 0){
                const foodOrder = customer.userData.order;
                const orderIndex = state.menu.findIndex(food => food.name === foodOrder);
                const price = state.menu[orderIndex].price;
                state.earnings += price;
                state.todaysOrders.push({ food: foodOrder, price: price });
                customer.userData.state = 'LEAVING';
                window.dispatchEvent(new Event('earningsUpdated'));
            } 
            break;

        case 'LEAVING': {
            if (customer.userData.subState === undefined) {
                removeFromQueue(customer);
                customer.userData.pendingSlot = null;
                if (!leavingQueue.includes(customer)) leavingQueue.push(customer);

                if (Array.isArray(state.orders)){
                    state.orders = state.orders.filter(o => o.customer !== customer);
                }

                customer.userData.speed = customer.userData.leftAngry ? CUSTOMER_ANGRY_SPEED : CUSTOMER_SPEED;
                const chair = customer.userData.seat;
                if (chair){
                    const sideDir = new THREE.Vector3(1, 0, 0).applyQuaternion(chair.quaternion).normalize();
                    const backDir = new THREE.Vector3(0, 0, -1).applyQuaternion(chair.quaternion).normalize();

                    const stepSide = customer.position.clone().add(sideDir.multiplyScalar(4));
                    const stepBack = stepSide.clone().add(backDir.multiplyScalar(6));

                    customer.userData.leaveWaypoints = [stepSide, stepBack];
                    customer.userData.leaveWpIdx = 0;
                    customer.userData.leaveWaypoints[0].y = 0;
                    customer.userData.exitFromQueue = false;
                    customer.userData.subState = 'BACK_AWAY_FROM_TABLE';
                }
                else{
                    customer.userData.leaveWaypoints = null;
                    customer.userData.exitFromQueue = true;
                    customer.userData.subState = 'AWAIT_DOOR_LANE';
                }

                if (typeof TWEEN !== 'undefined'){
                    new TWEEN.Tween(customer.position).to({ y: 0 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
                    new TWEEN.Tween(customer.userData.leftFoot.rotation).to({ x: 0 }, 200).start();
                    new TWEEN.Tween(customer.userData.rightFoot.rotation).to({ x: 0 }, 200).start();
                }
                else{
                    customer.userData.leftFoot.rotation.x = 0;
                    customer.userData.rightFoot.rotation.x = 0;
                }
            }

            updateLeaveStallWatch(customer);

            if (customer.userData.subState === 'BACK_AWAY_FROM_TABLE'){
                const currentTarget = customer.userData.leaveWaypoints[customer.userData.leaveWpIdx];

                if (moveTowards(customer, currentTarget)) {
                    customer.userData.leaveWpIdx++;

                    if (customer.userData.leaveWpIdx >= customer.userData.leaveWaypoints.length) {
                        if (customer.userData.seat) {
                            customer.userData.seat.userData.isOccupied = false;
                            customer.userData.seat.userData.isInteractable = true;
                            customer.userData.seat = null;
                        }
                        customer.userData.subState = 'AWAIT_DOOR_LANE';
                    }
                }
            }
            else if (customer.userData.subState === 'LEAVE_QUEUE_SIDESTEP'){
                const lanePos = new THREE.Vector3(QUEUE_EXIT_X, 0, customer.position.z);

                if (customer.position.x <= QUEUE_EXIT_X + 0.5 || moveTowards(customer, lanePos, false, true)){
                    customer.userData.subState = 'WALK_TO_AISLE';
                }
            }
            else if (customer.userData.subState === 'AWAIT_DOOR_LANE'){
                stopWalking(customer);
                if (canExit(customer)){
                    customer.userData.subState = customer.userData.exitFromQueue
                        ? 'LEAVE_QUEUE_SIDESTEP'
                        : 'WALK_TO_AISLE';
                }
            }
            else if (customer.userData.subState === 'WALK_TO_AISLE') {
                if (customer.userData.exitFromQueue){
                    const laneEnd = new THREE.Vector3(QUEUE_EXIT_X, 0, AISLE_Z);
                    if (moveTowards(customer, laneEnd, false, true)) {
                        customer.userData.subState = 'WALK_TO_DOOR_INSIDE';
                    }
                }
                else{
                    const aisleX = Math.min(customer.position.x, QUEUE_EXIT_X);
                    const aislePos = new THREE.Vector3(aisleX, 0, AISLE_Z);
                    if (moveTowards(customer, aislePos)) {
                        customer.userData.subState = 'WALK_DOWN_AISLE';
                    }
                }
            }
            else if (customer.userData.subState === 'WALK_DOWN_AISLE') {
                const doorAislePos = new THREE.Vector3(CUSTOMER_POSITIONS.DOOR_INSIDE_LEAVE.x, 0, CUSTOMER_POSITIONS.DOOR_INSIDE_LEAVE.z);
                if (moveTowards(customer, doorAislePos)) {
                    customer.userData.subState = 'WALK_TO_DOOR_INSIDE';
                }
            }
            else if (customer.userData.subState === 'WALK_TO_DOOR_INSIDE') {
                if (moveTowards(customer, CUSTOMER_POSITIONS.DOOR_WAIT_INSIDE)){
                    customer.userData.timer = DOOR_ANIMATION_FRAMES;
                    customer.userData.subState = 'WAIT_FOR_DOOR';
                }
            }
            else if (customer.userData.subState === 'WAIT_FOR_DOOR') {
                stopWalking(customer);

                const mainDoor = getMainDoor(customer);

                if (!mainDoor || !mainDoor.userData.isOpen) {
                    customer.userData.timer = DOOR_ANIMATION_FRAMES;
                }
                else {
                    customer.userData.timer--;
                    if (customer.userData.timer <= 0) {
                        customer.userData.subState = 'WALK_TO_DOOR_OUTSIDE';
                    }
                }
            }
            else if (customer.userData.subState === 'WALK_TO_DOOR_OUTSIDE') {
                if (moveTowards(customer, CUSTOMER_POSITIONS.DOOR_OUTSIDE)) {
                    customer.userData.subState = 'WALK_TO_DESPAWN';
                }
            }
            else if (customer.userData.subState === 'WALK_TO_DESPAWN'){
                if (moveTowards(customer, CUSTOMER_POSITIONS.DESPAWN)){
                    despawnCustomer(customer);
                }
            }
            break;
        }
    }
}