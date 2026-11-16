import { FLOOR, WALL } from "./worldGenerator.js";

/**
 * Draws a World's tile layers: floor first, then walls on top.
 * The world does not change while playing, so it is drawn once into an
 * offscreen image and that image is copied to the canvas each frame.
 * View only: reads the world but never changes it.
 */
export class WorldRenderer {
    // Size of one tile in the sprite sheets, in pixels.
    static SOURCE_TILE = 25;

    // Tiles per row in both sprite sheets.
    static SHEET_COLS = 8;

    // Wall sheet rows per material: 16 neighbor combinations over 2 rows of 8.
    static WALL_ROWS_PER_MATERIAL = 2;

    /**
     * @param {p5.Image} floorSheet - floor-tiles.png: one material per row.
     * @param {p5.Image} wallSheet - wall-tiles.png: 16 tiles per material.
     * @param {number} tileSize - Drawn size of one tile in pixels.
     */
    constructor(floorSheet, wallSheet, tileSize = WorldRenderer.SOURCE_TILE) {
        this.floorSheet = floorSheet;
        this.wallSheet = wallSheet;
        this.tileSize = tileSize;
        this.cache = null;
        this.x = 0;
        this.y = 0;
    }

    /**
     * Draws a world into the offscreen image. Call again whenever the world changes.
     * @param {World} world - World to draw.
     * @param {number} x - Canvas x-coordinate of the world's top-left corner.
     * @param {number} y - Canvas y-coordinate of the world's top-left corner.
     */
    build(world, x, y) {
        this.x = x;
        this.y = y;
        if (this.cache) this.cache.remove();

        const size = this.tileSize;
        this.cache = createGraphics(world.cols * size, world.rows * size);
        this.cache.noSmooth();

        for (let row = 0; row < world.rows; row++) {
            for (let col = 0; col < world.cols; col++) {
                const floor = world.displayFloor(col, row);
                if (floor !== FLOOR.EMPTY) {
                    this.drawTile(this.floorSheet, floor, col, row);
                }
            }
        }

        for (let row = 0; row < world.rows; row++) {
            for (let col = 0; col < world.cols; col++) {
                const wall = world.walls.get(col, row);
                if (wall === WALL.NONE) continue;
                const materialOffset = (wall - 1) * WorldRenderer.WALL_ROWS_PER_MATERIAL
                    * WorldRenderer.SHEET_COLS;
                this.drawTile(this.wallSheet, materialOffset + world.wallMask(col, row), col, row);
            }
        }
    }

    /**
     * Copies one tile from a sheet into the offscreen image.
     * @param {p5.Image} sheet - Sprite sheet to copy from.
     * @param {number} index - Tile number in the sheet, read left to right.
     * @param {number} col - Tile column in the world.
     * @param {number} row - Tile row in the world.
     */
    drawTile(sheet, index, col, row) {
        const source = WorldRenderer.SOURCE_TILE;
        const sx = (index % WorldRenderer.SHEET_COLS) * source;
        const sy = Math.floor(index / WorldRenderer.SHEET_COLS) * source;
        this.cache.image(sheet, col * this.tileSize, row * this.tileSize,
            this.tileSize, this.tileSize, sx, sy, source, source);
    }

    /** Draws the world onto the canvas. */
    display() {
        if (this.cache) image(this.cache, this.x, this.y);
    }
}
