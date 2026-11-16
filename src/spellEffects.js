/**
 * Visual spell effects. Each effect updates itself, reports the lights it gives off,
 * and draws itself. Effects are emissive: they are drawn after the lighting pass
 * so darkness never dims them, while their lights brighten the world around them.
 */

// Unit vectors for the eight facing directions used by Entity.
const DIAGONAL = Math.SQRT1_2;
export const DIRECTION_VECTORS = {
    east: [1, 0],
    southeast: [DIAGONAL, DIAGONAL],
    south: [0, 1],
    southwest: [-DIAGONAL, DIAGONAL],
    west: [-1, 0],
    northwest: [-DIAGONAL, -DIAGONAL],
    north: [0, -1],
    northeast: [DIAGONAL, -DIAGONAL]
};

/**
 * Small, slow wobble around 1, used to make lights waver like flames.
 * The waves repeat every ~40 and ~17 frames; anything near the frame rate
 * reads as strobing instead of a flame. Deterministic so tests are repeatable.
 * @param {number} t - Time in 60 FPS frames.
 * @returns {number} Multiplier between about 0.92 and 1.08.
 */
function flicker(t) {
    return 1 + 0.05 * Math.sin(t * 0.15) + 0.03 * Math.sin(t * 0.37);
}

/**
 * Scales a color by a brightness factor.
 * @param {number[]} color - [r, g, b] from 0 to 1.
 * @param {number} amount - Brightness factor.
 * @returns {number[]} Scaled color.
 */
function scaleColor(color, amount) {
    return color.map(c => c * amount);
}

/** A grid of equally sized animation frames in one image, read left to right. */
export class SpriteSheet {
    /**
     * @param {p5.Image} image - Loaded sprite sheet.
     * @param {number} cols - Number of frame columns.
     * @param {number} rows - Number of frame rows.
     */
    constructor(image, cols, rows) {
        this.image = image;
        this.cols = cols;
        this.rows = rows;
    }

    /** @returns {number} Total number of frames. */
    get frameCount() {
        return this.cols * this.rows;
    }

    /**
     * Draws one frame centered at the current origin.
     * @param {number} index - Frame number, wrapped to the sheet's size.
     * @param {number} w - Drawn width.
     * @param {number} h - Drawn height.
     */
    drawFrame(index, w, h) {
        const frame = ((Math.floor(index) % this.frameCount) + this.frameCount) % this.frameCount;
        const frameWidth = this.image.width / this.cols;
        const frameHeight = this.image.height / this.rows;
        const sx = (frame % this.cols) * frameWidth;
        const sy = Math.floor(frame / this.cols) * frameHeight;
        image(this.image, -w / 2, -h / 2, w, h, sx, sy, frameWidth, frameHeight);
    }
}

/**
 * A bolt that weaves along a wavy path, shedding sparks, then explodes when it
 * reaches its range or leaves the canvas. Uses the fireball sheet layout:
 * frames 12-27 loop while flying and frames 28-39 play the explosion.
 */
export class Projectile {
    static TRAVEL_FIRST = 12;
    static TRAVEL_COUNT = 16;
    static EXPLODE_FIRST = 28;
    static EXPLODE_COUNT = 12;

    // 60 FPS frames each animation frame stays on screen.
    static FRAME_TIME = 3;

    // Distances back along the path for the dimmer trailing lights, and their brightness.
    static TRAIL_LIGHTS = [{ behind: 16, strength: 0.55 }, { behind: 34, strength: 0.3 }];

    // Sparks shed per 60 FPS frame, and how long each one lives.
    static SPARK_RATE = 1.5;
    static SPARK_LIFE = 24;

    /**
     * @param {number} x - Starting x-coordinate (center).
     * @param {number} y - Starting y-coordinate (center).
     * @param {number[]} direction - Unit vector [dx, dy] to travel along.
     * @param {Object} style - {sheet, lightColor, sparkColor, speed, range, lightRadius,
     *   wobble: {amplitude, wavelength}} with sparkColor as 0-255 RGB.
     */
    constructor(x, y, direction, style) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.dx = direction[0];
        this.dy = direction[1];
        this.style = style;
        this.wobble = style.wobble || { amplitude: 0, wavelength: 1 };
        this.angle = Math.atan2(this.dy, this.dx);
        this.age = 0;
        this.traveled = 0;
        this.explodeAge = -1;
        this.done = false;
        this.sparks = [];
        this.sparkTimer = 0;
    }

    /** @returns {boolean} True once the bolt has hit something. */
    get exploding() {
        return this.explodeAge >= 0;
    }

    /**
     * Position on the wavy path after traveling a given distance.
     * The path is a sine wave across the direction of travel, starting on the
     * straight line so the bolt leaves the caster's hand cleanly.
     * @param {number} distance - Distance traveled along the direction.
     * @returns {number[]} Position as [x, y].
     */
    pathPoint(distance) {
        const { amplitude, wavelength } = this.wobble;
        const side = amplitude * Math.sin((distance / wavelength) * Math.PI * 2);
        // (-dy, dx) is the direction vector turned 90 degrees.
        return [
            this.startX + this.dx * distance - this.dy * side,
            this.startY + this.dy * distance + this.dx * side
        ];
    }

    /**
     * Moves the bolt or advances its explosion, and updates its sparks.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     * @param {number} w - Canvas width.
     * @param {number} h - Canvas height.
     * @param {WallCollider|null} walls - Optional walls the bolt explodes against.
     */
    update(frameScale, w, h, walls = null) {
        this.age += frameScale;
        this.updateSparks(frameScale);

        if (this.exploding) {
            this.explodeAge += frameScale;
            const finished = this.explodeAge >= Projectile.EXPLODE_COUNT * Projectile.FRAME_TIME;
            // Stay alive until the last spark fades so the trail does not vanish.
            if (finished && this.sparks.length === 0) this.done = true;
            return;
        }

        const previousX = this.x;
        const previousY = this.y;
        this.traveled += this.style.speed * frameScale;
        [this.x, this.y] = this.pathPoint(this.traveled);

        // Face along the curve: the path's slope is the direction plus the wave's slope.
        const { amplitude, wavelength } = this.wobble;
        const phase = (this.traveled / wavelength) * Math.PI * 2;
        const slope = amplitude * (Math.PI * 2 / wavelength) * Math.cos(phase);
        this.angle = Math.atan2(this.dy + this.dx * slope, this.dx - this.dy * slope);

        this.emitSparks(frameScale);

        const outside = this.x < 0 || this.y < 0 || this.x > w || this.y > h;
        const hitWall = walls !== null && this.hitsWall(walls, previousX, previousY);
        if (this.traveled >= this.style.range || outside || hitWall) {
            // Explode on the edge, not past it, so the blast stays visible.
            this.x = Math.max(0, Math.min(this.x, w));
            this.y = Math.max(0, Math.min(this.y, h));
            this.explodeAge = 0;
        }
    }

    /**
     * Checks the whole step from the previous position, every 2 pixels, so a fast
     * bolt cannot skip over a thin wall between frames. The starting point is
     * checked too, so a bolt that starts inside a wall explodes at once. On a hit,
     * the bolt moves back to the point where it entered the wall.
     * @param {WallCollider} walls - Walls to check.
     * @param {number} fromX - Position before this step.
     * @param {number} fromY - Position before this step.
     * @returns {boolean} True if the step entered a wall.
     */
    hitsWall(walls, fromX, fromY) {
        const steps = Math.max(1, Math.ceil(Math.hypot(this.x - fromX, this.y - fromY) / 2));
        for (let i = 0; i <= steps; i++) {
            const px = fromX + (this.x - fromX) * (i / steps);
            const py = fromY + (this.y - fromY) * (i / steps);
            if (walls.blocksPoint(px, py)) {
                this.x = px;
                this.y = py;
                return true;
            }
        }
        return false;
    }

    /**
     * Sheds sparks at the bolt's position. They drift backward and spread sideways.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    emitSparks(frameScale) {
        this.sparkTimer += Projectile.SPARK_RATE * frameScale;
        while (this.sparkTimer >= 1) {
            this.sparkTimer--;
            const back = 0.3 + Math.random() * 0.6;
            const spread = (Math.random() - 0.5) * 0.8;
            this.sparks.push({
                x: this.x + (Math.random() - 0.5) * 3,
                y: this.y + (Math.random() - 0.5) * 3,
                vx: -this.dx * back - this.dy * spread,
                vy: -this.dy * back + this.dx * spread,
                age: 0,
                life: Projectile.SPARK_LIFE * (0.6 + Math.random() * 0.4),
                size: 1 + Math.random() * 1.2
            });
        }
    }

    /**
     * Moves sparks, slows them with drag, and removes faded ones.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    updateSparks(frameScale) {
        const drag = Math.pow(0.93, frameScale);
        for (const spark of this.sparks) {
            spark.x += spark.vx * frameScale;
            spark.y += spark.vy * frameScale;
            spark.vx *= drag;
            spark.vy *= drag;
            spark.age += frameScale;
        }
        this.sparks = this.sparks.filter(spark => spark.age < spark.life);
    }

    /**
     * While flying: a flickering light on the bolt plus dimmer lights back along
     * its path for a glowing trail. While exploding: a bright flash that grows and fades.
     * @returns {Object[]} Lights as {x, y, radius, color}.
     */
    getLights() {
        const { lightColor, lightRadius } = this.style;
        if (!this.exploding) {
            const lights = [{
                x: this.x, y: this.y, radius: lightRadius * flicker(this.age), color: lightColor
            }];
            for (const trail of Projectile.TRAIL_LIGHTS) {
                // Fade trail lights in over the first stretch so they never sit behind the caster.
                const distance = this.traveled - trail.behind;
                if (distance <= 0) continue;
                const fadeIn = Math.min(distance / trail.behind, 1);
                const [x, y] = this.pathPoint(distance);
                lights.push({
                    x, y,
                    radius: lightRadius * (0.4 + 0.4 * trail.strength),
                    color: scaleColor(lightColor, trail.strength * fadeIn)
                });
            }
            return lights;
        }
        const duration = Projectile.EXPLODE_COUNT * Projectile.FRAME_TIME;
        const t = Math.min(this.explodeAge / duration, 1);
        return [{
            x: this.x,
            y: this.y,
            radius: lightRadius * (1 + 1.2 * Math.sin(Math.PI * Math.min(t * 1.5, 1))),
            color: scaleColor(lightColor, 1.6 * (1 - t))
        }];
    }

    /** Draws the sparks, then the bolt's current frame turned to follow its path. */
    display() {
        this.displaySparks();

        const explodeEnd = Projectile.EXPLODE_FIRST + Projectile.EXPLODE_COUNT;
        if (this.exploding && this.explodeAge / Projectile.FRAME_TIME >= Projectile.EXPLODE_COUNT) {
            return;
        }
        const frame = this.exploding
            ? Math.min(Projectile.EXPLODE_FIRST + this.explodeAge / Projectile.FRAME_TIME,
                explodeEnd - 1)
            : Projectile.TRAVEL_FIRST
                + (this.age / Projectile.FRAME_TIME) % Projectile.TRAVEL_COUNT;

        push();
        translate(this.x, this.y);
        rotate(this.angle);
        this.style.sheet.drawFrame(frame, 48, 36);
        pop();
    }

    /** Draws sparks with additive blending so overlapping sparks glow brighter. */
    displaySparks() {
        const [r, g, b] = this.style.sparkColor || [255, 190, 90];
        push();
        noStroke();
        blendMode(ADD);
        for (const spark of this.sparks) {
            const fade = 1 - spark.age / spark.life;
            fill(r, g, b, 255 * fade);
            circle(spark.x, spark.y, spark.size * (0.5 + 0.5 * fade));
        }
        blendMode(BLEND);
        pop();
    }
}

/**
 * A short, flickering lightning bolt between two points with a sparkle where it lands.
 * The jagged path is redrawn every few frames so the bolt crackles.
 */
export class LightningStrike {
    static DURATION = 22;
    static SEGMENTS = 9;
    static LIGHT_COLOR = [0.85, 0.85, 1.0];

    /**
     * @param {number} x1 - Start x-coordinate.
     * @param {number} y1 - Start y-coordinate.
     * @param {number} x2 - End x-coordinate.
     * @param {number} y2 - End y-coordinate.
     * @param {SpriteSheet} sparkle - Sheet played at the impact point.
     */
    constructor(x1, y1, x2, y2, sparkle) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.sparkle = sparkle;
        this.age = 0;
        this.done = false;
        this.points = this.makePath();
        this.pathTick = 0;
    }

    /**
     * Builds a jagged path: points along the straight line, each pushed sideways
     * by a random amount, with the ends left in place.
     * @returns {number[][]} Points as [x, y].
     */
    makePath() {
        const length = Math.hypot(this.x2 - this.x1, this.y2 - this.y1) || 1;
        const nx = -(this.y2 - this.y1) / length;
        const ny = (this.x2 - this.x1) / length;
        const points = [];
        for (let i = 0; i <= LightningStrike.SEGMENTS; i++) {
            const t = i / LightningStrike.SEGMENTS;
            const isEnd = i === 0 || i === LightningStrike.SEGMENTS;
            const jag = isEnd ? 0 : (Math.random() - 0.5) * 12;
            points.push([
                this.x1 + (this.x2 - this.x1) * t + nx * jag,
                this.y1 + (this.y2 - this.y1) * t + ny * jag
            ]);
        }
        return points;
    }

    /**
     * Ages the bolt and re-rolls its path every three frames.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(frameScale) {
        this.age += frameScale;
        if (this.age >= LightningStrike.DURATION) this.done = true;

        if (Math.floor(this.age / 3) !== this.pathTick) {
            this.pathTick = Math.floor(this.age / 3);
            this.points = this.makePath();
        }
    }

    /** @returns {number} Brightness that fades out and strobes on alternate frames. */
    get intensity() {
        const fade = Math.max(0, 1 - this.age / LightningStrike.DURATION);
        const strobe = Math.floor(this.age / 2) % 2 === 0 ? 1 : 0.55;
        return fade * strobe;
    }

    /**
     * Lights at the start, middle, and end of the bolt so its whole length glows.
     * @returns {Object[]} Lights as {x, y, radius, color}.
     */
    getLights() {
        const color = scaleColor(LightningStrike.LIGHT_COLOR, 1.4 * this.intensity);
        return [0, 0.5, 1].map(t => ({
            x: this.x1 + (this.x2 - this.x1) * t,
            y: this.y1 + (this.y2 - this.y1) * t,
            radius: 100,
            color
        }));
    }

    /** Draws a wide faint glow line with a thin bright core, plus the impact sparkle. */
    display() {
        const alpha = 255 * this.intensity;
        push();
        noFill();
        strokeJoin(ROUND);

        stroke(170, 180, 255, alpha * 0.5);
        strokeWeight(3);
        this.drawPath();

        stroke(255, 255, 240, alpha);
        strokeWeight(1);
        this.drawPath();

        translate(this.x2, this.y2);
        this.sparkle.drawFrame(this.age / 2, 22, 22);
        pop();
    }

    /** Draws the bolt's current path as one connected line. */
    drawPath() {
        beginShape();
        for (const [px, py] of this.points) vertex(px, py);
        endShape();
    }
}

/**
 * Rising sparkles around the caster with a soft green light pulse.
 * Follows the caster while it plays.
 */
export class HealBurst {
    static DURATION = 70;
    static SPARKLES = 7;
    static SPARKLE_LIFE = 20;
    static LIGHT_COLOR = [0.2, 1.0, 0.35];

    /**
     * @param {Entity} caster - Entity to follow; its center anchors the effect.
     * @param {SpriteSheet} sparkle - Sheet played for each sparkle.
     */
    constructor(caster, sparkle) {
        this.caster = caster;
        this.sparkle = sparkle;
        this.age = 0;
        this.done = false;

        // Each sparkle starts at a random spot near the caster and a random delay.
        this.sparkles = [];
        for (let i = 0; i < HealBurst.SPARKLES; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 4 + Math.random() * 10;
            this.sparkles.push({
                ox: Math.cos(angle) * distance,
                oy: Math.sin(angle) * distance,
                delay: Math.random() * (HealBurst.DURATION - HealBurst.SPARKLE_LIFE)
            });
        }
    }

    /** @returns {number[]} The caster's center as [x, y]. */
    get center() {
        return [this.caster.x + this.caster.size / 2, this.caster.y + this.caster.size / 2];
    }

    /**
     * Ages the effect.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(frameScale) {
        this.age += frameScale;
        if (this.age >= HealBurst.DURATION) this.done = true;
    }

    /**
     * A light on the caster that swells and fades over the effect's life.
     * @returns {Object[]} Lights as {x, y, radius, color}.
     */
    getLights() {
        const t = Math.min(this.age / HealBurst.DURATION, 1);
        const pulse = Math.sin(Math.PI * t);
        const [x, y] = this.center;
        const color = scaleColor(HealBurst.LIGHT_COLOR, pulse);
        return [{ x, y, radius: 60 + 50 * pulse, color }];
    }

    /** Draws each sparkle that is currently alive, drifting upward. */
    display() {
        const [cx, cy] = this.center;
        for (const s of this.sparkles) {
            const life = this.age - s.delay;
            if (life < 0 || life >= HealBurst.SPARKLE_LIFE) continue;
            push();
            translate(cx + s.ox, cy + s.oy - life * 0.5);
            this.sparkle.drawFrame(life / 2, 12, 12);
            pop();
        }
    }
}
