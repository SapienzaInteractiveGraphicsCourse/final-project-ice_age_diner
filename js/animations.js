import { moveTowards } from "./penguin.js";
import { state } from './state.js';

export function startWalking(penguin){
    if (penguin.userData.isWalking) return;
    penguin.userData.isWalking = true;

    const duration = 250;
    const swingAngle = Math.PI/5;

    const leftFoot = penguin.userData.leftFoot;
    const rightFoot = penguin.userData.rightFoot;

    // Feet animation
    const leftFootFwd = new TWEEN.Tween(leftFoot.rotation).to({ x: swingAngle }, duration).easing(TWEEN.Easing.Quadratic.InOut);
    const leftFootBwd = new TWEEN.Tween(leftFoot.rotation).to({ x: -swingAngle }, duration).easing(TWEEN.Easing.Quadratic.InOut);
    const rightFootBwd = new TWEEN.Tween(rightFoot.rotation).to({ x: -swingAngle }, duration).easing(TWEEN.Easing.Quadratic.InOut);
    const rightFootFwd = new TWEEN.Tween(rightFoot.rotation).to({ x: swingAngle }, duration).easing(TWEEN.Easing.Quadratic.InOut);

    leftFootFwd.chain(leftFootBwd); leftFootBwd.chain(leftFootFwd);
    rightFootBwd.chain(rightFootFwd); rightFootFwd.chain(rightFootBwd);
    penguin.userData.tweens = [leftFootFwd, rightFootBwd];

    // Flipper animation: small front/back swing (not a shoulder dislocation!)
    // Flippers swing forward and back alternately with the feet, in sync with walking rhythm.
    penguin.userData.flipperTweens = null;
    if (!penguin.userData.hasPlate){
        const leftFlipper = penguin.userData.leftFlipper;
        const rightFlipper = penguin.userData.rightFlipper;

        // Swing forward (+x) and back (-x) — natural arm-swing axis
        // Keep z-rotation (outward angle) constant; only rotate on x to simulate walking swing
        const swingX = Math.PI/10; // small ±18° swing forward/back

        const leftFlipFwd  = new TWEEN.Tween(leftFlipper.rotation).to({ x:  swingX }, duration).easing(TWEEN.Easing.Quadratic.InOut);
        const leftFlipBwd  = new TWEEN.Tween(leftFlipper.rotation).to({ x: -swingX }, duration).easing(TWEEN.Easing.Quadratic.InOut);
        const rightFlipBwd = new TWEEN.Tween(rightFlipper.rotation).to({ x: -swingX }, duration).easing(TWEEN.Easing.Quadratic.InOut);
        const rightFlipFwd = new TWEEN.Tween(rightFlipper.rotation).to({ x:  swingX }, duration).easing(TWEEN.Easing.Quadratic.InOut);

        // Left goes forward while right goes back, then swap — opposite phase like real arms
        leftFlipFwd.chain(leftFlipBwd);
        leftFlipBwd.chain(leftFlipFwd);
        rightFlipBwd.chain(rightFlipFwd);
        rightFlipFwd.chain(rightFlipBwd);

        penguin.userData.flipperTweens = [leftFlipFwd, rightFlipBwd];
    }

    penguin.userData.tweens.forEach(tween => tween.start());
    if (penguin.userData.flipperTweens){
        penguin.userData.flipperTweens.forEach(tween => tween.start());
    }
}

export function stopWalking(penguin) {
    if (!penguin.userData.isWalking) return;
    penguin.userData.isWalking = false;

    if (penguin.userData.tweens){
        penguin.userData.tweens.forEach(tween => tween.stop());
    }
    if (penguin.userData.flipperTweens){
        penguin.userData.flipperTweens.forEach(tween => tween.stop());
        penguin.userData.flipperTweens = null;
    }

    new TWEEN.Tween(penguin.userData.leftFoot.rotation).to({ x: 0 }, 200).easing(TWEEN.Easing.Quadratic.Out).start();
    new TWEEN.Tween(penguin.userData.rightFoot.rotation).to({ x: 0 }, 200).easing(TWEEN.Easing.Quadratic.Out).start();

    if (!penguin.userData.hasPlate){
        // Return flippers to resting position (x swing back to 0, z stays as set in model)
        new TWEEN.Tween(penguin.userData.leftFlipper.rotation).to({ x: 0 }, 200).easing(TWEEN.Easing.Quadratic.Out).start();
        new TWEEN.Tween(penguin.userData.rightFlipper.rotation).to({ x: 0 }, 200).easing(TWEEN.Easing.Quadratic.Out).start();
    }
}

export function startReadingMenu(penguin){
    if (penguin.userData.isReadingMenu) return;
    penguin.userData.isReadingMenu = true;

    const leftFlipper = penguin.userData.leftFlipper;
    const rightFlipper = penguin.userData.rightFlipper;
    const head = penguin.userData.head;

    new TWEEN.Tween(leftFlipper.rotation)
        .to({ x: -Math.PI/2.3, y: 0, z: -Math.PI/10 }, 400)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    new TWEEN.Tween(rightFlipper.rotation)
        .to({ x: -Math.PI/2.3, y: 0, z: Math.PI/10 }, 400)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    // Small held downward tilt of the head only, like looking down at a page
    if (head){
        new TWEEN.Tween(head.rotation)
            .to({ x: 0.35 }, 400)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }
}

export function stopReadingMenu(penguin){
    if (!penguin.userData.isReadingMenu) return;
    penguin.userData.isReadingMenu = false;

    const head = penguin.userData.head;
    if (head){
        new TWEEN.Tween(head.rotation).to({ x: 0 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
    }

    const leftFlipper = penguin.userData.leftFlipper;
    const rightFlipper = penguin.userData.rightFlipper;
    new TWEEN.Tween(leftFlipper.rotation).to({ x: 0, y: 0, z: -Math.PI/6 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
    new TWEEN.Tween(rightFlipper.rotation).to({ x: 0, y: 0, z: Math.PI/6 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
}

export function startCallingWaiter(penguin){
    if (penguin.userData.isCallingWaiter) return;
    penguin.userData.isCallingWaiter = true;

    const rightFlipper = penguin.userData.rightFlipper;

    new TWEEN.Tween(rightFlipper.rotation)
        .to({ x: -Math.PI/1.15, y: 0, z: Math.PI/4 }, 400)
        .easing(TWEEN.Easing.Back.Out)
        .onComplete(() => {
            if (!penguin.userData.isCallingWaiter) return;

            const waveOut = new TWEEN.Tween(rightFlipper.rotation).to({ z: Math.PI/2.5 }, 350).easing(TWEEN.Easing.Quadratic.InOut);
            const waveIn = new TWEEN.Tween(rightFlipper.rotation).to({ z: Math.PI/4 }, 350).easing(TWEEN.Easing.Quadratic.InOut);
            waveOut.chain(waveIn);
            waveIn.chain(waveOut);
            penguin.userData.callWaiterTween = waveOut;
            waveOut.start();
        })
        .start();
}

export function stopCallingWaiter(penguin){
    if (!penguin.userData.isCallingWaiter) return;
    penguin.userData.isCallingWaiter = false;

    if (penguin.userData.callWaiterTween){
        penguin.userData.callWaiterTween.stop();
        penguin.userData.callWaiterTween = null;
    }

    const rightFlipper = penguin.userData.rightFlipper;
    new TWEEN.Tween(rightFlipper.rotation).to({ x: 0, y: 0, z: Math.PI/6 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
}

function applyForwardPitch(penguin, angle){
    const yaw = penguin.userData.leanYaw !== undefined ? penguin.userData.leanYaw : penguin.rotation.y;
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle);
    penguin.quaternion.copy(qYaw).multiply(qPitch);
}


export function startEating(penguin){
    if (penguin.userData.isEating) return;
    penguin.userData.isEating = true;

    penguin.userData.leanYaw = penguin.rotation.y;
    penguin.userData.leanState = { angle: 0 };

    new TWEEN.Tween(penguin.userData.leanState)
        .to({ angle: 0.3 }, 350)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => applyForwardPitch(penguin, penguin.userData.leanState.angle))
        .start();

    const leftFlipper = penguin.userData.leftFlipper;
    const rightFlipper = penguin.userData.rightFlipper;

    const biteUpLeft = new TWEEN.Tween(leftFlipper.rotation).to({ x: -Math.PI/2, z: -Math.PI/3 }, 280).easing(TWEEN.Easing.Quadratic.Out);
    const biteDownLeft = new TWEEN.Tween(leftFlipper.rotation).to({ x: 0, z: -Math.PI/6 }, 280).easing(TWEEN.Easing.Quadratic.In).delay(250);
    biteUpLeft.chain(biteDownLeft);
    biteDownLeft.chain(biteUpLeft);

    const biteUpRight = new TWEEN.Tween(rightFlipper.rotation).to({ x: -Math.PI/2, z: Math.PI/3 }, 280).easing(TWEEN.Easing.Quadratic.Out);
    const biteDownRight = new TWEEN.Tween(rightFlipper.rotation).to({ x: 0, z: Math.PI/6 }, 280).easing(TWEEN.Easing.Quadratic.In).delay(250);
    biteUpRight.chain(biteDownRight);
    biteDownRight.chain(biteUpRight);

    penguin.userData.eatingTweens = [biteUpLeft, biteUpRight];
    biteUpLeft.start();
    biteUpRight.start();
}

export function stopEating(penguin){
    if (!penguin.userData.isEating) return;
    penguin.userData.isEating = false;

    if (penguin.userData.eatingTweens){
        penguin.userData.eatingTweens.forEach(tween => tween.stop());
        penguin.userData.eatingTweens = null;
    }

    const leftFlipper = penguin.userData.leftFlipper;
    const rightFlipper = penguin.userData.rightFlipper;
    new TWEEN.Tween(leftFlipper.rotation).to({ x: 0, y: 0, z: -Math.PI/6 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();
    new TWEEN.Tween(rightFlipper.rotation).to({ x: 0, y: 0, z: Math.PI/6 }, 300).easing(TWEEN.Easing.Quadratic.Out).start();

    if (penguin.userData.leanState){
        new TWEEN.Tween(penguin.userData.leanState)
            .to({ angle: 0 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => applyForwardPitch(penguin, penguin.userData.leanState.angle))
            .onComplete(() => {
                penguin.userData.leanYaw = undefined;
                penguin.userData.leanState = null;
            })
            .start();
    }
}

// Anime-style red "anger vein" symbol shown above the penguin's head
export function showAngerSymbol(penguin){
    if (penguin.userData.angerSymbol) return;

    const texture = new THREE.TextureLoader().load('textures/angry.png');
    const material = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true, 
        depthTest: false 
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.set(1.2, 3.5, 0.0); 
    sprite.scale.set(0.5, 0.5, 0.5);
    
    penguin.add(sprite);
    penguin.userData.angerSymbol = sprite;

    const pulseUp = new TWEEN.Tween(sprite.scale)
        .to({ x: 1.8, y: 1.8, z: 1.8 }, 280)
        .easing(TWEEN.Easing.Quadratic.InOut);
        
    const pulseDown = new TWEEN.Tween(sprite.scale)
        .to({ x: 1.5, y: 1.5, z: 1.5 }, 280)
        .easing(TWEEN.Easing.Quadratic.InOut);
        
    pulseUp.chain(pulseDown);
    pulseDown.chain(pulseUp);
    
    penguin.userData.angerPulseTween = pulseUp;
    pulseUp.start();
}

export function hideAngerSymbol(penguin){
    if (!penguin.userData.angerSymbol) return;

    if (penguin.userData.angerPulseTween){
        penguin.userData.angerPulseTween.stop();
        penguin.userData.angerPulseTween = null;
    }

    penguin.remove(penguin.userData.angerSymbol);
    penguin.userData.angerSymbol.material.map.dispose();
    penguin.userData.angerSymbol.material.dispose();
    penguin.userData.angerSymbol = null;
}

export function animateInteractable(target, targetAngle, axis = 'y') {
    const duration = 1500;
    const currentRotation = { angle: target.rotation[axis] };

    new TWEEN.Tween(currentRotation)
        .to({ angle: targetAngle }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
            target.rotation[axis] = currentRotation.angle;
        })
        .start();
}

let waterTime = 0;
export function animateIcebergs(icebergsArray) {
    waterTime += 1;

    const minDistance = 110; // Inner limit
    const maxDistance = 250; // Outer limit

    for (let i = 0; i < icebergsArray.length; i++) {
        let data = icebergsArray[i];
        let icebergMesh = data.mesh;

        // Floating
        icebergMesh.position.y = data.initialY + Math.sin((waterTime*data.bobSpeed) + data.bobOffset)*1.5;

        if (data.driftX === 0 && data.driftZ === 0) continue;

        // Apply movement to the current position
        icebergMesh.position.x += data.driftX;
        icebergMesh.position.z += data.driftZ;

        // Calculate euclidean distance between the iceberg and the scene
        const x = icebergMesh.position.x;
        const z = icebergMesh.position.z;
        const distFromCenter = Math.sqrt(x*x + z*z);

        // Calculate the dot product to see if the iceberg is moving towards the center or is moving away
        const normX = x/distFromCenter;
        const normZ = z/distFromCenter;
        const dotProduct = (data.driftX*normX) + (data.driftZ*normZ);

        // Bouncing logic
        // Hits the inner limit and is going towards the scene
        if (distFromCenter < minDistance && dotProduct < 0){
            data.driftX -= 2*dotProduct*normX;
            data.driftZ -= 2*dotProduct*normZ;
        }
        // Hits the outer limit and is going away
        else if (distFromCenter > maxDistance && dotProduct > 0){
            data.driftX -= 2*dotProduct*normX;
            data.driftZ -= 2*dotProduct*normZ;
        }

        for (let i=0; i<icebergsArray.length; i++){
            for (let j=i+1; j<icebergsArray.length; j++){
                let a = icebergsArray[i];
                let b = icebergsArray[j];

                if ((a.driftX === 0 && a.driftZ === 0) && (b.driftX === 0 && b.driftZ === 0)) continue;

                const dx = b.mesh.position.x - a.mesh.position.x;
                const dz = b.mesh.position.z - a.mesh.position.z;
                const distance = Math.sqrt(dx*dx + dz*dz);

                const collisionDist = a.radius+b.radius;
                if (distance < collisionDist){
                    const nx = dx/distance;
                    const nz = dz/distance;

                    const relVelX = a.driftX-b.driftX;
                    const relVelZ = a.driftZ-b.driftZ;
                    const normalSpeed = (relVelX*nx)+(relVelZ*nz);
                    if (normalSpeed > 0){
                        a.driftX -= normalSpeed*nx;
                        a.driftZ -= normalSpeed*nz;
                        b.driftX += normalSpeed*nx;
                        b.driftZ += normalSpeed*nz;
                    }
                }
            }
        }
    }
}

export function seatPenguin(penguin, chair){

    penguin.rotation.y = chair.rotation.y;
    const localOffset = new THREE.Vector3(1.5, 0, 0); 
    localOffset.applyQuaternion(chair.quaternion);
    const targetX = chair.position.x + localOffset.x;
    const targetZ = chair.position.z + localOffset.z;

    if (typeof TWEEN !== 'undefined') {
        new TWEEN.Tween(penguin.position).to({ x: targetX, y: 3, z: targetZ }, 400).easing(TWEEN.Easing.Quadratic.Out).start();
        new TWEEN.Tween(penguin.userData.leftFoot.rotation).to({x: -Math.PI/2.5}, 400).easing(TWEEN.Easing.Quadratic.Out).start();
        new TWEEN.Tween(penguin.userData.rightFoot.rotation).to({x: -Math.PI/2.5}, 400).easing(TWEEN.Easing.Quadratic.Out).start();
    }
    else{
        penguin.position.set(targetX, 3, targetZ);
        penguin.userData.leftFoot.rotation.x = -Math.PI/2.5;
        penguin.userData.rightFoot.rotation.x = -Math.PI/2.5;
    }
}

function createBubbleTexture(textOrFood) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(64, 64, 55, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = '#0ea5e9'; 
    ctx.lineWidth = 3;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    
    if (state.foodIcons && state.foodIcons[textOrFood]) {
        const img = new Image();
        img.src = state.foodIcons[textOrFood]; 
        
        img.onload = () => {
            const iconSize = 80; 
            ctx.drawImage(img, 64 - iconSize/2, 64 - iconSize/2, iconSize, iconSize);
            
            texture.needsUpdate = true;
        };
    } else {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textOrFood || "", 64, 64);
    }
    
    return texture;
}

export function updateBubble(customer, text) {
    if (customer.userData.bubble && customer.userData.bubbleCurrentText === text) {
        return; 
    }
    
    customer.userData.bubbleCurrentText = text;

    if (!customer.userData.bubble){
        const material = new THREE.SpriteMaterial({ 
            map: createBubbleTexture(text),
            transparent: true,
            depthTest: true,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(0, 6, 0); 
        sprite.scale.set(3, 3, 3);    
        customer.add(sprite);
        customer.userData.bubble = sprite;
    }
    else {
        customer.userData.bubble.material.map.dispose(); 
        customer.userData.bubble.material.map = createBubbleTexture(text);
        
        customer.userData.bubble.material.needsUpdate = true; 
    }
}

export function createNameTag(name) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    context.font = 'bold 36px "Segoe UI", sans-serif';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.strokeStyle = 'black';
    context.lineWidth = 4;
    context.strokeText(name, 128, 32);
    context.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false }); 
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3.5, 0.8, 1);
    
    return sprite;
}

export function createPlate(foodName){
    const plateGroup = new THREE.Group();
    plateGroup.name = 'heldPlate';
    plateGroup.userData.foodName = foodName;

    if (state.models.plate){
        const plateClone = state.models.plate.clone();
        plateGroup.add(plateClone);
    }

    let foodModel = null;
    if (foodName === 'hamburger' && state.models.hamburger){
        plateGroup.userData.foodName = 'hamburger';
        foodModel = state.models.hamburger;
    }
    else if (foodName === 'pizza' && state.models.pizza){
        plateGroup.userData.foodName = 'pizza';
        foodModel = state.models.pizza;
    }
    else if (foodName === 'hotdog' && state.models.hotdog){
        plateGroup.userData.foodName = 'hotdog';
        foodModel = state.models.hotdog;
    }
    else if (foodName === 'taco' && state.models.taco){
        plateGroup.userData.foodName = 'taco';
        foodModel = state.models.taco;
    }
    else if (foodName === 'fish' && state.models.fish){
        plateGroup.userData.foodName = 'fish';
        foodModel = state.models.fish;
    }
    if (foodModel){
        const foodClone = foodModel.clone();
        foodClone.position.y = 0.02;
        plateGroup.add(foodClone);
    }
    else{
        console.warn(`Food model for "${foodName}" not found.`);
    }

    plateGroup.userData.isInteractable = false;
    plateGroup.userData.interactionType = 'plate';
    plateGroup.scale.set(2,2,2);
    return plateGroup;
}

export function getFreeCounterSpot(basePosition) {
    // Define counter limits on z axis
    const COUNTER_Z_MIN = -5; 
    const COUNTER_Z_MAX = 20;
    const TRAY_Z = -18;          
    const SAFE_DISTANCE = 2.5; 

    let freeZ = 0;
    let isOccupied = true;
    let attempts = 0;
    
    while (isOccupied && attempts < 50) {
        freeZ = Math.random()*(COUNTER_Z_MAX - COUNTER_Z_MIN) + COUNTER_Z_MIN;
        
        isOccupied = false;

        if (Math.abs(freeZ - TRAY_Z) < SAFE_DISTANCE) {
            isOccupied = true;
        }
        
        for (let plateZ of state.platesOnCounter) {
            if (Math.abs(freeZ - plateZ) < SAFE_DISTANCE) {
                isOccupied = true;
                break;
            }
        }
        attempts++;
    }
    
    if (!isOccupied) {
        state.platesOnCounter.push(freeZ);
    }
    
    return new THREE.Vector3(basePosition.x, basePosition.y, freeZ);
}

//Waiter <-> plate interaction
export function pickUpPlate(penguin, plateGroup){
    if (penguin.userData.flipperTweens){
        penguin.userData.flipperTweens.forEach(tween => tween.stop());
        penguin.userData.flipperTweens = null;
    }
    
    plateGroup.scale.set(2, 2, 2);
    penguin.add(plateGroup);

    if (penguin.userData.role === 'chef'){
        plateGroup.position.set(1.5, 2.4, 1.5);
        new TWEEN.Tween(penguin.userData.rightFlipper.rotation)
            .to({ x: Math.PI/2, y: Math.PI/2, z: Math.PI/4 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }
    else {
        plateGroup.position.set(2.0, 1.8, 0.5);
        new TWEEN.Tween(penguin.userData.rightFlipper.rotation)
            .to({ x: -Math.PI/2.2, y: 0, z: Math.PI/8 }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
    }
    
    new TWEEN.Tween(penguin.userData.leftFlipper.rotation)
        .to({ x: 0 }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    penguin.userData.hasPlate = true;
    penguin.userData.plate = plateGroup;
}

// Delivers the plate the waiter is holding to a customer's table and eases
// the right flipper back down to its resting pose
export function putDownPlate(waiter, scene, customer){
    const plate = waiter.userData.plate;
    if (!plate) return null;

    waiter.remove(plate);
    scene.add(plate);

    plate.scale.set(5, 5, 5);
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), customer.rotation.y);
    plate.position.set(customer.position.x + (forward.x*6), 5.5, customer.position.z + (forward.z*6));
    plate.rotation.set(0, 0, 0);

    new TWEEN.Tween(waiter.userData.rightFlipper.rotation)
        .to({ x: 0, y: 0, z: Math.PI/6 }, 300)
        .easing(TWEEN.Easing.Quadratic.In)
        .start();

    waiter.userData.hasPlate = false;
    waiter.userData.plate = null;

    return plate;
}

export function stackPlates(baseObject, newPlate) {
    if (baseObject.userData.stackCount === undefined) {
        baseObject.userData.stackCount = 0; 
    }
    
    baseObject.add(newPlate);
    newPlate.rotation.set(0, (Math.random() - 0.5) * 0.5, 0);
    
    if (baseObject.userData.interactionType === 'tray') {
        
        const worldScale = new THREE.Vector3();
        baseObject.getWorldScale(worldScale);
        
        newPlate.scale.set(4 / worldScale.x, 4 / worldScale.y, 4 / worldScale.z);
        
        const trayBaseY_World = 0.7; 
        const trayThickness_World = 0.2; 
        
        const localBaseY = trayBaseY_World / worldScale.y;
        const localThickness = trayThickness_World / worldScale.y;
        
        newPlate.position.set(0, localBaseY + (baseObject.userData.stackCount * localThickness), 0);
        
    } else {
        
        newPlate.scale.set(1, 1, 1);
        
        const plateThickness = 0.03; 
        const altezza = (baseObject.userData.stackCount + 1) * plateThickness;
        newPlate.position.set(0, altezza, 0);
    }
    
    baseObject.userData.stackCount++;
}

// Chef animations helpers
export function resetFlippers(penguin){
    penguin.userData.leftFlipper.rotation.set(0, 0, -Math.PI/6);
    penguin.userData.rightFlipper.rotation.set(0, 0, Math.PI/6);
}

// Per-frame flipper/door pose while the chef reaches into the fridge
export function animateChefFridgeReach(chef, timer, doorFridge, axis, origRot, openAngle){
    if (timer > 60){
        chef.userData.rightFlipper.rotation.set(-Math.PI/2.5, Math.PI/6, 0);
        if (doorFridge){
            const progress = (80 - timer) / 20;
            doorFridge.rotation[axis] = origRot + (openAngle * progress);
            doorFridge.userData.isOpen = true;
        }
    }
    else if (timer > 20){
        chef.userData.leftFlipper.rotation.x = -Math.PI/4 + Math.sin(timer * 0.4) * 0.1;
        chef.userData.rightFlipper.rotation.x = -Math.PI/3 + Math.cos(timer * 0.4) * 0.1;
        if (doorFridge){
            doorFridge.rotation[axis] = origRot + openAngle;
        }
    }
    else if (timer > 0){
        chef.userData.rightFlipper.rotation.set(-Math.PI/4, -Math.PI/12, 0);
        chef.userData.leftFlipper.rotation.set(0, 0, -Math.PI/6);
        if (doorFridge){
            const progress = timer / 20;
            doorFridge.rotation[axis] = origRot + (openAngle * progress);
        }
    }
}

// Per-frame flipper wiggle while the chef is cooking at the stove
export function animateChefStove(chef, timer){
    chef.userData.leftFlipper.rotation.set(-Math.PI/2.2, 0, -Math.PI/12 + Math.sin(timer * 0.2) * 0.15);
    chef.userData.rightFlipper.rotation.set(-Math.PI/2.2, 0, Math.PI/12 + Math.cos(timer * 0.2) * 0.15);
}

// Instant pose used while the chef is grabbing the finished plate
export function setChefPickupPose(chef){
    chef.userData.leftFlipper.rotation.set(-Math.PI/4, 0, -Math.PI/12);
    chef.userData.rightFlipper.rotation.set(-Math.PI/4, 0, Math.PI/12);
}

// Instant pose used while the chef is carrying a plate to the counter
export function setChefCarryPose(chef){
    //chef.userData.leftFlipper.rotation.set(-Math.PI/2.5, 0, -Math.PI/16);
    chef.userData.rightFlipper.rotation.set(0, 0, Math.PI/2);
}

// One-shot tween sequence for setting the plate down on the counter and
// bringing the flippers back to rest
export function animateChefCounterRelease(chef){
    //const finalReleaseAngle = -Math.PI/2.5 + (Math.PI/4);
    const finalReleaseAngle = -0.3;

    new TWEEN.Tween(chef.userData.leftFlipper.rotation)
        .to({ x: finalReleaseAngle, y: 0, z: -Math.PI/16 }, 400)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    new TWEEN.Tween(chef.userData.rightFlipper.rotation)
        .to({ x: finalReleaseAngle, y: 0, z: Math.PI/16 }, 400)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    new TWEEN.Tween(chef.userData.leftFlipper.rotation)
        .to({ x: 0, y: 0, z: -Math.PI/6 }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(660)
        .start();

    new TWEEN.Tween(chef.userData.rightFlipper.rotation)
        .to({ x: 0, y: 0, z: Math.PI/6 }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(660)
        .start();
}

export function shakeHead(penguin, onComplete) {
    const head = penguin.userData.head;
    if (!head || penguin.userData.isShakingHead) return;

    penguin.userData.isShakingHead = true;

    const duration = 120; 
    const angle = Math.PI / 6; 

    const lookLeft = new TWEEN.Tween(head.rotation).to({ y: angle }, duration).easing(TWEEN.Easing.Quadratic.InOut);
    const lookRight = new TWEEN.Tween(head.rotation).to({ y: -angle }, duration).easing(TWEEN.Easing.Quadratic.InOut);
    const lookLeftAgain = new TWEEN.Tween(head.rotation).to({ y: angle }, duration).easing(TWEEN.Easing.Quadratic.InOut);
    const lookCenter = new TWEEN.Tween(head.rotation).to({ y: 0 }, duration).easing(TWEEN.Easing.Quadratic.InOut);

    lookLeft.chain(lookRight);
    lookRight.chain(lookLeftAgain);
    lookLeftAgain.chain(lookCenter);

    lookCenter.onComplete(() => {
        penguin.userData.isShakingHead = false;
        if (onComplete) onComplete();
    });

    lookLeft.start();
}

export function updateTweens(){
    if (typeof TWEEN !== 'undefined') {
        TWEEN.update();
    }
}