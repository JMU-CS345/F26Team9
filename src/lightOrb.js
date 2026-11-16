/**
 * A small glowing orb that floats around the player and lights the way.
 * It circles slowly above the player's shoulder, trails behind when the player
 * moves, and bobs up and down. It is emissive: draw it after the lighting pass.
 */
export class LightOrb {
    // Size of the circle the orb follows around the player, and how high it floats.
    static ORBIT_X = 30;
    static ORBIT_Y = 12;
    static HEIGHT = 34;

    // Radians the orb moves around its orbit per 60 FPS frame.
    static ORBIT_SPEED = 0.02;

    // Fraction of the remaining distance closed each frame; lower trails further.
    static FOLLOW = 0.08;

    static LIGHT_RADIUS = 260;

    // Radius of the drawn glow around the orb, in world pixels.
    static HALO_RADIUS = 20;
    static LIGHT_COLOR = [1.0, 0.85, 0.6];

    /**
     * @param {number} x - Starting x-coordinate.
     * @param {number} y - Starting y-coordinate.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.age = 0;
    }

    /**
     * Moves the orb toward its spot on the orbit around a target entity.
     * @param {Entity} target - Entity to float around.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(target, frameScale) {
        this.age += frameScale;
        this.angle += LightOrb.ORBIT_SPEED * frameScale;

        const goalX = target.x + target.size / 2 + Math.cos(this.angle) * LightOrb.ORBIT_X;
        const goalY = target.y + target.size / 2 - LightOrb.HEIGHT
            + Math.sin(this.angle) * LightOrb.ORBIT_Y;

        // Same smoothing at any frame rate: close FOLLOW of the gap per 60 FPS frame.
        const blend = 1 - Math.pow(1 - LightOrb.FOLLOW, frameScale);
        this.x += (goalX - this.x) * blend;
        this.y += (goalY - this.y) * blend;
    }

    /** @returns {number} The orb's drawn y-coordinate, including its bob. */
    get drawY() {
        return this.y + Math.sin(this.age * 0.06) * 4;
    }

    /**
     * The orb's light, flickering gently like a flame.
     * @returns {Object[]} Lights as {x, y, radius, color}.
     */
    getLights() {
        const flicker = 1 + 0.05 * Math.sin(this.age * 0.13) + 0.03 * Math.sin(this.age * 0.41);
        return [{
            x: this.x,
            y: this.drawY,
            radius: LightOrb.LIGHT_RADIUS * flicker,
            color: LightOrb.LIGHT_COLOR
        }];
    }

    /** Draws a soft halo with a bright core. */
    display() {
        push();
        noStroke();
        translate(this.x, this.drawY);

        // One smooth radial gradient for the halo. Stacked translucent circles
        // show as visible rings, especially when the camera is zoomed in.
        // Alpha falls off with the square of the distance, like the light itself.
        const halo = drawingContext.createRadialGradient(0, 0, 0, 0, 0, LightOrb.HALO_RADIUS);
        for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            const alpha = 0.6 * (1 - t) * (1 - t);
            halo.addColorStop(t, `rgba(255, 215, 150, ${alpha.toFixed(3)})`);
        }
        drawingContext.fillStyle = halo;
        drawingContext.beginPath();
        drawingContext.arc(0, 0, LightOrb.HALO_RADIUS, 0, Math.PI * 2);
        drawingContext.fill();

        fill(255, 236, 190);
        circle(0, 0, 11);
        fill(255);
        circle(0, 0, 5);
        pop();
    }
}
