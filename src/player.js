import { Entity } from "./entity.js";

/**
 * Represents the player-controlled character in MageQuest.
 * Uses Entity's shared movement, facing, and animation methods.
 */
export class Player extends Entity {
    /**
     * Creates a player at the given position.
     * @param {number} x - Starting x-coordinate.
     * @param {number} y - Starting y-coordinate.
     * @param {Object} sprites - Optional directional sprite frames.
     */
    constructor(x, y, sprites = {}) {
        super(x, y, 32, 2, sprites);
        this.placeholderColor = [100, 50, 200];
    }

    /**
     * Converts WASD keyboard input into movement.
     * Opposite keys cancel each other's components.
     *
     * @param {number} canvasWidth - Width of the game canvas.
     * @param {number} canvasHeight - Height of the game canvas.
     */
    handleInput(canvasWidth, canvasHeight) {
        let dx = 0;
        let dy = 0;

        if (keyIsDown(65)) dx--; // A: left
        if (keyIsDown(68)) dx++; // D: right
        if (keyIsDown(87)) dy--; // W: up
        if (keyIsDown(83)) dy++; // S: down

        // p5.js reports elapsed milliseconds since the previous draw().
        // Convert to 60 FPS frames for consistent movement on different PCs.
        const frameScale = (typeof deltaTime === "number" && deltaTime > 0)
            ? Math.min(deltaTime / (1000 / 60), 3) : 1;
        this.moveSmooth(dx, dy, canvasWidth, canvasHeight, frameScale);
    }
}
