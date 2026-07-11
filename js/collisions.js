import { state } from './state.js';
import { startWalking, stopWalking } from './animations.js';

let getAgents = () => [];
let _doorPoints = [];

export function configureCollisions({ agentsProvider, doorPoints } = {}){
    if (typeof agentsProvider === 'function') getAgents = agentsProvider;
    if (Array.isArray(doorPoints)) _doorPoints = doorPoints;
}

const NAV_CELL_SIZE = 2.5;
const NAV_MARGIN = 20;
const NAV_AGENT_RADIUS = 2.2;
const NAV_PENGUIN_RADIUS = 4.0;
const NAV_MAX_OBSTACLE_HEIGHT = 4;
const DOOR_CLEARANCE_RADIUS = 12;

let _navGrid = null;
let _navColliderCount = -1;

function _computeNavBounds(){
    const box = new THREE.Box3();
    let any = false;

    if (state.colliders){
        for (const obj of state.colliders){
            if (!obj) continue;
            const b = new THREE.Box3().setFromObject(obj);
            if (b.isEmpty()) continue;
            box.union(b);
            any = true;
        }
    }

    if (!any){
        return { minX: -100, maxX: 140, minZ: -45, maxZ: 45 };
    }

    return {
        minX: box.min.x - NAV_MARGIN,
        maxX: box.max.x + NAV_MARGIN,
        minZ: box.min.z - NAV_MARGIN,
        maxZ: box.max.z + NAV_MARGIN
    };
}

function _buildNavGrid(){
    const bounds = _computeNavBounds();
    const cellSize = NAV_CELL_SIZE;
    const cols = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / cellSize));
    const rows = Math.max(1, Math.ceil((bounds.maxZ - bounds.minZ) / cellSize));
    const blocked = new Uint8Array(cols * rows);

    const rawBoxes = [];
    if (state.colliders){
        for (const obj of state.colliders){
            if (!obj) continue;
            if (obj.userData && obj.userData.isOpen !== undefined) continue;

            const box = new THREE.Box3().setFromObject(obj);
            if (box.isEmpty()) continue;
            if (box.min.y > NAV_MAX_OBSTACLE_HEIGHT) continue;

            rawBoxes.push(box);
        }
    }

    for (let r = 0; r < rows; r++){
        const wz = bounds.minZ + (r + 0.5) * cellSize;
        for (let c = 0; c < cols; c++){
            const wx = bounds.minX + (c + 0.5) * cellSize;
            let isBlocked = false;

            for (const box of rawBoxes){
                if (
                    wx >= box.min.x - NAV_AGENT_RADIUS && wx <= box.max.x + NAV_AGENT_RADIUS &&
                    wz >= box.min.z - NAV_AGENT_RADIUS && wz <= box.max.z + NAV_AGENT_RADIUS
                ){
                    isBlocked = true;
                    break;
                }
            }

            blocked[r * cols + c] = isBlocked ? 1 : 0;
        }
    }

    _navGrid = { cols, rows, bounds, cellSize, blocked, rawBoxes };
    _navColliderCount = state.colliders ? state.colliders.length : 0;
}

function _ensureNavGrid(){
    const count = state.colliders ? state.colliders.length : 0;
    if (!_navGrid || _navColliderCount !== count){
        _buildNavGrid();
    }
    return _navGrid;
}

function _worldToCell(grid, x, z){
    let c = Math.floor((x - grid.bounds.minX) / grid.cellSize);
    let r = Math.floor((z - grid.bounds.minZ) / grid.cellSize);
    c = Math.min(Math.max(c, 0), grid.cols - 1);
    r = Math.min(Math.max(r, 0), grid.rows - 1);
    return { c, r };
}

function _cellToWorld(grid, c, r){
    return new THREE.Vector3(
        grid.bounds.minX + (c + 0.5) * grid.cellSize,
        0,
        grid.bounds.minZ + (r + 0.5) * grid.cellSize
    );
}

function _isCellBlocked(grid, c, r){
    return grid.blocked[r * grid.cols + c] === 1;
}

function _findNearestFreeCell(grid, cell){
    if (!_isCellBlocked(grid, cell.c, cell.r)) return cell;

    const maxRadius = Math.max(grid.cols, grid.rows);
    for (let radius = 1; radius < maxRadius; radius++){
        for (let dr = -radius; dr <= radius; dr++){
            for (let dc = -radius; dc <= radius; dc++){
                if (Math.max(Math.abs(dr), Math.abs(dc)) !== radius) continue;
                const c = cell.c + dc;
                const r = cell.r + dr;
                if (c < 0 || c >= grid.cols || r < 0 || r >= grid.rows) continue;
                if (!_isCellBlocked(grid, c, r)) return { c, r };
            }
        }
    }
    return cell;
}

function _heuristic(a, b){
    const dx = Math.abs(a.c - b.c);
    const dz = Math.abs(a.r - b.r);
    return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz);
}

function _getNeighbors(grid, cell){
    const dirs = [
        { dc: 1, dr: 0, cost: 1 }, { dc: -1, dr: 0, cost: 1 },
        { dc: 0, dr: 1, cost: 1 }, { dc: 0, dr: -1, cost: 1 },
        { dc: 1, dr: 1, cost: Math.SQRT2 }, { dc: 1, dr: -1, cost: Math.SQRT2 },
        { dc: -1, dr: 1, cost: Math.SQRT2 }, { dc: -1, dr: -1, cost: Math.SQRT2 }
    ];

    const result = [];
    for (const d of dirs){
        const c = cell.c + d.dc;
        const r = cell.r + d.dr;
        if (c < 0 || c >= grid.cols || r < 0 || r >= grid.rows) continue;
        if (_isCellBlocked(grid, c, r)) continue;

        if (d.dc !== 0 && d.dr !== 0){
            if (_isCellBlocked(grid, c, cell.r) || _isCellBlocked(grid, cell.c, r)) continue;
        }

        result.push({ c, r, cost: d.cost });
    }
    return result;
}

function _aStar(grid, start, end){
    const startKey = start.r * grid.cols + start.c;
    const endKey = end.r * grid.cols + end.c;
    if (startKey === endKey) return [{ c: start.c, r: start.r }];

    const open = new Map();
    const cameFrom = new Map();
    const gScore = new Map();

    gScore.set(startKey, 0);
    open.set(startKey, { c: start.c, r: start.r, f: _heuristic(start, end) });

    const closed = new Set();

    let iterations = 0;
    const maxIterations = grid.cols * grid.rows;

    while (open.size > 0 && iterations < maxIterations){
        iterations++;

        let currentKey = null;
        let current = null;
        for (const [key, node] of open){
            if (current === null || node.f < current.f){
                current = node;
                currentKey = key;
            }
        }
        open.delete(currentKey);

        if (currentKey === endKey){
            const path = [{ c: current.c, r: current.r }];
            let k = currentKey;
            while (cameFrom.has(k)){
                k = cameFrom.get(k);
                path.unshift({ c: k % grid.cols, r: Math.floor(k / grid.cols) });
            }
            return path;
        }

        closed.add(currentKey);

        for (const n of _getNeighbors(grid, current)){
            const nKey = n.r * grid.cols + n.c;
            if (closed.has(nKey)) continue;

            const tentativeG = gScore.get(currentKey) + n.cost;
            if (tentativeG < (gScore.get(nKey) ?? Infinity)){
                cameFrom.set(nKey, currentKey);
                gScore.set(nKey, tentativeG);
                open.set(nKey, { c: n.c, r: n.r, f: tentativeG + _heuristic(n, end) });
            }
        }
    }
    return null;
}

function _isSegmentClear(a, b, rawBoxes, radius){
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(dist / (NAV_CELL_SIZE * 0.5)));

    for (let i = 0; i <= steps; i++){
        const t = i / steps;
        const x = a.x + (b.x - a.x) * t;
        const z = a.z + (b.z - a.z) * t;

        for (const box of rawBoxes){
            if (x >= box.min.x - radius && x <= box.max.x + radius && z >= box.min.z - radius && z <= box.max.z + radius) return false;
        }
    }
    return true;
}

function _simplifyPath(points, rawBoxes, radius){
    if (points.length <= 2) return points.slice(1);

    const result = [points[0]];
    let current = 0;

    while (current < points.length - 1){
        let farthest = current + 1;
        for (let j = points.length - 1; j > current + 1; j--){
            if (_isSegmentClear(points[current], points[j], rawBoxes, radius)){
                farthest = j;
                break;
            }
        }
        result.push(points[farthest]);
        current = farthest;
    }

    return result.slice(1);
}

function _findPath(startPos, endPos){
    const grid = _ensureNavGrid();

    let startCell = _worldToCell(grid, startPos.x, startPos.z);
    let endCell = _worldToCell(grid, endPos.x, endPos.z);

    startCell = _findNearestFreeCell(grid, startCell);
    endCell = _findNearestFreeCell(grid, endCell);

    const rawCells = _aStar(grid, startCell, endCell);
    if (!rawCells || rawCells.length === 0){
        return [endPos.clone()];
    }

    const rawPoints = rawCells.map(cell => _cellToWorld(grid, cell.c, cell.r));
    rawPoints[0] = startPos.clone();
    rawPoints[rawPoints.length - 1] = endPos.clone();

    return _simplifyPath(rawPoints, grid.rawBoxes, NAV_AGENT_RADIUS);
}

function _isStaticBlocked(x, z, radius = NAV_AGENT_RADIUS){
    const grid = _ensureNavGrid();
    for (const box of grid.rawBoxes){
        if (x >= box.min.x - radius && x <= box.max.x + radius && z >= box.min.z - radius && z <= box.max.z + radius) return true;
    }
    return false;
}

function _isNearDoor(pos){
    return _doorPoints.some(p => pos.distanceTo(p) < DOOR_CLEARANCE_RADIUS);
}

function _getDynamicObstacles(excludeEntity, radius = NAV_PENGUIN_RADIUS){
    return getAgents()
        .map(p => p.mesh)
        .filter(mesh => mesh && mesh !== excludeEntity)
        .map(mesh => ({ position: mesh.position, radius }));
}

function _steerAroundDynamic(entity, desiredDir, obstacles, distToTarget = Infinity){
    const lookAhead = 7;
    const pushStrength = 1.6;
    const avoidance = new THREE.Vector3();

    for (const obs of obstacles){
        const toObs = new THREE.Vector3(
            obs.position.x - entity.position.x,
            0,
            obs.position.z - entity.position.z
        );
        const dist = toObs.length();
        if (dist <= 0.0001 || dist >= lookAhead) continue;

        if (dist > distToTarget + NAV_AGENT_RADIUS) continue;

        const dot = toObs.clone().normalize().dot(desiredDir);
        if (dot <= -0.3) continue;

        const safeDist = obs.radius + NAV_AGENT_RADIUS;
        const strength = Math.max(0, (safeDist + 2 - dist) / (safeDist + 2));
        avoidance.add(toObs.normalize().multiplyScalar(-strength));
    }

    if (avoidance.lengthSq() === 0) return desiredDir.clone();

    const blended = desiredDir.clone().add(avoidance.multiplyScalar(pushStrength));
    if (blended.lengthSq() === 0) return desiredDir.clone();
    return blended.normalize();
}

function _moveTowardsStraight(penguin, targetPos, ignoreCollision){
    const dx = targetPos.x - penguin.position.x;
    const dz = targetPos.z - penguin.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5){
        penguin.position.x = targetPos.x;
        penguin.position.z = targetPos.z;
        if (typeof stopWalking !== 'undefined') stopWalking(penguin);
        return true;
    }

    const desiredDir = new THREE.Vector3(dx, 0, dz).normalize();

    let moveDir = desiredDir;
    if (!ignoreCollision){
        const dynamicObstacles = _getDynamicObstacles(penguin);
        moveDir = _steerAroundDynamic(penguin, desiredDir, dynamicObstacles, dist);
    }

    const speed = penguin.userData.speed ?? 0.25;
    penguin.position.x += moveDir.x * speed;
    penguin.position.z += moveDir.z * speed;
    penguin.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    if (typeof startWalking !== 'undefined') startWalking(penguin);

    return false;
}

function _moveTowardsDirect(penguin, targetPos, ignoreCollision){
    const dx = targetPos.x - penguin.position.x;
    const dz = targetPos.z - penguin.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.5){
        const dirX = dx / distance;
        const dirZ = dz / distance;

        const nextX = penguin.position.x + dirX * penguin.userData.speed;
        const nextZ = penguin.position.z + dirZ * penguin.userData.speed;

        let isColliding = false;

        if (!ignoreCollision){
            const waiterData = getAgents().find(p => p.mesh && p.mesh.userData.role === 'waiter');
            if (waiterData && penguin.userData.role !== 'waiter') {
                const waiter = waiterData.mesh;
                const distToWaiter = Math.sqrt(Math.pow(nextX - waiter.position.x, 2) + Math.pow(nextZ - waiter.position.z, 2));
                if (distToWaiter < 4.5) {
                    isColliding = true;
                }
            }
        }

        if (isColliding){
            if(typeof stopWalking !== 'undefined') stopWalking(penguin);
            return false;
        }

        penguin.position.x = nextX;
        penguin.position.z = nextZ;
        penguin.rotation.y = Math.atan2(dirX, dirZ);
        if(typeof startWalking !== 'undefined') startWalking(penguin);

        return false;
    }
    else{
        if(typeof stopWalking !== 'undefined') stopWalking(penguin);
        return true;
    }
}

export function moveTowards(penguin, targetPos, ignoreCollision=false, ignoreStaticObstacles=false){
    if (!penguin) return;

    const nearDoor = _isNearDoor(penguin.position) || _isNearDoor(targetPos);
    const skipStatic = ignoreStaticObstacles || nearDoor;

    try {
        if (skipStatic){
            penguin.userData.__nav = null;
            return _moveTowardsStraight(penguin, targetPos, ignoreCollision);
        }

        let nav = penguin.userData.__nav;
        const targetMoved = !nav || nav.target.distanceTo(targetPos) > 0.75;

        if (targetMoved || !nav.path || nav.path.length === 0){
            nav = {
                target: targetPos.clone(),
                path: _findPath(penguin.position, targetPos),
                wpIndex: 0,
                replanCooldown: 0
            };
            penguin.userData.__nav = nav;
        }

        let waypoint = nav.path[nav.wpIndex];
        if (!waypoint){
            penguin.userData.__nav = null;
            if (typeof stopWalking !== 'undefined') stopWalking(penguin);
            return true;
        }

        let dx = waypoint.x - penguin.position.x;
        let dz = waypoint.z - penguin.position.z;
        let dist = Math.sqrt(dx*dx + dz*dz);
        if (dist < 0.5){
            nav.wpIndex++;

            if (nav.wpIndex >= nav.path.length){
                penguin.position.x = targetPos.x;
                penguin.position.z = targetPos.z;
                penguin.userData.__nav = null;
                if (typeof stopWalking !== 'undefined') stopWalking(penguin);
                return true;
            }

            waypoint = nav.path[nav.wpIndex];
            dx = waypoint.x - penguin.position.x;
            dz = waypoint.z - penguin.position.z;
            dist = Math.sqrt(dx * dx + dz * dz);
        }

        const desiredDir = new THREE.Vector3(dx, 0, dz);
        if (desiredDir.lengthSq() > 0) desiredDir.normalize();

        const distToTarget = penguin.position.distanceTo(targetPos);

        let moveDir = desiredDir;
        if (!ignoreCollision){
            const dynamicObstacles = _getDynamicObstacles(penguin);
            moveDir = _steerAroundDynamic(penguin, desiredDir, dynamicObstacles, distToTarget);
        }

        const speed = penguin.userData.speed ?? 0.25;
        const nearFinalTarget = distToTarget < 3;
        const startEmbedded = _isStaticBlocked(penguin.position.x, penguin.position.z, NAV_AGENT_RADIUS);

        const checkRadius = (nearFinalTarget || startEmbedded) ? 0 : NAV_AGENT_RADIUS;

        const nextX = penguin.position.x + moveDir.x * speed;
        const nextZ = penguin.position.z + moveDir.z * speed;

        let finalX = null;
        let finalZ = null;

        if (startEmbedded || !_isStaticBlocked(nextX, nextZ, checkRadius)){
            finalX = nextX;
            finalZ = nextZ;
        }
        else{
            const slideX = penguin.position.x + moveDir.x * speed;
            if (Math.abs(moveDir.x) > 0.001 && !_isStaticBlocked(slideX, penguin.position.z, checkRadius)){
                finalX = slideX;
                finalZ = penguin.position.z;
            }
            else{
                const slideZ = penguin.position.z + moveDir.z * speed;
                if (Math.abs(moveDir.z) > 0.001 && !_isStaticBlocked(penguin.position.x, slideZ, checkRadius)){
                    finalX = penguin.position.x;
                    finalZ = slideZ;
                }
            }
        }

        if (finalX === null){
            if (nav.replanCooldown <= 0){
                nav.path = _findPath(penguin.position, targetPos);
                nav.wpIndex = 0;
                nav.replanCooldown = 20;
            } else {
                nav.replanCooldown--;
            }
            if (typeof stopWalking !== 'undefined') stopWalking(penguin);
            return false;
        }

        penguin.position.x = finalX;
        penguin.position.z = finalZ;
        penguin.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        if (typeof startWalking !== 'undefined') startWalking(penguin);

        return false;
    } catch (err){
        console.error('moveTowards: errore nel path planning, uso il movimento diretto', err);
        penguin.userData.__nav = null;
        return _moveTowardsDirect(penguin, targetPos, ignoreCollision);
    }
}

export const DEFAULT_CLEAR_RADIUS = 4.0;
export function isAreaFree(spot, exclude = null, radius = DEFAULT_CLEAR_RADIUS, filter = null){
    if (!spot) return false;

    return !getAgents().some(p => {
        const mesh = p.mesh;
        if (!mesh || mesh === exclude) return false;
        if (filter && !filter(mesh)) return false;
        return mesh.position.distanceTo(spot) < radius;
    });
}

let doorLaneOwner = null;
export function doorLaneIsFree(){
    if (doorLaneOwner && !doorLaneOwner.parent) doorLaneOwner = null;
    return doorLaneOwner === null;
}

export function getDoorLaneOwner(){
    return doorLaneIsFree() ? null : doorLaneOwner;
}

export function acquireDoorLane(agent){
    if (doorLaneOwner === agent) return true;
    if (!doorLaneIsFree()) return false;
    doorLaneOwner = agent;
    return true;
}

export function releaseDoorLane(agent){
    if (doorLaneOwner === agent) doorLaneOwner = null;
}

export function watchdogDoorLane(stillNeedsDoor){
    if (!doorLaneOwner) return;

    if (!doorLaneOwner.parent){
        doorLaneOwner = null;
        return;
    }

    if (typeof stillNeedsDoor === 'function' && !stillNeedsDoor(doorLaneOwner)){
        doorLaneOwner = null;
    }
}
