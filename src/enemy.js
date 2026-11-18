import { Entity } from "./entity.js";

// Resolve the existing sprite sheet relative to this module for Vite builds.
export const ENEMY_SPRITE_PATH = new URL("./enemy_sprites (1).png", import.meta.url).href;
// Four enemy types, each with eight directional rows.
const ENEMY_TYPES = ["skeleton", "goblin", "slime", "bat"];
const DIRECTIONS = [
    "south", "southeast", "east", "northeast",
    "north", "northwest", "west", "southwest"
];
const SPRITE_SIZE = 25;

/**
 * Cuts two walking frames per direction from the existing enemy sprite sheet.
 * The full sheet is 100 x 800 pixels (four columns and 32 rows).
 * @param {p5.Image} sheet - Image loaded in preload() with loadImage().
 * @param {string} type - "skeleton", "goblin", "slime", or "bat".
 * @returns {Object} Sprites that work with Entity's animation methods.
 */
export function createEnemySprites(sheet, type = "skeleton") {
    const typeIndex = ENEMY_TYPES.indexOf(type);
    if (typeIndex === -1) throw new Error("Unknown enemy type: " + type);

    const sprites = {};
    for (let row = 0; row < DIRECTIONS.length; row++) {
        const y = (typeIndex * DIRECTIONS.length + row) * SPRITE_SIZE;
        // Entity currently alternates between two animation frames.
        sprites[DIRECTIONS[row]] = [
            sheet.get(0, y, SPRITE_SIZE, SPRITE_SIZE),
            sheet.get(SPRITE_SIZE, y, SPRITE_SIZE, SPRITE_SIZE)
        ];
    }
    return sprites;
}

/** Basic dungeon enemy. Movement, facing, and drawing come from Entity. */
export class Enemy extends Entity {
    /**
     * @param {number} x - Starting x-coordinate in world pixels.
     * @param {number} y - Starting y-coordinate in world pixels.
     * @param {Object} sprites - Directional frames from createEnemySprites().
     * @param {Object} stats - Optional health, speed, and damage values.
     */
    constructor(x, y, sprites = {}, stats = {}) {
        super(x, y, SPRITE_SIZE, stats.speed ?? 1, sprites);
        this.maxHealth = stats.health ?? 3;
        this.health = this.maxHealth;
        this.damage = stats.damage ?? 1;
        this.placeholderColor = [180, 60, 60];
    }

    /** Lowers health without allowing it to go below zero. */
    takeDamage(amount) {
        if (amount > 0) this.health = Math.max(0, this.health - amount);
    }

    /** @returns {boolean} Whether this enemy still has health remaining. */
    isAlive() {
        return this.health > 0;
    }
}
