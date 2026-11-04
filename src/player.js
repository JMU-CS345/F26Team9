/**
 * Represents the player-controlled character in MageQuest.
 * Extends Entity to inherit position, movement, and size.
 */
class Player extends Entity {
    /**
     * Creates a new player at the specified position.
     * @param {number} x - Starting x-coordinate.
     * @param {number} y - Starting y-coordinate.
     */
    constructor(x, y) {
        // Initialize the Entity properties.
        super(x, y, 32, 3);
    }

    /**
     * Handles keyboard input for player movement.
     * Uses WASD keys to determine movement direction.
     *
     * @param {number} canvasWidth - Width of the game canvas.
     * @param {number} canvasHeight - Height of the game canvas.
     */
    handleInput(canvasWidth, canvasHeight) {
        // Initialize movement directions.
        let dx = 0;
        let dy = 0;

        // Check horizontal movement.
        if (keyIsDown(65)) dx -= 1; // A - Left
        if (keyIsDown(68)) dx += 1; // D - Right

        // Check vertical movement.
        if (keyIsDown(87)) dy -= 1; // W - Up
        if (keyIsDown(83)) dy += 1; // S - Down

        // Call the inherited move() method from Entity.
        this.move(dx, dy, canvasWidth, canvasHeight);
    }

    /**
     * Draws the player on the canvas.
     * Overrides the display() method from Entity.
     */
    display() {
        // Draw the player as a purple rectangle.
        fill(100, 50, 200);
        rect(this.x, this.y, this.size, this.size);
    }
}
