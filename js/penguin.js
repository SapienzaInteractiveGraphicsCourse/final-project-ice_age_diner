//Array that will keep track of all the penguins
const penguins = []

//Creates the model of a penguin
function createPenguinModel(){
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

function spawnPenguin(x, y, z){
    const penguin = createPenguinModel();
    penguin.position.set(x, y, z);

    scene.add(penguin);

    penguins.push({
        mesh: penguin,
        isMoving: false
    });

    console.log("A new penguin has entered the diner!");
    return penguin;
}

function startWalking(penguin){
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

function stopWalking(penguin) {
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