import { Entity } from "./entity.js";

// Resolve the existing sprite sheet relative to this module for Vite builds.
export const ENEMY_SPRITE_PATH = new URL("./enemy_sprites (1).png", import.meta.url).href;
export const ENEMY_ITEM_PATH = new URL("./assets/enemy_items.png", import.meta.url).href;

// enemy_items.png is four 25px frames wide; rows are counted from zero.
export function createEnemyItemSprites(sheet) {
    const rows = { sword: 8, knife: 3, slime: 9, echo: 10, bomb: 7, explosion: 13 };
    const result = {};
    for (const [name, row] of Object.entries(rows)) {
        result[name] = [];
        for (let frame = 0; frame < 4; frame++) {
            result[name].push(sheet.get(frame * 25, row * 25, 25, 25));
        }
    }
    return result;
}
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
    if (type === "slime" || type === "bat") {
        for (let row = 0; row < DIRECTIONS.length; row++) {
            sprites[DIRECTIONS[row]].push(sheet.get(50,
                (typeIndex * DIRECTIONS.length + row) * SPRITE_SIZE, 25, 25));
        }
    }
    return sprites;
}

/** Spawn one enemy on a floor tile inside each room except the starting room. */
export function spawnEnemies(world, tileSize, spritesByType, random = Math.random) {
    const types = ["skeleton", "goblin", "slime", "bat"];
    const enemies = [];
    for (let i = 1; i < world.rooms.length; i++) {
        const room = world.rooms[i];
        const positions = [];
        // Inset by one tile to stay away from wall art at room edges.
        for (let row = room.y + 1; row < room.y + room.h - 1; row++) {
            for (let col = room.x + 1; col < room.x + room.w - 1; col++) {
                if (world.isFloor(col, row)) positions.push([col, row]);
            }
        }
        if (!positions.length) continue;
        const choice = Math.min(positions.length - 1, Math.floor(random() * positions.length));
        const [col, row] = positions[choice];
        const type = types[(i - 1) % types.length];
        const speed = 0.85 + 0.3 * random();
        enemies.push(new Enemy((col + 0.5) * tileSize - SPRITE_SIZE / 2,
            (row + 0.5) * tileSize - SPRITE_SIZE / 2,
            spritesByType[type] || {}, { type, speed, random, health: 3 + i % 3 }));
    }
    return enemies;
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
        this.type = stats.type ?? "skeleton";
        this.random = stats.random ?? Math.random;
        this.placeholderColor = [180, 60, 60];
    }

    /** Move one tile at a time, selecting neighboring floor tiles at random. */
    updateWander(world, tileSize, walls, others = [], frameScale = 1) {
        if (!this.isAlive()) return;
        const time = Number.isFinite(frameScale) ? Math.max(0, Math.min(frameScale, 3)) : 1;
        if (time === 0) return;

        if (!this.wanderTarget) {
            const col = Math.floor((this.x + this.size / 2) / tileSize);
            const row = Math.floor((this.y + this.size / 2) / tileSize);
            const choices = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => {
                if (!world.isFloor(col + dx, row + dy)) return false;
                const x = (col + dx + 0.5) * tileSize - this.size / 2;
                const y = (row + dy + 0.5) * tileSize - this.size / 2;
                return walls.hits({ x, y, w: this.size, h: this.size }).length === 0;
            });
            if (!choices.length) {
                this.updateAnimation(false, time);
                return;
            }
            const [dx, dy] = choices[Math.floor(this.random() * choices.length)];
            this.wanderTarget = [
                (col + dx + 0.5) * tileSize - this.size / 2,
                (row + dy + 0.5) * tileSize - this.size / 2
            ];
        }

        const [targetX, targetY] = this.wanderTarget;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const step = Math.min(distance, this.speed * time);
        if (step === 0) {
            this.wanderTarget = null;
            this.updateAnimation(false, time);
            return;
        }
        const x = this.x + dx / distance * step;
        const y = this.y + dy / distance * step;
        const overlapping = others.some(other => other !== this && other.isAlive() &&
            x < other.x + other.size && x + this.size > other.x &&
            y < other.y + other.size && y + this.size > other.y);
        if (overlapping || walls.hits({ x, y, w: this.size, h: this.size }).length) {
            this.wanderTarget = null; // Pick a different route next update.
            this.updateAnimation(false, time);
            return;
        }
        this.x = x;
        this.y = y;
        this.updateDirection(dx, dy);
        this.updateAnimation(true, time);
        if (step === distance) this.wanderTarget = null;
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
