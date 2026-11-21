import { WALL_SOURCE_TILE } from "./worldGenerator.js";

/**
 * Solid wall shapes for a World, matching how the walls are drawn.
 * Each wall tile is solid only where its wall pieces are opaque, so collisions
 * line up with the visible wall (including the front face of a room's top wall)
 * instead of the whole tile. Model only: no drawing.
 */
export class WallCollider {
    /**
     * @param {World} world - World whose wall layer is solid.
     * @param {number} tileSize - Size of one tile in world pixels.
     */
    constructor(world, tileSize) {
        this.world = world;
        this.tileSize = tileSize;
        this.unit = tileSize / WALL_SOURCE_TILE;

        // Vault gates: each is {tiles: [[col, row], ...], closed: boolean}. A closed
        // gate's tiles are fully solid, so the player, enemies, and every spell or
        // projectile that checks walls is stopped by it.
        this.gates = [];
    }

    /**
     * Adds a gate whose tiles are solid while gate.closed is true.
     * @param {Object} gate - Object with tiles [[col, row], ...] and a closed flag.
     */
    addGate(gate) {
        this.gates.push(gate);
    }

    /** @returns {boolean} True if a closed gate covers the tile. */
    gateBlocks(col, row) {
        return this.gates.some(gate => gate.closed
            && gate.tiles.some(([c, r]) => c === col && r === row));
    }

    /**
     * The solid rectangles of one tile: the opaque parts of each wall piece drawn there.
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {Object[]} Rectangles as {x, y, w, h} in world pixels; empty if not a wall.
     */
    solidRects(col, row) {
        const left = col * this.tileSize;
        const top = row * this.tileSize;
        const unit = this.unit;
        if (this.gateBlocks(col, row)) {
            return [{ x: left, y: top, w: this.tileSize, h: this.tileSize }];
        }
        return this.world.wallPieces(col, row).flatMap(piece => piece.rects.map(rect => ({
            x: left + rect.x * unit,
            y: top + rect.y * unit,
            w: rect.w * unit,
            h: rect.h * unit
        })));
    }

    /**
     * Finds every solid rectangle that overlaps a box. Touching edges do not count.
     * @param {Object} box - {x, y, w, h} in world pixels.
     * @returns {Object[]} Overlapping solid rectangles.
     */
    hits(box) {
        const size = this.tileSize;
        const firstCol = Math.floor(box.x / size);
        const lastCol = Math.floor((box.x + box.w) / size);
        const firstRow = Math.floor(box.y / size);
        const lastRow = Math.floor((box.y + box.h) / size);

        const found = [];
        for (let row = firstRow; row <= lastRow; row++) {
            for (let col = firstCol; col <= lastCol; col++) {
                for (const rect of this.solidRects(col, row)) {
                    if (box.x < rect.x + rect.w && rect.x < box.x + box.w
                            && box.y < rect.y + rect.h && rect.y < box.y + box.h) {
                        found.push(rect);
                    }
                }
            }
        }
        return found;
    }

    /**
     * @param {number} x - World x-coordinate.
     * @param {number} y - World y-coordinate.
     * @returns {boolean} True if the point is inside a wall.
     */
    blocksPoint(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.solidRects(col, row).some(rect =>
            x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h);
    }

    /**
     * How far a straight line can travel before entering a wall.
     * Samples every couple of pixels, which is finer than any wall band.
     * @param {number} x - Start x-coordinate.
     * @param {number} y - Start y-coordinate.
     * @param {number[]} direction - Unit vector [dx, dy].
     * @param {number} maxDistance - Longest distance to check.
     * @returns {number} Distance to the first wall, or maxDistance if the line is clear.
     */
    castRay(x, y, direction, maxDistance) {
        const step = 2;
        for (let distance = 0; distance <= maxDistance; distance += step) {
            if (this.blocksPoint(x + direction[0] * distance, y + direction[1] * distance)) {
                return Math.max(0, distance - step);
            }
        }
        return maxDistance;
    }
}
