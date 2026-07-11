import { state } from './state.js';

export function loadEnvironment(scene, icebergsArray){
    const waterGeometry = new THREE.PlaneGeometry(500, 500);
    const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI/2;
    water.position.y = -2;
    water.frustumCulled = false; // Ensure the water is always rendered
    water.receiveShadow = true;
    scene.add(water);

    createDock(scene);
    createIcebergs(scene, icebergsArray, 20);
}

export const DOCK = {
    minX: 80.25, 
    maxX: 140,
    minZ: 0,
    maxZ: 32,
    topY: 0
};

export function isOnDock(x, z, margin = 0){
    return x > DOCK.minX - margin && x < DOCK.maxX + margin && z > DOCK.minZ - margin && z < DOCK.maxZ + margin;
}

export function resolveDockCollision(iceberg){
    const mesh = iceberg.mesh;
    if (!mesh) return false;

    const r = iceberg.radius ?? 0;
    const minX = DOCK.minX - r;
    const maxX = DOCK.maxX + r;
    const minZ = DOCK.minZ - r;
    const maxZ = DOCK.maxZ + r;

    const x = mesh.position.x;
    const z = mesh.position.z;

    if (x < minX || x > maxX || z < minZ || z > maxZ) return false;

    const distLeft = x - minX;
    const distRight = maxX - x;
    const distSouth = z - minZ;
    const distNorth = maxZ - z;

    const smallest = Math.min(distLeft, distRight, distSouth, distNorth);

    if (smallest === distLeft){
        mesh.position.x = minX;
        if (iceberg.driftX > 0) iceberg.driftX = -iceberg.driftX;
    }
    else if (smallest === distRight){
        mesh.position.x = maxX;
        if (iceberg.driftX < 0) iceberg.driftX = -iceberg.driftX;
    }
    else if (smallest === distSouth){
        mesh.position.z = minZ;
        if (iceberg.driftZ > 0) iceberg.driftZ = -iceberg.driftZ;
    }
    else {
        mesh.position.z = maxZ;
        if (iceberg.driftZ < 0) iceberg.driftZ = -iceberg.driftZ;
    }

    return true;
}

function createDock(scene){
    const width = DOCK.maxX - DOCK.minX;
    const depth = DOCK.maxZ - DOCK.minZ;
    const centerX = (DOCK.minX + DOCK.maxX)/2;
    const centerZ = (DOCK.minZ + DOCK.maxZ)/2;

    const dock = new THREE.Group();
    dock.name = 'iceDock';

    const snowMaterial = new THREE.MeshStandardMaterial({
        color: 0xeef6fb,
        roughness: 0.85,
        metalness: 0.0,
        flatShading: true
    });

    const iceMaterial = new THREE.MeshStandardMaterial({
        color: 0xd6f0f5,
        roughness: 0.25,
        metalness: 0.05,
        flatShading: true,
        transparent: true,
        opacity: 0.95
    });

    const deck = new THREE.Mesh(new THREE.BoxGeometry(width, 1.2, depth), snowMaterial);
    deck.position.set(centerX, -0.6, centerZ);
    deck.receiveShadow = true;
    deck.castShadow = true;
    dock.add(deck);

    const body = new THREE.Mesh(new THREE.BoxGeometry(width - 2.5, 5, depth - 2.5), iceMaterial);
    body.position.set(centerX, -3.7, centerZ);
    body.receiveShadow = true;
    dock.add(body);

    const keel = new THREE.Mesh(new THREE.BoxGeometry(width - 14, 5, depth - 12), iceMaterial);
    keel.position.set(centerX, -8, centerZ);
    dock.add(keel);

    const chunkPositions = [];
    for (let x = DOCK.minX + 6; x < DOCK.maxX; x += 7){
        chunkPositions.push({ x, z: DOCK.minZ + 1.5 });
        chunkPositions.push({ x, z: DOCK.maxZ - 1.5 });
    }
    for (let z = DOCK.minZ + 6; z < DOCK.maxZ - 4; z += 7){
        chunkPositions.push({ x: DOCK.maxX - 1.5, z });
    }

    chunkPositions.forEach((p, i) => {
        const size = 1.2 + ((i * 37) % 10) / 10 * 1.6;
        const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), iceMaterial);
        chunk.position.set(p.x + (((i * 53) % 7) / 7 - 0.5) * 2, -0.3 + (((i * 29) % 5) / 5) * 0.8,p.z + (((i * 71) % 7) / 7 - 0.5) * 2);
        chunk.rotation.set(((i * 17) % 10) / 10 * Math.PI, ((i * 23) % 10) / 10 * Math.PI,((i * 31) % 10) / 10 * Math.PI);
        chunk.scale.y = 0.6;
        chunk.castShadow = true;
        chunk.receiveShadow = true;
        dock.add(chunk);
    });

    scene.add(dock);
    return dock;
}

function createIcebergs(scene, icebergsArray, count) {
    const material = new THREE.MeshStandardMaterial({
        color: 0xe0ffff, // light cyan color for ice
        roughness: 0.2,
        metalness: 0.1,
        flatShading: true,
        transparent: true,
        opacity: 0.95
    });

    for (let i = 0; i < count; i++) {
        const geometry = new THREE.DodecahedronGeometry(5, 1);
        const pos = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        const displacementMap = {};

        // Random deformation
        for (let v = 0; v < pos.count; v++){
            vertex.fromBufferAttribute(pos, v);
            vertex.normalize();
            const key = Math.round(vertex.x*100) + '_' + Math.round(vertex.y*100) + '_' + Math.round(vertex.z*100);

            let deform;
            if (displacementMap[key]){
                deform = displacementMap[key];
            }
            else{
                deform = {
                    radius: 4 + Math.random() * 3,
                    heightStretch: 1 + (Math.random() * 1.5)
                };
                displacementMap[key] = deform;
            }

            vertex.multiplyScalar(deform.radius);

            if (vertex.y > 0){
                vertex.y *= deform.heightStretch;
            }
            else{
                vertex.y *= 0.5;
            }

            pos.setXYZ(v, vertex.x, vertex.y, vertex.z);
        }

        geometry.computeVertexNormals();
        const iceberg = new THREE.Mesh(geometry, material);
        iceberg.castShadow = true;
        iceberg.receiveShadow = true;

        const scale = 1 + Math.random()*2;
        iceberg.scale.set(scale, scale, scale);

        const collisionRadius = 10*scale;
        const minDistance = 110;
        const maxDistance = 250;

        let px = 0;
        let pz = 0;

        for (let attempt = 0; attempt < 60; attempt++){
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);

            px = Math.cos(angle) * distance;
            pz = Math.sin(angle) * distance;

            if (!isOnDock(px, pz, collisionRadius)) break;
        }

        iceberg.position.set(px, -2, pz);
        scene.add(iceberg);

        const isMoving = Math.random() > 0.5;
        const speed = isMoving ? (Math.random() * 0.04 + 0.01) : 0;
        const moveAngle = Math.random() * Math.PI * 2;

        icebergsArray.push({
            mesh: iceberg,
            initialY: -2,
            bobSpeed: 0.01 + Math.random()*0.02,
            bobOffset: Math.random()*Math.PI*2,
            driftX: isMoving ? Math.cos(moveAngle)*speed : 0,
            driftZ: isMoving ? Math.sin(moveAngle)*speed : 0,
            radius: collisionRadius
        });
    }
}

const STARS_COUNT = 500;
const SHADOW_EXTENT = 150;

export function createSkyAndLights(scene, options = {}){
    const orbitCenterX = options.orbitCenterX ?? 0;
    const roomHeight = options.roomHeight ?? 30;

    state.sunOrbitCenterX = orbitCenterX;

    createAmbientLights(scene, roomHeight);
    createStars(scene);
    createSun(scene, orbitCenterX);
    createMoon(scene, orbitCenterX);
}

function createAmbientLights(scene, roomHeight){
    const ambientLight = new THREE.AmbientLight(0xd0e3f0, 0.4);
    scene.add(ambientLight);
    state.ambientLight = ambientLight;

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222222, 0.35);
    hemiLight.position.set(0, roomHeight, 0);
    scene.add(hemiLight);
    state.hemiLight = hemiLight;
}

function createStars(scene){
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(STARS_COUNT * 3);

    for (let i = 0; i < STARS_COUNT * 3; i += 3) {
        const theta = Math.random() * Math.PI;
        const phi = Math.random() * Math.PI * 2;
        const radius = 700 + Math.random() * 100;

        starPositions[i] = radius * Math.sin(theta) * Math.cos(phi);
        starPositions[i + 1] = Math.abs(radius * Math.cos(theta)) + 50;
        starPositions[i + 2] = radius * Math.sin(theta) * Math.sin(phi);
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2.5,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.0
    });

    state.starsMesh = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(state.starsMesh);
}

function setupShadowCamera(light, mapSize){
    light.castShadow = true;

    light.shadow.camera.left = -SHADOW_EXTENT;
    light.shadow.camera.right = SHADOW_EXTENT;
    light.shadow.camera.top = SHADOW_EXTENT;
    light.shadow.camera.bottom = -SHADOW_EXTENT;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 1500;

    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
}

function createSun(scene, orbitCenterX){
    const sunLight = new THREE.DirectionalLight(0xff7700, 0);
    sunLight.position.set(orbitCenterX, -50, 0);
    sunLight.target.position.set(orbitCenterX, 0, 0);
    scene.add(sunLight.target);

    setupShadowCamera(sunLight, 4096);

    scene.add(sunLight);
    state.sunLight = sunLight;

    const sunGeometry = new THREE.SphereGeometry(45, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2ba });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    sunMesh.position.copy(sunLight.position);
    scene.add(sunMesh);
    state.sunMesh = sunMesh;
}

function createMoon(scene, orbitCenterX){
    const moonLight = new THREE.DirectionalLight(0xaac8ff, 0);
    moonLight.position.set(orbitCenterX, -50, 0);
    moonLight.target.position.set(orbitCenterX, 0, 0);
    scene.add(moonLight.target);

    setupShadowCamera(moonLight, 2048);

    scene.add(moonLight);
    state.moonLight = moonLight;

    const moonGeometry = new THREE.SphereGeometry(28, 24, 24);
    const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xdfe8ff });
    const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.copy(moonLight.position);
    scene.add(moonMesh);
    state.moonMesh = moonMesh;
}