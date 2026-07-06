export function loadEnvironment(scene, icebergsArray){
    const waterGeometry = new THREE.PlaneGeometry(500, 500);
    const waterMaterial = new THREE.MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI/2;
    water.position.y = -2;
    water.frustumCulled = false; // Ensure the water is always rendered
    water.receiveShadow = true;
    scene.add(water);

    createIcebergs(scene, icebergsArray, 20);
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

        // Circular spwan
        const angle = Math.random() * Math.PI * 2;
        const minDistance = 110;
        const maxDistance = 250;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);

        iceberg.position.set(
            Math.cos(angle) * distance,
            -2,
            Math.sin(angle) * distance
        );

        const scale = 1 + Math.random()*2;
        iceberg.scale.set(scale, scale, scale);
        scene.add(iceberg);

        const isMoving = Math.random() > 0.5;
        const speed = isMoving ? (Math.random() * 0.04 + 0.01) : 0;
        const moveAngle = Math.random() * Math.PI * 2;
        const collisionRadius = 10*scale;

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