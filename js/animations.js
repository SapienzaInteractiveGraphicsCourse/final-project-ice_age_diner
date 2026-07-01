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

        penguin.userData.tweens.push(leftFlipFwd, rightFlipBwd);
    }

    penguin.userData.tweens.forEach(tween => tween.start());
}

export function stopWalking(penguin) {
    if (!penguin.userData.isWalking) return;
    penguin.userData.isWalking = false;

    if (penguin.userData.tweens){
        penguin.userData.tweens.forEach(tween => tween.stop());
    }

    new TWEEN.Tween(penguin.userData.leftFoot.rotation).to({ x: 0 }, 200).start();
    new TWEEN.Tween(penguin.userData.rightFoot.rotation).to({ x: 0 }, 200).start();

    if (!penguin.userData.hasPlate){
        // Return flippers to resting position (x swing back to 0, z stays as set in model)
        new TWEEN.Tween(penguin.userData.leftFlipper.rotation).to({ x: 0 }, 200).start();
        new TWEEN.Tween(penguin.userData.rightFlipper.rotation).to({ x: 0 }, 200).start();
    }
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

    if (typeof TWEEN !== 'undefined') {
        new TWEEN.Tween(penguin.position).to({y:3},400).easing(TWEEN.Easing.Quadratic.Out).start();
        new TWEEN.Tween(penguin.userData.leftFoot.rotation).to({x: -Math.PI/2.5}, 400).easing(TWEEN.Easing.Quadratic.Out).start();
        new TWEEN.Tween(penguin.userData.rightFoot.rotation).to({x: -Math.PI/2.5}, 400).easing(TWEEN.Easing.Quadratic.Out).start();
    }else{
        penguin.position.y = 3;
        penguin.userData.leftFoot.rotation.x = -Math.PI/2.5;
        penguin.userData.rightFoot.rotation.x = -Math.PI/2.5;
    }
}

function createBubbleTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; 
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(64, 64, 55, 0, Math.PI*2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
}

export function updateBubble(customer, text) {
    if (!customer.userData.bubble) {
        const material = new THREE.SpriteMaterial({ map: createBubbleTexture(text) });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(0, 6, 0); // above the penguin's head
        sprite.scale.set(3, 3, 3);    
        customer.add(sprite);
        customer.userData.bubble = sprite;
    } else {
        // if the bubble already exists, update its texture
        customer.userData.bubble.material.map.dispose(); 
        customer.userData.bubble.material.map = createBubbleTexture(text);
    }
}

export function createPlate(foodName){
    const plateGroup = new THREE.Group();

    if (state.models.plate) {
        const plateClone = state.models.plate.clone();
        plateGroup.add(plateClone);
    }

    let foodModel = null;
    if (foodName === 'hamburger' && state.models.hamburger){
        foodModel = state.models.hamburger;
    }else if (foodName === 'pizza' && state.models.pizza){
        foodModel = state.models.pizza;
    }else if (foodName === 'hotdog' && state.models.hotdog){
        foodModel = state.models.hotdog;
    }else if (foodName === 'taco' && state.models.taco){
        foodModel = state.models.taco;
    }else if (foodName === 'fish' && state.models.fish){
        foodModel = state.models.fish;
    }
    if (foodModel){
        const foodClone = foodModel.clone();
        foodClone.position.y = 0.02;
        plateGroup.add(foodClone);
    }else{
        console.warn(`Food model for "${foodName}" not found.`);
    }

    plateGroup.userData.isInteractable = false;
    plateGroup.userData.interactionType = 'plate';
    plateGroup.scale.set(4,4,4);
    return plateGroup;
}

export function updateTweens(){
    if (typeof TWEEN !== 'undefined') {
        TWEEN.update();
    }
}