/**
 * Represents a general entity in MageQuest.
 * Stores common properties and handles basic movement.
 */
class Entity {
    /**
     * Creates a new entity.
     * @param {number} x - Starting x-coordinate.
     * @param {number} y - Starting y-coordinate.
     * @param {number} size - Width and height of the entity.
     * @param {number} speed - Movement speed of the entity.
     */
    constructor(x, y, size = 32, speed = 3) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
    }

    /**
     * Moves the entity in the specified direction.
     * Prevents movement outside the canvas boundaries.
     *
     * @param {number} dx - Horizontal movement direction.
     * @param {number} dy - Vertical movement direction.
     * @param {number} canvasWidth - Width of the game canvas.
     * @param {number} canvasHeight - Height of the game canvas.
     */
    move(dx, dy, canvasWidth, canvasHeight) {
        // Normalize diagonal movement so it is not faster.
        if (dx !== 0 && dy !== 0) {
            dx /= Math.sqrt(2);
            dy /= Math.sqrt(2);
        }

        // Update the entity's position.
        this.x += dx * this.speed;
        this.y += dy * this.speed;

        // Keep the entity within the canvas boundaries.
        this.x = Math.max(0, Math.min(this.x, canvasWidth - this.size));
        this.y = Math.max(0, Math.min(this.y, canvasHeight - this.size));
    }

    /**
     * Draws the entity on the canvas.
     * Can be overridden by subclasses to use different appearances.
     */
    display() {
        // Draw the entity as a gray rectangle by default.
        fill(150);
        rect(this.x, this.y, this.size, this.size);
    }
}
