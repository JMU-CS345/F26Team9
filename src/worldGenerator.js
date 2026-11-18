import { TileLayer } from "./tileLayer.js";

/**
 * Floor materials, matching the rows of floor-tiles.png.
 * A floor tile's value is material * FLOOR_VARIANTS + variant, or EMPTY for no floor.
 */
export const FLOOR = { EMPTY: -1, BRICK: 0, COBBLE: 1, SLAB: 2, WOOD: 3 };
export const FLOOR_VARIANTS = 8;

/** Wall materials, matching the pairs of rows in wall_tiles_final.png. */
export const WALL = { NONE: 0, STONE: 1, WOOD: 2 };

// Size of one tile in the wall sheet, in pixels.
export const WALL_SOURCE_TILE = 25;

// Tiles per row in the wall sheet, and rows per material (stone, then wood).
export const WALL_SHEET_COLS = 6;
export const WALL_ROWS_PER_MATERIAL = 2;

/**
 * The pieces in each material's two rows of the sheet. `index` is the tile
 * number within the material, read left to right; `rects` are the solid
 * parts of the tile in sheet pixels, as {x, y, w, h}.
 */
export const WALL_PIECE = {
    // Floor on one side: a straight wall along that edge.
    SOUTH: { index: 0, rects: [{ x: 0, y: 6, w: 25, h: 19 }] },   // top edge plus front face
    NORTH: { index: 1, rects: [{ x: 0, y: 0, w: 25, h: 8 }] },
    WEST: { index: 2, rects: [{ x: 0, y: 0, w: 8, h: 25 }] },
    EAST: { index: 3, rects: [{ x: 17, y: 0, w: 8, h: 25 }] },

    // Floor only diagonally: the outer corner of a room.
    SOUTH_WEST_CORNER: { index: 4, rects: [{ x: 0, y: 6, w: 8, h: 19 }] },
    SOUTH_EAST_CORNER: { index: 5, rects: [{ x: 17, y: 6, w: 8, h: 19 }] },
    NORTH_WEST_CORNER: { index: 6, rects: [{ x: 0, y: 0, w: 8, h: 8 }] },
    NORTH_EAST_CORNER: { index: 7, rects: [{ x: 17, y: 0, w: 8, h: 8 }] },

    // Floor on two neighboring sides: an inside corner.
    SOUTH_WEST: { index: 8, rects: [{ x: 0, y: 0, w: 8, h: 6 }, { x: 0, y: 6, w: 25, h: 19 }] },
    SOUTH_EAST: { index: 9, rects: [{ x: 17, y: 0, w: 8, h: 6 }, { x: 0, y: 6, w: 25, h: 19 }] },
    NORTH_WEST: { index: 10, rects: [{ x: 0, y: 0, w: 25, h: 8 }, { x: 0, y: 8, w: 8, h: 17 }] },
    NORTH_EAST: { index: 11, rects: [{ x: 0, y: 0, w: 25, h: 8 }, { x: 17, y: 8, w: 8, h: 17 }] }
};

/**
 * What chests can hold. A chest picks one kind by weight (gold half the time),
 * then a random item of that kind or an amount of gold.
 */
export const CHEST_LOOT = [
    { kind: "gold", weight: 50 },
    { kind: "potion", weight: 35,
        items: ["healing_potion", "mana_potion", "speed_potion", "shield_potion"] },
    { kind: "gear", weight: 15, items: ["iron_sword", "wooden_shield"] }
];

// Gold in a chest that holds gold, from min to max.
export const CHEST_GOLD = { min: 10, max: 40 };

// Chance that a room gets a chest. At least one chest is always placed.
export const CHEST_CHANCE = 0.2;

/**
 * A treasure chest on a floor tile. It holds one reward, picked when the world
 * is generated, and can be opened only once.
 */
export class Chest {
    // How close (in world pixels) the player's feet must be to open it.
    static REACH = 22;

    // Pixel colors for the sprites below; "." is transparent.
    static PALETTE = {
        d: [42, 26, 22],     // outline
        w: [156, 98, 52],    // light wood
        b: [112, 66, 36],    // dark wood
        g: [214, 170, 60],   // gold bands
        y: [252, 220, 96],   // lock
        k: [24, 16, 14]      // keyhole and empty inside
    };

    static CLOSED = [
        "..dddddddddd..",
        ".dwwwwwwwwwwd.",
        "dwwwwwwwwwwwwd",
        "dgbbbbbbbbbbgd",
        "dddddyyyyddddd",
        "dgwwwykkywwwgd",
        "dgbbbbyybbbbgd",
        "dgbbbbbbbbbbgd",
        "dgwwwwwwwwwwgd",
        "dddddddddddddd"
    ];

    // The lid tipped back above the box, with the empty inside showing.
    static OPEN = [
        "..dddddddddd..",
        ".dwwwwwwwwwwd.",
        ".dbbbgggbbbbd.",
        ".dbbbbbbbbbbd.",
        "dddddddddddddd",
        "dkkkkkkkkkkkkd",
        "dkkkkkkkkkkkkd",
        "dgwwwwwwwwwwgd",
        "dgbbbbbbbbbbgd",
        "dgwwwwwwwwwwgd",
        "dddddddddddddd"
    ];

    // 60 FPS frames the reward text floats above an opened chest.
    static POPUP_TIME = 90;

    /**
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @param {Object} reward - {kind: "gold", amount} or {kind: "item", id}.
     */
    constructor(col, row, reward) {
        this.col = col;
        this.row = row;
        this.reward = reward;
        this.opened = false;
        this.popupText = "";
        this.popupAge = Chest.POPUP_TIME;
    }

    /**
     * Opens the chest.
     * @returns {Object|null} The reward, or null if the chest was already opened.
     */
    open() {
        if (this.opened) return null;
        this.opened = true;
        return this.reward;
    }

    /**
     * Shows what came out of the chest, floating above it for a moment.
     * @param {string} text - Text to show, such as "+25 gold".
     */
    showPopup(text) {
        this.popupText = text;
        this.popupAge = 0;
    }

    /**
     * @param {number} tileSize - Size of one tile in world pixels.
     * @returns {number[]} The chest's center as [x, y] in world pixels.
     */
    center(tileSize) {
        return [(this.col + 0.5) * tileSize, (this.row + 0.5) * tileSize];
    }

    /**
     * Whether a point, such as the middle of the player's feet, can reach the chest.
     * @param {number} x - World x-coordinate.
     * @param {number} y - World y-coordinate.
     * @param {number} tileSize - Size of one tile in world pixels.
     * @returns {boolean} True if close enough to open it.
     */
    inReach(x, y, tileSize) {
        const [cx, cy] = this.center(tileSize);
        return Math.hypot(x - cx, y - cy) <= Chest.REACH;
    }

    /**
     * Advances the reward popup.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(frameScale) {
        this.popupAge = Math.min(Chest.POPUP_TIME, this.popupAge + frameScale);
    }

    /**
     * Draws the chest, closed or open, sitting on the bottom of its tile.
     * @param {number} tileSize - Size of one tile in world pixels.
     */
    display(tileSize) {
        const art = this.opened ? Chest.OPEN : Chest.CLOSED;
        const left = Math.round((this.col + 0.5) * tileSize - art[0].length / 2);
        const top = Math.round((this.row + 1) * tileSize - art.length - 4);
        push();
        noStroke();
        // A soft shadow under the chest.
        fill(0, 90);
        rect(left + 1, top + art.length - 1, art[0].length - 2, 3);
        for (let y = 0; y < art.length; y++) {
            for (let x = 0; x < art[y].length; x++) {
                const color = Chest.PALETTE[art[y][x]];
                if (!color) continue;
                fill(...color);
                rect(left + x, top + y, 1, 1);
            }
        }
        pop();
    }

    /**
     * Draws the floating reward text, or a "Space" hint while the player is close
     * to a closed chest. Call after the lighting pass so the text stays readable.
     * @param {number} tileSize - Size of one tile in world pixels.
     * @param {boolean} playerNear - True if the player can reach the chest.
     */
    displayLabel(tileSize, playerNear) {
        const [x, y] = this.center(tileSize);
        push();
        textAlign(CENTER, BOTTOM);
        textSize(6);
        if (!this.opened && playerNear) {
            fill(0, 170);
            text("Space", x + 0.5, y - 8.5);
            fill(255, 235, 170);
            text("Space", x, y - 9);
        }
        if (this.popupAge < Chest.POPUP_TIME) {
            const t = this.popupAge / Chest.POPUP_TIME;
            const alpha = 255 * Math.min(1, (1 - t) * 3);
            const rise = y - 10 - t * 14;
            fill(0, alpha * 0.7);
            text(this.popupText, x + 0.5, rise + 0.5);
            fill(255, 220, 90, alpha);
            text(this.popupText, x, rise);
        }
        pop();
    }
}

// Materials a room can be built from. Corridors always use cobblestone.
const ROOM_MATERIALS = [FLOOR.BRICK, FLOOR.SLAB, FLOOR.WOOD];

const DEFAULTS = {
    maxRooms: 8,
    attempts: 80,
    minRoomWidth: 5,
    maxRoomWidth: 10,
    minRoomHeight: 4,
    maxRoomHeight: 7,
    corridorWidth: 2,
    // Empty tiles kept between rooms so each room gets its own walls.
    roomGap: 2
};

/**
 * Creates a seeded random number generator (mulberry32).
 * The same seed always gives the same sequence, so a world can be recreated.
 * @param {number} seed - Any integer.
 * @returns {function(): number} Function returning numbers in [0, 1).
 */
export function createRandom(seed) {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** A generated level: a floor layer, a wall layer, and the rooms they came from. */
export class World {
    /**
     * @param {number} cols - Number of tile columns.
     * @param {number} rows - Number of tile rows.
     */
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.floor = new TileLayer(cols, rows, FLOOR.EMPTY);
        this.walls = new TileLayer(cols, rows, WALL.NONE);
        this.rooms = [];
        this.torches = [];
        this.chests = [];
        this.start = null;
    }

    /** @returns {boolean} True if the tile has floor of its own. */
    isFloor(col, row) {
        return this.floor.get(col, row) !== FLOOR.EMPTY;
    }

    /** @returns {boolean} True if the tile holds a wall. */
    isWall(col, row) {
        return this.walls.get(col, row) !== WALL.NONE;
    }

    /**
     * Which orthogonal neighbors are also walls, as a bit mask: N=1, E=2, S=4, W=8.
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {number} Mask from 0 to 15.
     */
    wallMask(col, row) {
        return (this.isWall(col, row - 1) ? 1 : 0)
            + (this.isWall(col + 1, row) ? 2 : 0)
            + (this.isWall(col, row + 1) ? 4 : 0)
            + (this.isWall(col - 1, row) ? 8 : 0);
    }

    /**
     * Picks the pieces of wall_tiles_final.png to draw for a wall tile, in drawing
     * order: thin wall tops first and front faces last, so a face is never covered.
     * Each wall hugs the edge of its tile that faces the floor next to it; a wall
     * with floor below it (a room's top wall) shows a tall front face for depth.
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {Object[]} WALL_PIECE entries; empty if the tile is not a wall or touches no floor.
     */
    wallPieces(col, row) {
        if (!this.isWall(col, row)) return [];
        const floor = (dc, dr) => this.isFloor(col + dc, row + dr);
        const north = floor(0, -1);
        const east = floor(1, 0);
        const south = floor(0, 1);
        const west = floor(-1, 0);

        const pieces = [];
        // Outer corners only where neither side next to the diagonal already has a wall piece.
        if (!north && !west && floor(-1, -1)) pieces.push(WALL_PIECE.NORTH_WEST_CORNER);
        if (!north && !east && floor(1, -1)) pieces.push(WALL_PIECE.NORTH_EAST_CORNER);
        if (!south && !west && floor(-1, 1)) pieces.push(WALL_PIECE.SOUTH_WEST_CORNER);
        if (!south && !east && floor(1, 1)) pieces.push(WALL_PIECE.SOUTH_EAST_CORNER);

        if (north && west) pieces.push(WALL_PIECE.NORTH_WEST);
        if (north && east) pieces.push(WALL_PIECE.NORTH_EAST);
        if (north && !west && !east) pieces.push(WALL_PIECE.NORTH);
        if (west && !north && !south) pieces.push(WALL_PIECE.WEST);
        if (east && !north && !south) pieces.push(WALL_PIECE.EAST);

        if (south && west) pieces.push(WALL_PIECE.SOUTH_WEST);
        if (south && east) pieces.push(WALL_PIECE.SOUTH_EAST);
        if (south && !west && !east) pieces.push(WALL_PIECE.SOUTH);
        return pieces;
    }

    /**
     * Finds a floor tile touching this one, checking sides before corners.
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {number[]|null} [col, row] of the neighbor, or null if there is none.
     */
    findFloorNeighbor(col, row) {
        const offsets = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, 1], [-1, -1]];
        for (const [dc, dr] of offsets) {
            if (this.isFloor(col + dc, row + dr)) return [col + dc, row + dr];
        }
        return null;
    }
}

/**
 * Generates a level: rectangular rooms placed at random without overlapping,
 * each joined to the previous one by an L-shaped corridor, with walls around
 * every floor tile. The player starts in the center of the first room.
 * @param {number} cols - Number of tile columns.
 * @param {number} rows - Number of tile rows.
 * @param {function(): number} random - Random number source; use createRandom() for a seed.
 * @param {Object} options - Overrides for the room and corridor sizes in DEFAULTS.
 * @returns {World} The generated world.
 */
export function generateWorld(cols, rows, random = Math.random, options = {}) {
    const settings = { ...DEFAULTS, ...options };
    const world = new World(cols, rows);
    const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));

    for (let i = 0; i < settings.attempts && world.rooms.length < settings.maxRooms; i++) {
        const w = randomInt(settings.minRoomWidth, settings.maxRoomWidth);
        const h = randomInt(settings.minRoomHeight, settings.maxRoomHeight);

        // Keep a one-tile border around the map so every room has space for its walls.
        if (w > cols - 2 || h > rows - 2) continue;
        const room = {
            x: randomInt(1, cols - w - 1),
            y: randomInt(1, rows - h - 1),
            w,
            h,
            material: ROOM_MATERIALS[randomInt(0, ROOM_MATERIALS.length - 1)]
        };
        if (world.rooms.some(other => roomsOverlap(room, other, settings.roomGap))) continue;
        world.rooms.push(room);
    }

    for (const room of world.rooms) carveRoom(world, room, randomInt);
    for (let i = 1; i < world.rooms.length; i++) {
        carveCorridor(world, roomCenter(world.rooms[i - 1]), roomCenter(world.rooms[i]),
            settings.corridorWidth, random, randomInt);
    }
    buildWalls(world);
    placeTorches(world);
    placeChests(world, random, randomInt);

    world.start = world.rooms.length > 0 ? roomCenter(world.rooms[0]) : null;
    return world;
}

/**
 * @param {Object} a - Room {x, y, w, h}.
 * @param {Object} b - Room {x, y, w, h}.
 * @param {number} gap - Tiles that must separate the rooms.
 * @returns {boolean} True if the rooms overlap or are closer than gap.
 */
export function roomsOverlap(a, b, gap = 0) {
    return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap
        && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}

/**
 * @param {Object} room - Room {x, y, w, h}.
 * @returns {number[]} [col, row] of the room's center tile.
 */
export function roomCenter(room) {
    return [room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2)];
}

/** Fills a room with its material, picking a random variant for each tile. */
function carveRoom(world, room, randomInt) {
    for (let row = room.y; row < room.y + room.h; row++) {
        for (let col = room.x; col < room.x + room.w; col++) {
            world.floor.set(col, row,
                room.material * FLOOR_VARIANTS + randomInt(0, FLOOR_VARIANTS - 1));
        }
    }
}

/**
 * Carves an L-shaped corridor between two tiles: along one axis, then the other,
 * choosing at random which axis goes first. Existing room floor is left alone.
 */
function carveCorridor(world, from, to, width, random, randomInt) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const corner = random() < 0.5 ? [x2, y1] : [x1, y2];

    for (const [[ax, ay], [bx, by]] of [[from, corner], [corner, to]]) {
        for (let col = Math.min(ax, bx); col <= Math.max(ax, bx); col++) {
            for (let row = Math.min(ay, by); row <= Math.max(ay, by); row++) {
                // Widen the corridor right and down, staying off the map's border tiles.
                for (let d = 0; d < width; d++) {
                    for (let e = 0; e < width; e++) {
                        const c = col + d;
                        const r = row + e;
                        if (c < 1 || r < 1 || c > world.cols - 2 || r > world.rows - 2) continue;
                        if (world.isFloor(c, r)) continue;
                        world.floor.set(c, r,
                            FLOOR.COBBLE * FLOOR_VARIANTS + randomInt(0, FLOOR_VARIANTS - 1));
                    }
                }
            }
        }
    }
}

/**
 * Puts a wall on every empty tile that touches floor, including diagonally,
 * so the walls form closed outlines. Walls around wooden floors are wooden.
 */
function buildWalls(world) {
    for (let row = 0; row < world.rows; row++) {
        for (let col = 0; col < world.cols; col++) {
            if (world.isFloor(col, row)) continue;
            const neighbor = world.findFloorNeighbor(col, row);
            if (!neighbor) continue;
            const material = Math.floor(world.floor.get(neighbor[0], neighbor[1]) / FLOOR_VARIANTS);
            world.walls.set(col, row, material === FLOOR.WOOD ? WALL.WOOD : WALL.STONE);
        }
    }
}

/**
 * Hangs torches on each room's top wall: one in the middle of a narrow room,
 * two spaced a third of the way in from each side of a wide one. A torch only
 * goes on a straight piece of wall with floor below it, never on a corner,
 * junction, or doorway, so it never looks like it is floating.
 */
function placeTorches(world) {
    const used = new Set();
    for (const room of world.rooms) {
        const row = room.y - 1;
        const targets = room.w >= 8
            ? [room.x + Math.floor(room.w / 3), room.x + room.w - 1 - Math.floor(room.w / 3)]
            : [room.x + Math.floor(room.w / 2)];

        for (const target of targets) {
            const col = nearestTorchSpot(world, room, row, target, used);
            if (col === null) continue;
            used.add(row * world.cols + col);
            world.torches.push({ col, row });
        }
    }
}

/**
 * Finds the wall tile on a room's top row closest to a target column that can hold a torch.
 * @returns {number|null} The column, or null if the room has no suitable wall.
 */
function nearestTorchSpot(world, room, row, target, used) {
    // A straight east-west wall: neighbors on both sides, none above or below.
    const STRAIGHT = 2 + 8;
    for (let distance = 0; distance < room.w; distance++) {
        for (const col of [target - distance, target + distance]) {
            if (col < room.x || col >= room.x + room.w) continue;
            if (used.has(row * world.cols + col)) continue;
            if (world.isWall(col, row) && world.isFloor(col, row + 1)
                    && world.wallMask(col, row) === STRAIGHT) {
                return col;
            }
        }
    }
    return null;
}

/**
 * Puts chests in rooms: each room has a CHEST_CHANCE of getting one, and at
 * least one chest is always placed. A chest sits on the floor row along the
 * room's top wall, clear of doorways, torches, and the starting tile.
 */
function placeChests(world, random, randomInt) {
    const start = world.rooms.length > 0 ? roomCenter(world.rooms[0]) : null;
    const lucky = world.rooms.map(() => random() < CHEST_CHANCE);
    if (world.rooms.length > 0 && !lucky.includes(true)) {
        lucky[randomInt(0, world.rooms.length - 1)] = true;
    }

    world.rooms.forEach((room, i) => {
        if (!lucky[i]) return;
        const row = room.y;
        const spots = [];
        for (let col = room.x + 1; col < room.x + room.w - 1; col++) {
            const wallAbove = world.isWall(col, row - 1) && !world.isFloor(col, row - 1);
            const torchAbove = world.torches.some(t => t.col === col && t.row === row - 1);
            const isStart = start && start[0] === col && start[1] === row;
            if (wallAbove && !torchAbove && !isStart) spots.push(col);
        }
        if (spots.length === 0) return;
        const col = spots[randomInt(0, spots.length - 1)];
        world.chests.push(new Chest(col, row, rollChestReward(random, randomInt)));
    });
}

/**
 * Picks what a chest holds, using the weights in CHEST_LOOT.
 * @param {function(): number} random - Random number source.
 * @param {function(number, number): number} randomInt - Random whole number in a range.
 * @returns {Object} {kind: "gold", amount} or {kind: "item", id}.
 */
export function rollChestReward(random, randomInt) {
    const total = CHEST_LOOT.reduce((sum, loot) => sum + loot.weight, 0);
    let pick = random() * total;
    let loot = CHEST_LOOT[CHEST_LOOT.length - 1];
    for (const option of CHEST_LOOT) {
        if (pick < option.weight) {
            loot = option;
            break;
        }
        pick -= option.weight;
    }
    if (loot.kind === "gold") {
        return { kind: "gold", amount: randomInt(CHEST_GOLD.min, CHEST_GOLD.max) };
    }
    return { kind: "item", id: loot.items[randomInt(0, loot.items.length - 1)] };
}
