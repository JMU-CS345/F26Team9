/**
 * Represents an entity in MageQuest.
 * Shares movement, eight-direction facing, animation, and drawing behavior.
 */
export class Entity {
    /**
     * Creates an entity.
     * @param {number} x - Starting x-coordinate.
     * @param {number} y - Starting y-coordinate.
     * @param {number} size - Width and height of the entity's space.
     * @param {number} speed - Movement speed in pixels per frame.
     * @param {Object} sprites - Optional sprites indexed by direction.
     *   Each direction can contain a single image or [standing, walking].
     */
    constructor(x, y, size = 32, speed = 3, sprites = {}) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.sprites = sprites;

        // Used by moveSmooth(). Each value is based on a 60 FPS update.
        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.75; // Speed gained per update while holding a key.
        this.friction = 0.25;     // Portion of speed removed per update when released.

        // South shows the character's front; north shows its back.
        this.direction = "south";
        this.isMoving = false;
        this.walkFrame = 0;
        this.animationTick = 0;
        this.animationDelay = 8; // Switch poses after eight movement updates.

        // Default appearance when there is no directional artwork.
        this.placeholderColor = [150, 150, 150];

        // Part of the entity's square that collides with walls, relative to x and y.
        this.hitbox = { x: 0, y: 0, w: size, h: size };
    }

    /**
     * The entity's collision box at its current position.
     * @returns {Object} {x, y, w, h} in world pixels.
     */
    getHitbox() {
        return {
            x: this.x + this.hitbox.x,
            y: this.y + this.hitbox.y,
            w: this.hitbox.w,
            h: this.hitbox.h
        };
    }

    /**
     * Pushes the entity back out of any wall it moved into along one axis,
     * leaving it flush against the wall, and stops its velocity on that axis.
     * @param {WallCollider} walls - Solid walls to collide with.
     * @param {string} axis - "x" or "y".
     * @param {number} delta - How far the entity just moved on that axis.
     */
    resolveWalls(walls, axis, delta) {
        if (delta === 0) return;
        const hits = walls.hits(this.getHitbox());
        if (hits.length === 0) return;

        const offset = axis === "x" ? this.hitbox.x : this.hitbox.y;
        const length = axis === "x" ? this.hitbox.w : this.hitbox.h;
        const size = axis === "x" ? "w" : "h";
        if (delta > 0) {
            // Moving right/down: stop at the nearest wall's near side.
            const edge = Math.min(...hits.map(rect => rect[axis]));
            this[axis] = edge - offset - length;
        } else {
            // Moving left/up: stop at the nearest wall's far side.
            const edge = Math.max(...hits.map(rect => rect[axis] + rect[size]));
            this[axis] = edge - offset;
        }
        if (axis === "x") this.vx = 0;
        else this.vy = 0;
    }

    /**
     * Updates the entity's facing direction based on movement.
     * A zero vector leaves the direction unchanged.
     *
     * @param {number} dx - Horizontal movement direction.
     * @param {number} dy - Vertical movement direction.
     */
    updateDirection(dx, dy) {
        if (dx === 0 && dy === 0) return;

        // The canvas y-coordinate increases downward.
        const directions = [
            "east", "southeast", "south", "southwest",
            "west", "northwest", "north", "northeast"
        ];
        const angle = Math.atan2(dy, dx);
        const index = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
        this.direction = directions[index];
    }

    /**
     * Updates the two-frame walking cycle.
     * Resets to standing when there was no actual movement.
     *
     * @param {boolean} moved - Whether position changed this update.
     * @param {number} frameScale - Elapsed time measured in 60 FPS frames.
     */
    updateAnimation(moved, frameScale = 1) {
        this.isMoving = moved;

        if (!moved) {
            this.walkFrame = 0;
            this.animationTick = 0;
            return;
        }

        this.animationTick += frameScale;
        if (this.animationTick >= this.animationDelay) {
            this.animationTick -= this.animationDelay;
            this.walkFrame = 1 - this.walkFrame;
        }
    }

    /**
     * Moves the entity, normalizing speed and keeping it inside the canvas.
     * The facing direction follows the requested nonzero movement vector,
     * even if a boundary prevents movement in that direction.
     *
     * @param {number} dx - Horizontal movement direction.
     * @param {number} dy - Vertical movement direction.
     * @param {number} canvasWidth - Width of the game canvas.
     * @param {number} canvasHeight - Height of the game canvas.
     */
    move(dx, dy, canvasWidth, canvasHeight) {
        const oldX = this.x;
        const oldY = this.y;
        const length = Math.hypot(dx, dy);

        if (length > 0) {
            this.updateDirection(dx, dy);

            // Dividing by length prevents faster diagonal movement.
            this.x += dx / length * this.speed;
            this.y += dy / length * this.speed;
        }

        // Keep the top-left corner in the playable area.
        this.x = Math.max(0, Math.min(this.x, Math.max(0, canvasWidth - this.size)));
        this.y = Math.max(0, Math.min(this.y, Math.max(0, canvasHeight - this.size)));

        this.updateAnimation(length > 0 && (this.x !== oldX || this.y !== oldY));
    }

    /**
     * Moves using acceleration and friction instead of instant full speed.
     * This is optional: enemies may still use move() for immediate movement.
     *
     * @param {number} dx - Horizontal input direction.
     * @param {number} dy - Vertical input direction.
     * @param {number} canvasWidth - Width of the canvas.
     * @param {number} canvasHeight - Height of the canvas.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     * @param {WallCollider|null} walls - Optional walls that block movement.
     */
    moveSmooth(dx, dy, canvasWidth, canvasHeight, frameScale = 1, walls = null) {
        // Restrict large frame jumps (for example, after changing browser tabs).
        frameScale = Number.isFinite(frameScale)
            ? Math.max(0, Math.min(frameScale, 3)) : 1;

        const length = Math.hypot(dx, dy);
        if (length > 0) {
            // Normalize the input so diagonal acceleration is not stronger.
            this.vx += dx / length * this.acceleration * frameScale;
            this.vy += dy / length * this.acceleration * frameScale;
        } else {
            // Friction is a fraction removed every 60 FPS update.
            const slowdown = Math.pow(1 - this.friction, frameScale);
            this.vx *= slowdown;
            this.vy *= slowdown;
        }

        // Never exceed the player's configured base (maximum) speed.
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > this.speed) {
            this.vx = this.vx / currentSpeed * this.speed;
            this.vy = this.vy / currentSpeed * this.speed;
        }

        // Avoid tiny movements that would otherwise continue indefinitely.
        if (length === 0 && Math.hypot(this.vx, this.vy) < 0.06) {
            this.vx = 0;
            this.vy = 0;
        }

        const oldX = this.x;
        const oldY = this.y;
        const maxX = Math.max(0, canvasWidth - this.size);
        const maxY = Math.max(0, canvasHeight - this.size);
        const nextX = this.x + this.vx * frameScale;
        const nextY = this.y + this.vy * frameScale;

        // Collision stops the velocity in the blocked direction only.
        // Resolving x before y lets the entity slide along walls instead of sticking.
        this.x = Math.max(0, Math.min(nextX, maxX));
        if (this.x !== nextX) this.vx = 0;
        if (walls) this.resolveWalls(walls, "x", this.x - oldX);

        this.y = Math.max(0, Math.min(nextY, maxY));
        if (this.y !== nextY) this.vy = 0;
        if (walls) this.resolveWalls(walls, "y", this.y - oldY);

        const movedX = this.x - oldX;
        const movedY = this.y - oldY;
        const moved = movedX !== 0 || movedY !== 0;

        if (moved) {
            // Follow the actual direction of motion, even while coasting.
            this.updateDirection(movedX, movedY);
        } else if (length > 0) {
            // Still face the intended direction when pushing into a wall.
            this.updateDirection(dx, dy);
        }

        this.updateAnimation(moved, frameScale);
    }

    /**
     * Fully stops momentum and animation without changing facing direction.
     * Menus use this to prevent drifting when gameplay resumes.
     */
    stop() {
        this.vx = 0;
        this.vy = 0;
        this.updateAnimation(false);
    }

    /**
     * Returns the image for the current direction and walking frame.
     * Entities with only one image per direction also work.
     *
     * @returns {Object|undefined} Current sprite image, if available.
     */
    getCurrentSprite() {
        const frames = this.sprites[this.direction];
        if (Array.isArray(frames)) {
            return frames[this.walkFrame] || frames[0];
        }
        return frames;
    }

    /**
     * Draws the current sprite without stretching it.
     * Falls back to a rectangle if no sprite exists.
     */
    display() {
        const sprite = this.getCurrentSprite();
        push();

        if (sprite && sprite.width > 0 && sprite.height > 0) {
            const scale = Math.min(this.size / sprite.width,
                                   this.size / sprite.height);
            const drawWidth = sprite.width * scale;
            const drawHeight = sprite.height * scale;
            const drawX = this.x + (this.size - drawWidth) / 2;
            const drawY = this.y + (this.size - drawHeight) / 2;

            imageMode(CORNER);
            image(sprite, drawX, drawY, drawWidth, drawHeight);
        } else {
            fill(...this.placeholderColor);
            rect(this.x, this.y, this.size, this.size);
        }

        pop();
    }
}
