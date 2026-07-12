import {state} from './state.js';

export function createBubbleTexture(textOrFood) {
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
    }
    else{
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
    else if (foodName === 'cheese' && state.models.cheese){
        plateGroup.userData.foodName = 'cheese';
        foodModel = state.models.cheese;
    }
    else if (foodName === 'cupcake' && state.models.cupcake){
        plateGroup.userData.foodName = 'cupcake';
        foodModel = state.models.cupcake;
    }
    else if (foodName === 'meat' && state.models.meat){
        plateGroup.userData.foodName = 'meat';
        foodModel = state.models.meat;
    }
    else if (foodName === 'turkey' && state.models.turkey){
        plateGroup.userData.foodName = 'turkey';
        foodModel = state.models.turkey;
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

    plateGroup.traverse(child => {
        if (child.isMesh){
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return plateGroup;
}

const COUNTER_Z_MIN = -12;
const COUNTER_Z_MAX = 20;
const TRAY_Z = -18;
const TRAY_SAFE_DISTANCE = 5;
const PLATE_SAFE_DISTANCE = 2.5;

function isCounterSpotFree(z){
    if (z < COUNTER_Z_MIN || z > COUNTER_Z_MAX) return false;
    if (Math.abs(z - TRAY_Z) < TRAY_SAFE_DISTANCE) return false;

    for (const plateZ of state.platesOnCounter){
        if (Math.abs(z - plateZ) < PLATE_SAFE_DISTANCE) return false;
    }
    return true;
}

export function getFreeCounterSpot(basePosition) {
    for (let attempts = 0; attempts < 60; attempts++){
        const freeZ = Math.random()*(COUNTER_Z_MAX - COUNTER_Z_MIN) + COUNTER_Z_MIN;

        if (isCounterSpotFree(freeZ)){
            state.platesOnCounter.push(freeZ);
            return new THREE.Vector3(basePosition.x, basePosition.y, freeZ);
        }
    }
    return null;
}

export function getCounterSpotNear(basePosition, preferredZ) {
    const startZ = Math.min(Math.max(preferredZ, COUNTER_Z_MIN), COUNTER_Z_MAX);

    if (isCounterSpotFree(startZ)){
        state.platesOnCounter.push(startZ);
        return new THREE.Vector3(basePosition.x, basePosition.y, startZ);
    }

    const STEP = 0.5;
    const MAX_OFFSET = COUNTER_Z_MAX - COUNTER_Z_MIN;

    for (let offset = STEP; offset <= MAX_OFFSET; offset += STEP){
        for (const z of [startZ - offset, startZ + offset]){
            if (isCounterSpotFree(z)){
                state.platesOnCounter.push(z);
                return new THREE.Vector3(basePosition.x, basePosition.y, z);
            }
        }
    }
    return null;
}

export function releaseCounterSpot(z){
    const idx = state.platesOnCounter.findIndex(spotZ => Math.abs(spotZ - z) < 0.01);
    if (idx > -1) state.platesOnCounter.splice(idx, 1);
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
        
    }
    else{
        newPlate.scale.set(1, 1, 1);
        
        const plateThickness = 0.03; 
        const altezza = (baseObject.userData.stackCount + 1) * plateThickness;
        newPlate.position.set(0, altezza, 0);
    }
    
    baseObject.userData.stackCount++;
}