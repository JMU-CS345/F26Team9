/**
 * Solid wall shapes for a World, matching how the walls are drawn.
 * Each wall tile is a thin band through the tile's center with an arm reaching
 * toward each neighboring wall, so collisions line up with the visible wall
 * instead of the whole tile. Model only: no drawing.
 */
export class WallCollider {
    // In wall-tiles.png the wall band covers pixels 9 to 15 of each 25-pixel tile.
    static SOURCE_TILE = 25;
    static BAND_START = 9;
    static BAND_END = 16;

    /**
     * @param {World} world - World whose wall layer is solid.
     * @param {number} tileSize - Size of one tile in world pixels.
     */
    constructor(world, tileSize) {
        this.world = world;
        this.tileSize = tileSize;
        const unit = tileSize / WallCollider.SOURCE_TILE;
        this.bandStart = WallCollider.BAND_START * unit;
        this.bandEnd = WallCollider.BAND_END * unit;
    }

    /**
     * The solid rectangles of one tile: the center square plus an arm toward
     * each orthogonal neighbor that is also a wall.
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {Object[]} Rectangles as {x, y, w, h} in world pixels; empty if not a wall.
     */
    solidRects(col, row) {
        if (!this.world.isWall(col, row)) return [];
        const left = col * this.tileSize;
        const top = row * this.tileSize;
        const size = this.tileSize;
        const start = this.bandStart;
        const end = this.bandEnd;
        const band = end - start;
        const mask = this.world.wallMask(col, row);

        const rects = [{ x: left + start, y: top + start, w: band, h: band }];
        if (mask & 1) rects.push({ x: left + start, y: top, w: band, h: start });
        if (mask & 2) rects.push({ x: left + end, y: top + start, w: size - end, h: band });
        if (mask & 4) rects.push({ x: left + start, y: top + end, w: band, h: size - end });
        if (mask & 8) rects.push({ x: left, y: top + start, w: start, h: band });
        return rects;
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
