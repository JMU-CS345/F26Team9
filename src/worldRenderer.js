import { FLOOR, WALL, WALL_SHEET_COLS, WALL_ROWS_PER_MATERIAL } from "./worldGenerator.js";

/**
 * Draws a World's tile layers: floor first, then walls on top.
 * The world does not change while playing, so it is drawn once into an
 * offscreen image and that image is copied to the canvas each frame.
 * View only: reads the world but never changes it.
 */
export class WorldRenderer {
    // Size of one tile in the sprite sheets, in pixels.
    static SOURCE_TILE = 25;

    // Tiles per row in the floor sheet.
    static FLOOR_SHEET_COLS = 8;

    // Darkness (0-255) of the shadow a wall casts on the floor beside it, one
    // value per sheet pixel moving away from the wall. Front faces cast a longer
    // shadow than the thin tops of side walls, which makes the walls stand out.
    static FACE_SHADOW = [120, 95, 70, 50, 32, 18, 8];
    static SIDE_SHADOW = [90, 55, 28, 10];

    /**
     * @param {p5.Image} floorSheet - floor-tiles.png: one material per row.
     * @param {p5.Image} wallSheet - wall_tiles_final.png: 12 tiles per material.
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
                // Only real floor: the space behind a wall stays dark.
                const floor = world.floor.get(col, row);
                if (floor !== FLOOR.EMPTY) {
                    this.drawTile(this.floorSheet, WorldRenderer.FLOOR_SHEET_COLS, floor, col, row);
                    this.drawWallShadows(world, col, row);
                }
            }
        }

        for (let row = 0; row < world.rows; row++) {
            for (let col = 0; col < world.cols; col++) {
                const wall = world.walls.get(col, row);
                if (wall === WALL.NONE) continue;
                const materialOffset = (wall - 1) * WALL_ROWS_PER_MATERIAL * WALL_SHEET_COLS;
                for (const piece of world.wallPieces(col, row)) {
                    this.drawTile(this.wallSheet, WALL_SHEET_COLS, materialOffset + piece.index, col, row);
                }
            }
        }
    }

    /**
     * Darkens the edges of a floor tile that touch a wall, as if the wall casts a shadow.
     * @param {World} world - World being drawn.
     * @param {number} col - Column of the floor tile.
     * @param {number} row - Row of the floor tile.
     */
    drawWallShadows(world, col, row) {
        const size = this.tileSize;
        const unit = size / WorldRenderer.SOURCE_TILE;
        const left = col * size;
        const top = row * size;
        const g = this.cache;
        g.noStroke();

        const shade = (steps, band) => {
            steps.forEach((alpha, i) => {
                g.fill(0, alpha);
                band(i * unit, unit);
            });
        };
        // A wall above shows its front face, so it casts the longest shadow.
        if (world.isWall(col, row - 1)) {
            shade(WorldRenderer.FACE_SHADOW, (d, w) => g.rect(left, top + d, size, w));
        }
        if (world.isWall(col - 1, row)) {
            shade(WorldRenderer.SIDE_SHADOW, (d, w) => g.rect(left + d, top, w, size));
        }
        if (world.isWall(col + 1, row)) {
            shade(WorldRenderer.SIDE_SHADOW, (d, w) => g.rect(left + size - d - w, top, w, size));
        }
        if (world.isWall(col, row + 1)) {
            shade(WorldRenderer.SIDE_SHADOW, (d, w) => g.rect(left, top + size - d - w, size, w));
        }
    }

    /**
     * Copies one tile from a sheet into the offscreen image.
     * @param {p5.Image} sheet - Sprite sheet to copy from.
     * @param {number} sheetCols - Tiles per row in the sheet.
     * @param {number} index - Tile number in the sheet, read left to right.
     * @param {number} col - Tile column in the world.
     * @param {number} row - Tile row in the world.
     */
    drawTile(sheet, sheetCols, index, col, row) {
        const source = WorldRenderer.SOURCE_TILE;
        const sx = (index % sheetCols) * source;
        const sy = Math.floor(index / sheetCols) * source;
        this.cache.image(sheet, col * this.tileSize, row * this.tileSize,
            this.tileSize, this.tileSize, sx, sy, source, source);
    }

    /** Draws the world onto the canvas. */
    display() {
        if (this.cache) image(this.cache, this.x, this.y);
    }
}
