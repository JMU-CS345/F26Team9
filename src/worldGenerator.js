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
