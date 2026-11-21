import { Chest } from "./chest.js";

/**
 * Locked vaults: small side rooms carved by the world generator, each holding a
 * rich chest behind a gate. Each vault has one lock:
 *  - "key":    a key lies somewhere else on the level. Pick it up, then press Space at the gate.
 *  - "plates": three colored pressure plates in the vault's room. Step on them in the
 *              order shown on the gate; a wrong step resets them.
 *  - "lever":  a lever in a neighboring room opens the gate for a few seconds. Run!
 *              The gate never closes on the player, and stays open once the chest is opened.
 * The gate is registered with the WallCollider, so while it is closed it blocks the
 * player, enemies, spells, and projectiles exactly like a wall.
 */

export const LOCK_TYPES = ["key", "plates", "lever"];

// Reach (world pixels from the player's feet) for picking up keys and using levers and gates.
export const PICKUP_RANGE = 12;
export const USE_RANGE = 22;
export const GATE_RANGE = 30;

// Lever timer: base frames plus frames per pixel of walking distance to the gate.
export const LEVER_BASE_FRAMES = 150;
export const LEVER_FRAMES_PER_PIXEL = 0.8;

// Plate colors and the symbols drawn on them.
export const PLATE_STYLES = [
    { name: "red", color: [220, 70, 70] },
    { name: "green", color: [80, 200, 110] },
    { name: "blue", color: [80, 140, 240] }
];

/** @returns {number[]} The center of the player's feet in world pixels. */
export function playerFeet(player) {
    if (player.getHitbox) {
        const box = player.getHitbox();
        return [box.x + box.w / 2, box.y + box.h / 2];
    }
    return [player.x + player.size / 2, player.y + player.size * 0.8];
}

/** A locked vault with its gate, its lock, and the chest inside. */
export class Vault {
    /**
     * @param {Object} data - A world.vaults entry.
     * @param {string} lockType - "key", "plates", or "lever".
     * @param {number} tileSize - World pixels per tile.
     */
    constructor(data, lockType, tileSize) {
        this.data = data;
        this.lockType = lockType;
        this.tileSize = tileSize;
        this.gate = { tiles: data.door, closed: true };
        this.solved = false;       // True once the gate is open for good.

        const centerX = (data.x + data.w / 2) * tileSize;
        const centerY = (data.y + data.h / 2) * tileSize;
        this.chest = new Chest(centerX, centerY, true);

        // Key lock.
        this.key = null;           // {x, y} while on the floor.
        this.hasKey = false;
        // Plate lock.
        this.plates = [];          // {x, y, col, row, style, lit}
        this.order = [];           // Plate indexes in the order they must be pressed.
        this.progress = 0;
        this.standingOn = -1;      // Plate under the player last frame, to detect new steps.
        // Lever lock.
        this.lever = null;         // {x, y}
        this.timer = 0;            // Frames left before the gate closes again.
        this.timerMax = 0;
    }

    /** @returns {number[]} Center of the gate in world pixels. */
    get gateCenter() {
        const tiles = this.data.door;
        const x = tiles.reduce((sum, [c]) => sum + c + 0.5, 0) / tiles.length * this.tileSize;
        const y = tiles.reduce((sum, [, r]) => sum + r + 0.5, 0) / tiles.length * this.tileSize;
        return [x, y];
    }

    /** @returns {boolean} True if the gate's tiles run left to right (north/south vaults). */
    get horizontal() {
        return this.data.side === "north" || this.data.side === "south";
    }

    /** Opens the gate; permanently unless a lever timer is running. */
    openGate(permanent = true) {
        this.gate.closed = false;
        if (permanent) {
            this.solved = true;
            this.timer = 0;
        }
    }

    /**
     * @param {Player} player - The player.
     * @returns {boolean} True if any part of the player is in the vault or its doorway,
     *   where a closing gate would trap them inside a wall.
     */
    containsPlayer(player) {
        const t = this.tileSize;
        const box = player.getHitbox ? player.getHitbox()
            : { x: player.x, y: player.y, w: player.size, h: player.size };
        const cols = [this.data.x, this.data.x + this.data.w - 1, ...this.data.door.map(([c]) => c)];
        const rows = [this.data.y, this.data.y + this.data.h - 1, ...this.data.door.map(([, r]) => r)];
        const area = {
            x: Math.min(...cols) * t, y: Math.min(...rows) * t,
            w: (Math.max(...cols) - Math.min(...cols) + 1) * t,
            h: (Math.max(...rows) - Math.min(...rows) + 1) * t
        };
        return box.x < area.x + area.w && area.x < box.x + box.w
            && box.y < area.y + area.h && area.y < box.y + box.h;
    }

    /** @returns {boolean} True if the player's feet are close to the gate. */
    isNearGate(player) {
        const [fx, fy] = playerFeet(player);
        const [gx, gy] = this.gateCenter;
        return Math.hypot(fx - gx, fy - gy) <= GATE_RANGE;
    }

    /**
     * Per-frame lock logic: key pickup, plate steps, and the lever timer.
     * @param {Player} player - The player.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     * @returns {string|null} A message to show the player, if something happened.
     */
    update(player, frameScale) {
        this.chest.update(frameScale);
        // Once the treasure is taken, the gate stays open.
        if (this.chest.opened && !this.solved) this.openGate(true);

        const [fx, fy] = playerFeet(player);
        if (this.lockType === "key" && this.key && !this.hasKey
                && Math.hypot(fx - this.key.x, fy - this.key.y) <= PICKUP_RANGE) {
            this.hasKey = true;
            this.key = null;
            return "You found a vault key! Bring it to the locked gate.";
        }

        if (this.lockType === "plates" && !this.solved) {
            const index = this.plates.findIndex(plate =>
                Math.abs(fx - plate.x) <= this.tileSize * 0.4 && Math.abs(fy - plate.y) <= this.tileSize * 0.4);
            const newStep = index !== -1 && index !== this.standingOn;
            this.standingOn = index;
            if (newStep) return this.stepOnPlate(index);
        }

        if (this.lockType === "lever" && !this.solved && this.timer > 0) {
            this.timer = Math.max(0, this.timer - frameScale);
            if (this.timer === 0) {
                // Never close on the player; wait until they step out.
                if (this.containsPlayer(player)) {
                    this.timer = 1;
                } else {
                    this.gate.closed = true;
                    return "The gate slams shut! Pull the lever to try again.";
                }
            }
        }
        return null;
    }

    /**
     * Presses a plate. The right plate lights up; a wrong one resets the puzzle.
     * @param {number} index - Plate index.
     * @returns {string|null} Message for the player.
     */
    stepOnPlate(index) {
        const plate = this.plates[index];
        if (plate.lit) return null;
        if (this.order[this.progress] === index) {
            plate.lit = true;
            this.progress++;
            if (this.progress === this.order.length) {
                this.openGate(true);
                return "Click... the vault gate grinds open!";
            }
            return "Click! (" + this.progress + " / " + this.order.length + ")";
        }
        for (const other of this.plates) other.lit = false;
        this.progress = 0;
        return "Wrong order - the plates reset. Check the gems on the gate.";
    }

    /**
     * Handles the Space key near this vault's gate or lever.
     * @param {Player} player - The player.
     * @returns {string|null} Message, or null if nothing here could be used.
     */
    interact(player) {
        const [fx, fy] = playerFeet(player);
        if (this.lockType === "lever" && this.lever
                && Math.hypot(fx - this.lever.x, fy - this.lever.y) <= USE_RANGE) {
            if (this.solved) return "The lever is stuck. The gate is open for good.";
            this.openGate(false);
            this.timer = this.timerMax;
            return "The lever clunks down. A gate opened somewhere nearby... hurry!";
        }
        if (!this.gate.closed || !this.isNearGate(player)) return null;
        if (this.lockType === "key") {
            if (!this.hasKey) return "Locked. A key is hidden somewhere on this level.";
            this.hasKey = false;
            this.openGate(true);
            return "The key turns. The vault gate swings open!";
        }
        return this.hint();
    }

    /** @returns {string} Explains how to open this vault. */
    hint() {
        if (this.lockType === "key") return this.hasKey ? "SPACE: Unlock the gate" : "Locked. A key is hidden somewhere on this level.";
        if (this.lockType === "plates") return "Sealed. Step on the pressure plates in the order of the gems on the gate.";
        return "Sealed. A lever in a nearby room opens it for a short time.";
    }

    /**
     * @param {Player} player - The player.
     * @returns {string|null} Text for the on-screen prompt, when the player is near something.
     */
    prompt(player) {
        const [fx, fy] = playerFeet(player);
        if (this.lockType === "lever" && this.lever
                && Math.hypot(fx - this.lever.x, fy - this.lever.y) <= USE_RANGE) {
            return this.solved ? null : "SPACE: Pull lever";
        }
        if (this.gate.closed && this.isNearGate(player)) return this.hint();
        return null;
    }

    /** Draws the floor pieces (plates, key, lever) and the gate, before lighting. */
    display() {
        push();
        noStroke();
        const t = this.tileSize;
        for (const plate of this.plates) {
            fill(70, 68, 76);
            rect(plate.x - 8, plate.y - 8, 16, 16, 2);
            fill(plate.lit ? 120 : 92, plate.lit ? 118 : 90, plate.lit ? 126 : 98);
            rect(plate.x - 6, plate.y - (plate.lit ? 5 : 6), 12, 12, 1);
            fill(...plate.style.color.map(c => plate.lit ? c : c * 0.55));
            rect(plate.x - 2, plate.y - 2, 4, 4);
        }
        if (this.key) this.drawKey(this.key.x, this.key.y);
        if (this.lever) this.drawLever();

        if (this.gate.closed) {
            for (const [col, row] of this.data.door) {
                const x = col * t;
                const y = row * t;
                fill(30, 28, 34);
                rect(x, y, t, t);
                fill(120, 118, 130);
                if (this.horizontal) {
                    for (let bx = 2; bx < t; bx += 5) rect(x + bx, y, 2, t);
                    rect(x, y + 4, t, 2);
                    rect(x, y + t - 6, t, 2);
                } else {
                    for (let by = 2; by < t; by += 5) rect(x, y + by, t, 2);
                    rect(x + 4, y, 2, t);
                    rect(x + t - 6, y, 2, t);
                }
            }
            if (this.lockType === "key") {
                const [gx, gy] = this.gateCenter;
                fill(200, 165, 60);
                rect(gx - 4, gy - 3, 8, 7, 1);
                fill(40, 30, 20);
                rect(gx - 1, gy - 1, 2, 3);
            }
        }
        pop();
    }

    /** Small gold key. */
    drawKey(x, y) {
        fill(230, 190, 70);
        rect(x - 6, y - 3, 5, 5, 1);
        rect(x - 1, y - 1, 7, 2);
        rect(x + 3, y + 1, 1, 2);
        rect(x + 5, y + 1, 1, 2);
        fill(60, 45, 20);
        rect(x - 5, y - 2, 2, 2);
    }

    /** Lever base plus a handle that tips over while the gate is open. */
    drawLever() {
        const { x, y } = this.lever;
        fill(70, 68, 76);
        rect(x - 5, y + 1, 10, 5, 1);
        const down = !this.gate.closed;
        stroke(140, 100, 60);
        strokeWeight(2);
        line(x, y + 2, x + (down ? 6 : -6), y - 6);
        noStroke();
        fill(200, 60, 50);
        rect(x + (down ? 5 : -7), y - 8, 3, 3);
    }

    /**
     * Drawn after lighting so it stays readable in the dark: the plate order on
     * the gate, glints on the key and lever, and the lever's countdown bar.
     */
    displayOverlay() {
        this.chest.displayOverlay();
        push();
        noStroke();
        const [gx, gy] = this.gateCenter;
        const time = (typeof millis === "function" ? millis() : 0) / 1000;
        const glint = (Math.sin(time * 4) + 1) / 2;

        if (this.lockType === "plates" && !this.solved) {
            // The order to press the plates in, as gems across the gate.
            this.order.forEach((plateIndex, i) => {
                const color = this.plates[plateIndex].style.color;
                const x = gx - 10 + i * 10;
                fill(...color, i < this.progress ? 255 : 150 + 80 * glint);
                quad(x, gy - 4, x + 3, gy, x, gy + 4, x - 3, gy);
            });
            for (const plate of this.plates) {
                if (!plate.lit) continue;
                fill(...plate.style.color, 90);
                rect(plate.x - 7, plate.y - 7, 14, 14, 2);
            }
        }
        if (this.key) {
            fill(255, 240, 170, 200 * glint);
            rect(this.key.x - 4, this.key.y - 7, 1, 3);
            rect(this.key.x - 5, this.key.y - 6, 3, 1);
        }
        if (this.lever && !this.solved && this.gate.closed) {
            fill(255, 120, 90, 150 * glint);
            rect(this.lever.x - 1, this.lever.y - 10, 2, 2);
        }
        if (this.lockType === "lever" && this.timer > 0 && !this.solved) {
            const fraction = this.timer / this.timerMax;
            fill(0, 0, 0, 160);
            rect(gx - 13, gy - 18, 26, 4);
            fill(255, 180 * fraction + 40, 60);
            rect(gx - 12, gy - 17, 24 * fraction, 2);
        }
        pop();
    }
}

/**
 * Floor tiles of a room, optionally inset from its walls.
 * @returns {number[][]} [col, row] pairs.
 */
function roomTiles(world, room, inset) {
    const tiles = [];
    for (let row = room.y + inset; row < room.y + room.h - inset; row++) {
        for (let col = room.x + inset; col < room.x + room.w - inset; col++) {
            if (world.isFloor(col, row)) tiles.push([col, row]);
        }
    }
    return tiles;
}

/**
 * Builds a Vault for every vault the world generator carved, picks a lock for each,
 * places keys, plates, and levers, and registers the gates with the walls.
 * @param {World} world - Generated level (with world.vaults).
 * @param {number} tileSize - World pixels per tile.
 * @param {WallCollider|null} walls - Receives the gates.
 * @param {function(): number} random - Random number source.
 * @param {Set<string>} used - "col,row" tiles already holding something; updated here.
 * @returns {Vault[]} The vaults.
 */
export function createVaults(world, tileSize, walls, random = Math.random, used = new Set()) {
    const randomInt = (min, max) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
    const center = ([col, row]) => [(col + 0.5) * tileSize, (row + 0.5) * tileSize];
    const free = tiles => tiles.filter(([c, r]) => !used.has(c + "," + r)
        && !(world.start && world.start[0] === c && world.start[1] === r));
    const take = tiles => {
        // Never fails: with nowhere free, fall back to the middle of the first room.
        const tile = tiles.length ? tiles[randomInt(0, tiles.length - 1)]
            : [world.rooms[0].x + 1, world.rooms[0].y + 1];
        used.add(tile[0] + "," + tile[1]);
        return tile;
    };

    // Different vaults get different locks.
    const types = LOCK_TYPES.slice();
    for (let i = types.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [types[i], types[j]] = [types[j], types[i]];
    }

    return world.vaults.map((data, i) => {
        const host = world.rooms[data.roomIndex];
        const hostCenter = [host.x + host.w / 2, host.y + host.h / 2];
        let type = types[i % types.length];

        // Tiles right in front of the gate stay clear so plates are never stepped on by accident.
        const doorFront = new Set();
        for (const [c, r] of data.door) {
            for (let dc = -2; dc <= 2; dc++) {
                for (let dr = -2; dr <= 2; dr++) doorFront.add((c + dc) + "," + (r + dr));
            }
        }

        let plateTiles = null;
        if (type === "plates") {
            // Three plates at least two steps apart, so each press is deliberate.
            const inset = host.w >= 7 && host.h >= 6 ? 1 : 0;
            const candidates = free(roomTiles(world, host, inset)).filter(([c, r]) => !doorFront.has(c + "," + r));
            for (let k = candidates.length - 1; k > 0; k--) {
                const j = randomInt(0, k);
                [candidates[k], candidates[j]] = [candidates[j], candidates[k]];
            }
            plateTiles = [];
            for (const tile of candidates) {
                if (plateTiles.every(([c, r]) => Math.abs(c - tile[0]) + Math.abs(r - tile[1]) >= 2)) {
                    plateTiles.push(tile);
                }
                if (plateTiles.length === PLATE_STYLES.length) break;
            }
            if (plateTiles.length < PLATE_STYLES.length) type = "key"; // Room too small or crowded.
        }

        const vault = new Vault(data, type, tileSize);
        if (walls) walls.addGate(vault.gate);

        // Rooms other than this vault's, nearest first.
        const others = world.rooms.map((room, index) => ({ room, index }))
            .filter(({ index }) => index !== data.roomIndex)
            .map(entry => ({ ...entry,
                distance: Math.hypot(entry.room.x + entry.room.w / 2 - hostCenter[0],
                    entry.room.y + entry.room.h / 2 - hostCenter[1]) }))
            .sort((a, b) => a.distance - b.distance);

        if (type === "plates") {
            vault.plates = plateTiles.map((tile, k) => {
                used.add(tile[0] + "," + tile[1]);
                const [x, y] = center(tile);
                return { x, y, col: tile[0], row: tile[1], style: PLATE_STYLES[k], lit: false };
            });
            vault.order = [0, 1, 2];
            for (let k = vault.order.length - 1; k > 0; k--) {
                const j = randomInt(0, k);
                [vault.order[k], vault.order[j]] = [vault.order[j], vault.order[k]];
            }
        } else if (type === "key") {
            // Hide the key far away: in the farthest room that is not the start room.
            const far = others.slice().reverse();
            const choice = far.find(({ index, room }) => index !== 0 && free(roomTiles(world, room, 1)).length)
                || far.find(({ room }) => free(roomTiles(world, room, 0)).length);
            const tiles = choice ? free(roomTiles(world, choice.room, 1)) : [];
            const spot = tiles.length ? take(tiles)
                : take(free(roomTiles(world, host, 0)).filter(([c, r]) => !doorFront.has(c + "," + r)));
            const [x, y] = center(spot);
            vault.key = { x, y };
        } else {
            // The lever goes in the nearest other room, so the run back is a fair race.
            const choice = others.find(({ room }) => free(roomTiles(world, room, 1)).length);
            const tiles = choice ? free(roomTiles(world, choice.room, 1))
                : free(roomTiles(world, host, 0)).filter(([c, r]) => !doorFront.has(c + "," + r));
            const [x, y] = center(take(tiles));
            vault.lever = { x, y };
            const [gx, gy] = vault.gateCenter;
            // Corridors bend, so allow for the walking (Manhattan) distance, not the straight line.
            vault.timerMax = LEVER_BASE_FRAMES
                + (Math.abs(gx - x) + Math.abs(gy - y)) * LEVER_FRAMES_PER_PIXEL;
        }
        return vault;
    });
}
