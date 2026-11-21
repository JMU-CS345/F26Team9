import { Entity } from "./entity.js";

/**
 * The player's health, mana, and experience. Model only: no drawing.
 * Every change goes through these methods, so values always stay in range.
 */
export class PlayerStats {
    // Mana regained per 60 FPS frame (about 3 per second).
    static MANA_REGEN = 0.05;

    // Experience needed to reach the next level is this times the current level.
    static XP_PER_LEVEL = 100;

    // How much max health and max mana grow with each level.
    static HEALTH_PER_LEVEL = 10;
    static MANA_PER_LEVEL = 10;

    // Starting stats for each wizard class, chosen from the class popup.
    static CLASSES = {
        Fire: { maxHealth: 100, maxMana: 30, attack: 50, defense: 10 },
        Mind: { maxHealth: 70, maxMana: 50, attack: 70, defense: 7 },
        Earth: { maxHealth: 150, maxMana: 30, attack: 50, defense: 20 }
    };

    /**
     * @param {Object} start - Optional starting {maxHealth, maxMana, attack, defense}.
     */
    constructor(start = {}) {
        this.maxHealth = start.maxHealth ?? 100;
        this.health = this.maxHealth;
        this.maxMana = start.maxMana ?? 50;
        this.mana = this.maxMana;
        this.attack = start.attack ?? 0;
        this.defense = start.defense ?? 0;
        this.wizardClass = null;
        this.level = 1;
        this.experience = 0;
    }

    /**
     * Sets max health, max mana, attack, and defense from a wizard class, and
     * refills health and mana to the new maximums.
     * @param {string} wizardClass - "Fire", "Mind", or "Earth".
     */
    applyClass(wizardClass) {
        const base = PlayerStats.CLASSES[wizardClass];
        if (!base) throw new Error("Choose Fire, Mind, or Earth.");
        this.wizardClass = wizardClass;
        this.maxHealth = base.maxHealth;
        this.health = base.maxHealth;
        this.maxMana = base.maxMana;
        this.mana = base.maxMana;
        this.attack = base.attack;
        this.defense = base.defense;
    }

    /** @returns {number} Experience needed to finish the current level. */
    get experienceToNext() {
        return PlayerStats.XP_PER_LEVEL * this.level;
    }

    /** @returns {boolean} True while the player has health left. */
    isAlive() {
        return this.health > 0;
    }

    /**
     * Lowers health, never below zero.
     * @param {number} amount - Damage taken; zero or negative does nothing.
     */
    takeDamage(amount) {
        if (amount > 0) this.health = Math.max(0, this.health - amount);
    }

    /**
     * Raises health, never above the maximum.
     * @param {number} amount - Health restored; zero or negative does nothing.
     */
    heal(amount) {
        if (amount > 0) this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Uses mana if there is enough of it.
     * @param {number} amount - Mana to spend.
     * @returns {boolean} True if the mana was spent; false if there was not enough.
     */
    spendMana(amount) {
        if (amount > this.mana) return false;
        this.mana -= Math.max(0, amount);
        return true;
    }

    /**
     * Raises mana, never above the maximum.
     * @param {number} amount - Mana restored; zero or negative does nothing.
     */
    restoreMana(amount) {
        if (amount > 0) this.mana = Math.min(this.maxMana, this.mana + amount);
    }

    /**
     * Adds experience, levelling up as many times as it covers. Each level up
     * raises max health and mana and refills both.
     * @param {number} amount - Experience gained; zero or negative does nothing.
     * @returns {number} How many levels were gained.
     */
    gainExperience(amount) {
        if (amount <= 0) return 0;
        this.experience += amount;
        let levels = 0;
        while (this.experience >= this.experienceToNext) {
            this.experience -= this.experienceToNext;
            this.level++;
            levels++;
            this.maxHealth += PlayerStats.HEALTH_PER_LEVEL;
            this.maxMana += PlayerStats.MANA_PER_LEVEL;
            this.health = this.maxHealth;
            this.mana = this.maxMana;
        }
        return levels;
    }

    /**
     * Regenerates mana over time.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(frameScale) {
        if (this.isAlive()) this.restoreMana(PlayerStats.MANA_REGEN * frameScale);
    }
}

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

        // Only the feet collide with walls, so the head can overlap a wall above,
        // which reads as standing in front of it in a top-down view.
        this.hitbox = { x: 9, y: 22, w: 14, h: 8 };

        // Health, mana, and experience, shown by the stat bars.
        this.stats = new PlayerStats();
    }

    /**
     * Hurts the player. Enemies, traps, and anything else that deals damage
     * should call this so the health bar and hit flash update.
     * @param {number} amount - Damage dealt.
     */
    takeDamage(amount) {
        this.stats.takeDamage(amount);
    }

    /**
     * Converts WASD keyboard input into movement.
     * Opposite keys cancel each other's components.
     *
     * @param {number} canvasWidth - Width of the game canvas.
     * @param {number} canvasHeight - Height of the game canvas.
     * @param {WallCollider|null} walls - Optional walls that block movement.
     */
    handleInput(canvasWidth, canvasHeight, walls = null) {
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
        this.moveSmooth(dx, dy, canvasWidth, canvasHeight, frameScale, walls);
    }
}

/**
 * Draws the player's health, mana, and experience bars in the top-left corner.
 * When a value drops, a pale trail shows how much was lost and then drains away.
 * Losing health also shakes the health bar and flashes the screen's edges red.
 * View only: reads PlayerStats but never changes it.
 */
export class StatBars {
    static WIDTH = 220;
    static HEIGHT = 18;
    static GAP = 8;

    // Portion of the gap between the trail and the real value closed each 60 FPS frame.
    static TRAIL_SPEED = 0.06;

    // 60 FPS frames the hit flash lasts, and how far the health bar shakes.
    static HURT_TIME = 24;
    static SHAKE = 4;

    // Each bar: what it reads from the stats, its label, and its colors.
    static BARS = [
        { key: "health", label: "HP", color: [205, 55, 65], trail: [255, 210, 150] },
        { key: "mana", label: "MP", color: [65, 110, 230], trail: [170, 200, 255] },
        { key: "experience", label: "XP", color: [225, 185, 60], trail: [255, 240, 180] }
    ];

    /**
     * @param {PlayerStats} stats - Stats to show.
     */
    constructor(stats) {
        this.stats = stats;
        this.trails = {};
        for (const bar of StatBars.BARS) this.trails[bar.key] = this.fraction(bar.key);
        this.lastHealth = stats.health;
        this.lastLevel = stats.level;
        this.hurtTime = 0;
    }

    /** @returns {number} Strength of the hit flash, from 1 just after a hit down to 0. */
    get hurt() {
        return this.hurtTime / StatBars.HURT_TIME;
    }

    /**
     * How full a bar is.
     * @param {string} key - "health", "mana", or "experience".
     * @returns {number} From 0 to 1.
     */
    fraction(key) {
        const stats = this.stats;
        const max = key === "health" ? stats.maxHealth
            : key === "mana" ? stats.maxMana : stats.experienceToNext;
        return max > 0 ? Math.max(0, Math.min(1, stats[key] / max)) : 0;
    }

    /**
     * Text shown on a bar, such as "80 / 100".
     * @param {string} key - "health", "mana", or "experience".
     * @returns {string} The bar's value text.
     */
    valueText(key) {
        const stats = this.stats;
        if (key === "health") return Math.ceil(stats.health) + " / " + stats.maxHealth;
        if (key === "mana") return Math.floor(stats.mana) + " / " + stats.maxMana;
        return "Lv " + stats.level + "   " + Math.floor(stats.experience)
            + " / " + stats.experienceToNext;
    }

    /**
     * Moves each trail toward its bar's value. A trail drops slowly so a loss is
     * visible, but catches up at once on a gain.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(frameScale) {
        this.hurtTime = Math.max(0, this.hurtTime - frameScale);
        if (this.stats.health < this.lastHealth) this.hurtTime = StatBars.HURT_TIME;
        this.lastHealth = this.stats.health;
        // A level up empties the XP bar, but nothing was lost, so skip the trail.
        if (this.stats.level !== this.lastLevel) this.trails.experience = this.fraction("experience");
        this.lastLevel = this.stats.level;

        const step = Math.min(1, StatBars.TRAIL_SPEED * frameScale);
        for (const bar of StatBars.BARS) {
            const target = this.fraction(bar.key);
            const trail = this.trails[bar.key];
            this.trails[bar.key] = target >= trail ? target : trail + (target - trail) * step;
        }
    }

    /**
     * Draws the bars on the screen, outside the camera.
     * @param {number} x - Left edge of the bars, in screen pixels.
     * @param {number} y - Top of the first bar, in screen pixels.
     */
    display(x, y) {
        push();
        textSize(12);
        for (let i = 0; i < StatBars.BARS.length; i++) {
            const bar = StatBars.BARS[i];
            const top = y + i * (StatBars.HEIGHT + StatBars.GAP);
            const labelWidth = 28;
            const shake = bar.key === "health"
                ? Math.sin(this.hurtTime * 1.7) * StatBars.SHAKE * this.hurt : 0;
            const left = x + labelWidth + shake;
            const w = StatBars.WIDTH;
            const h = StatBars.HEIGHT;

            noStroke();
            fill(235);
            textAlign(LEFT, CENTER);
            text(bar.label, x, top + h / 2);

            // Frame and empty track. The health frame glows red just after a hit.
            fill(20, 18, 26, 220);
            if (bar.key === "health" && this.hurt > 0) stroke(255, 80, 80);
            else stroke(150, 145, 170);
            strokeWeight(1);
            rect(left, top, w, h, 4);

            noStroke();
            fill(...bar.trail);
            rect(left + 2, top + 2, (w - 4) * this.trails[bar.key], h - 4, 3);
            fill(...bar.color);
            rect(left + 2, top + 2, (w - 4) * this.fraction(bar.key), h - 4, 3);

            // A light strip on top gives the fill a little shine.
            fill(255, 255, 255, 45);
            rect(left + 2, top + 2, (w - 4) * this.fraction(bar.key), (h - 4) / 2, 3);

            // White value text with a dark drop shadow, readable on every bar color.
            textAlign(CENTER, CENTER);
            fill(0, 190);
            text(this.valueText(bar.key), left + w / 2 + 1, top + h / 2 + 1);
            fill(255);
            text(this.valueText(bar.key), left + w / 2, top + h / 2);
        }
        pop();
    }

    /** Flashes the edges of the screen red just after the player is hurt. */
    displayHurtFlash() {
        if (this.hurt <= 0) return;
        push();
        noFill();
        const depth = 60;
        for (let i = 0; i < depth; i += 4) {
            stroke(200, 20, 30, 150 * this.hurt * (1 - i / depth));
            strokeWeight(4);
            rect(i, i, width - 2 * i, height - 2 * i);
        }
        pop();
    }
}
