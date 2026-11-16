import { Entity } from "./entity.js";

// Resolve the existing sprite sheet relative to this module for Vite builds.
export const ENEMY_SPRITE_PATH = new URL("./enemy_sprites (1).png", import.meta.url).href;
export const ENEMY_ITEMS_PATH = new URL("./assets/enemy_items.png", import.meta.url).href;
// Four enemy types, each with eight directional rows.
const ENEMY_TYPES = ["skeleton", "goblin", "slime", "bat"];
const DIRECTIONS = [
    "south", "southeast", "east", "northeast",
    "north", "northwest", "west", "southwest"
];
const SPRITE_SIZE = 25;
const THROW_RANGE = 220;
const THROW_COOLDOWN = 120; // About two seconds at 60 FPS.
const FLOOR_DIRECTIONS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function playerCenter(player) {
    return [player.x + player.size / 2, player.y + player.size / 2];
}

function playerHit(player, x, y, padding = 0) {
    return x >= player.x - padding && x <= player.x + player.size + padding &&
        y >= player.y - padding && y <= player.y + player.size + padding;
}

function hitPlayer(player, damage) {
    // Player HP belongs to the separate player-stats issue.
    if (typeof player.takeDamage === "function") player.takeDamage(damage);
}

function onFloor(world, x, y, tileSize, radius = 0) {
    // Check the corners too, so a slime ball doesn't clip through a corner.
    return [-radius, radius].every(dx => [-radius, radius].every(dy =>
        world.isFloor(Math.floor((x + dx) / tileSize),
            Math.floor((y + dy) / tileSize))));
}
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
    // The third frame is a rising slime or diving bat pose.
    if (type === "slime" || type === "bat") {
        for (let row = 0; row < DIRECTIONS.length; row++) {
            sprites[DIRECTIONS[row]].push(sheet.get(2 * SPRITE_SIZE,
                (typeIndex * DIRECTIONS.length + row) * SPRITE_SIZE,
                SPRITE_SIZE, SPRITE_SIZE));
        }
    }
    return sprites;
}
/** Each item is a 25 x 25 cell in enemy_items.png. */
export function createSwordSprite(sheet) {
    return sheet.get(0, 0, SPRITE_SIZE, SPRITE_SIZE);
}

/** Load the existing attack art: blades, slime balls, echo waves, and bombs. */
export function createEnemyAttackSprites(sheet) {
    const row = r => [0, 1, 2, 3].map(c =>
        sheet.get(c * SPRITE_SIZE, r * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE));
    return {
        sword: createSwordSprite(sheet),
        knife: sheet.get(0, SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE),
        slime: row(9),
        echo: row(10),
        bomb: row(7),
        explosion: row(13)
    };
}

/** Find the first tile on a shortest floor-only route to the player. */
function nextPathTile(world, from, to) {
    const width = world.cols;
    const start = from[1] * width + from[0];
    const goal = to[1] * width + to[0];
    if (!world.isFloor(...from) || !world.isFloor(...to)) return null;
    if (start === goal) return from;
    const queue = [start];
    const previous = new Map([[start, -1]]);
    for (let i = 0; i < queue.length; i++) {
        const tile = queue[i];
        const col = tile % width;
        const row = Math.floor(tile / width);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nextCol = col + dc;
            const nextRow = row + dr;
            const next = nextRow * width + nextCol;
            if (!world.isFloor(nextCol, nextRow) || previous.has(next)) continue;
            previous.set(next, tile);
            if (next === goal) {
                let step = next;
                while (previous.get(step) !== start) step = previous.get(step);
                return [step % width, Math.floor(step / width)];
            }
            queue.push(next);
        }
    }
    return null;
}
/** Put one enemy in each room after the player's starting room. */
export function spawnEnemies(world, tileSize, spritesByType, random = Math.random) {
    const enemies = [];
    for (let i = 1; i < world.rooms.length; i++) {
        const room = world.rooms[i];
        const col = room.x + 1 + Math.floor(random() * (room.w - 2));
        const row = room.y + 1 + Math.floor(random() * (room.h - 2));
        if (!world.isFloor(col, row)) continue;
        const type = ENEMY_TYPES[(i - 1) % ENEMY_TYPES.length];
        enemies.push(new Enemy((col + 0.5) * tileSize - SPRITE_SIZE / 2,
            (row + 0.5) * tileSize - SPRITE_SIZE / 2, spritesByType[type],
            { health: 3 + i % 3, speed: 0.85 + random() * 0.3,
                damage: 1, type, random }));
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
        this.type = stats.type ?? "goblin";
        this.random = stats.random ?? Math.random;
        this.throwCooldown = 60;
        this.hopPause = 0;
        this.swoopCooldown = 80 + Math.abs(x + y) % 100;
        this.swoopFrames = 0;
        this.swoopHit = false;
        this.rushCooldown = 160 + Math.abs(x * 3 + y) % 120;
        this.rushFrames = 0;
        this.placeholderColor = [180, 60, 60];
    }
    /** Wander for most enemy types; only bats swooping and goblins rushing chase. */
    update(player, world, tileSize, frameScale = 1, otherEnemies = []) {
        if (!this.isAlive()) return null;
        frameScale = Math.max(0, Math.min(frameScale, 3));
        const [px, py] = playerCenter(player);
        const [cx, cy] = [this.x + this.size / 2, this.y + this.size / 2];
        const playerDistance = Math.hypot(px - cx, py - cy);

        // Alternate wandering with occasional short attacks.
        if (this.type === "bat") {
            this.swoopCooldown -= frameScale;
            if (this.swoopFrames <= 0 && this.swoopCooldown <= 0 && playerDistance < 180) {
                this.swoopFrames = 70;
                this.swoopCooldown = 210 + this.random() * 90;
                this.swoopHit = false;
                this.nextTile = null;
            }
        }
        if (this.type === "goblin") {
            this.rushCooldown -= frameScale;
            if (this.rushFrames <= 0 && this.rushCooldown <= 0 && playerDistance < 140) {
                this.rushFrames = 85;
                this.rushCooldown = 320 + this.random() * 100;
                this.nextTile = null;
            }
        }
        if (this.type === "slime" && this.hopPause > 0) {
            this.hopPause -= frameScale;
            this.updateAnimation(false);
            return null;
        }

        const pursuing = (this.type === "bat" && this.swoopFrames > 0) ||
            (this.type === "goblin" && this.rushFrames > 0);
        const tileAt = (x, y, size) => [
            Math.floor((x + size / 2) / tileSize),
            Math.floor((y + size / 2) / tileSize)
        ];
        if (!this.nextTile) {
            const from = tileAt(this.x, this.y, this.size);
            if (pursuing) {
                this.nextTile = nextPathTile(world, from, tileAt(player.x, player.y, player.size));
            } else {
                const options = FLOOR_DIRECTIONS.filter(([dx, dy]) =>
                    world.isFloor(from[0] + dx, from[1] + dy));
                if (options.length) {
                    const [dx, dy] = options[Math.floor(this.random() * options.length)];
                    this.nextTile = [from[0] + dx, from[1] + dy];
                }
            }
        }
        let moved = false;
        let landed = false;
        if (this.nextTile) {
            const [col, row] = this.nextTile;
            const dx = (col + 0.5) * tileSize - this.size / 2 - this.x;
            const dy = (row + 0.5) * tileSize - this.size / 2 - this.y;
            const distance = Math.hypot(dx, dy);
            const charging = pursuing ? 2.6 : 1;
            const step = Math.min(distance, this.speed * charging * frameScale);
            if (step > 0) {
                const nextX = this.x + dx / distance * step;
                const nextY = this.y + dy / distance * step;
                const blocked = otherEnemies.some(other => other !== this && other.isAlive() &&
                    Math.abs(nextX - other.x) < this.size &&
                    Math.abs(nextY - other.y) < this.size);
                if (!blocked) {
                    this.updateDirection(dx, dy);
                    this.x = nextX;
                    this.y = nextY;
                    moved = true;
                    landed = distance - step < 0.001;
                } else if (!pursuing) {
                    this.nextTile = null; // Try a different direction next frame.
                }
            } else {
                landed = true;
            }
            if (landed) this.nextTile = null;
        }
        this.updateAnimation(moved, frameScale);
        const attacks = [];
        if (this.type === "slime" && landed) {
            this.hopPause = 45;
            // Two shots spread away from each other on every landing/bounce.
            const angle = Math.atan2(py - (this.y + this.size / 2),
                px - (this.x + this.size / 2));
            for (const spread of [-0.45, 0.45]) {
                const direction = angle + spread;
                attacks.push(new SlimeBall(this.x + this.size / 2,
                    this.y + this.size / 2, Math.cos(direction), Math.sin(direction), this.damage));
            }
        }
        if (this.type === "bat" && this.swoopFrames > 0) {
            this.swoopFrames = Math.max(0, this.swoopFrames - frameScale);
            if (!this.swoopHit && playerHit(player, this.x + this.size / 2,
                this.y + this.size / 2, 2)) {
                hitPlayer(player, this.damage);
                this.swoopHit = true; // Only one hit per swoop.
            }
            if (this.swoopFrames === 0) this.nextTile = null;
        }
        if (this.type === "goblin" && this.rushFrames > 0) {
            this.rushFrames = Math.max(0, this.rushFrames - frameScale);
            const nearPlayer = Math.hypot(px - (this.x + 12.5), py - (this.y + 12.5));
            if (nearPlayer < 42) {
                attacks.push(new Bomb(this.x + 12.5, this.y + 12.5, this.damage));
                this.rushFrames = 0;
                this.nextTile = null;
            }
            if (this.rushFrames === 0) this.nextTile = null;
        }
        const thrown = this.throwSword(player, frameScale);
        if (thrown) attacks.push(thrown);
        return attacks.length === 0 ? null : attacks.length === 1 ? attacks[0] : attacks;
    }

    /** Skeletons throw swords and goblins throw knives while not rushing. */
    throwSword(player, frameScale) {
        if (this.type !== "skeleton" && this.type !== "goblin") return null;
        this.throwCooldown -= frameScale;
        if (this.type === "goblin" && this.rushFrames > 0) return null;
        const [px, py] = playerCenter(player);
        const dx = px - (this.x + this.size / 2);
        const dy = py - (this.y + this.size / 2);
        const distance = Math.hypot(dx, dy);
        if (this.throwCooldown > 0 || distance < 1 || distance > THROW_RANGE) return null;
        this.throwCooldown = THROW_COOLDOWN;
        this.updateDirection(dx, dy);
        return new SwordProjectile(this.x + this.size / 2, this.y + this.size / 2,
            dx / distance, dy / distance, this.damage,
            this.type === "goblin" ? "knife" : "sword");
    }

    /** Use existing lifted slime/dive bat sprite frames for their special moves. */
    getCurrentSprite() {
        const frames = this.sprites[this.direction];
        if (Array.isArray(frames) && frames[2] &&
            ((this.type === "slime" && this.isMoving) ||
             (this.type === "bat" && this.swoopFrames > 0))) return frames[2];
        return super.getCurrentSprite();
    }

    /** Show the purple echo-wave sprite while the bat swoops. */
    display(attackSprites) {
        super.display();
        if (this.type !== "bat" || this.swoopFrames <= 0 || !attackSprites?.echo) return;
        const angles = { east: 0, southeast: Math.PI / 4, south: Math.PI / 2,
            southwest: 3 * Math.PI / 4, west: Math.PI, northwest: -3 * Math.PI / 4,
            north: -Math.PI / 2, northeast: -Math.PI / 4 };
        const frame = Math.floor(this.swoopFrames / 6) % attackSprites.echo.length;
        push();
        translate(this.x + this.size / 2, this.y + this.size / 2);
        rotate(angles[this.direction] ?? 0);
        imageMode(CENTER);
        image(attackSprites.echo[frame], 20, 0, 30, 30);
        pop();
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

/** A thrown sword that travels straight, stopping at walls or the player. */
export class SwordProjectile {
    constructor(x, y, dx, dy, damage = 1, kind = "sword") {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.damage = damage;
        this.kind = kind;
        this.distance = 0;
        this.done = false;
    }

    /** Move a thrown blade and check floor tiles and the player's hitbox. */
    update(player, world, tileSize, frameScale = 1) {
        if (this.done) return;
        const step = 4 * Math.max(0, Math.min(frameScale, 3));
        this.x += this.dx * step;
        this.y += this.dy * step;
        this.distance += step;
        if (this.distance > THROW_RANGE ||
            !world.isFloor(Math.floor(this.x / tileSize), Math.floor(this.y / tileSize))) {
            this.done = true;
        } else if (this.x >= player.x && this.x <= player.x + player.size &&
            this.y >= player.y && this.y <= player.y + player.size) {
            // Player HP belongs to the player-stats PR; use it when available.
            hitPlayer(player, this.damage);
            this.done = true;
        }
    }

    /** The sword and knife are angled to point along their flight path. */
    display(attackSprites) {
        push();
        translate(this.x, this.y);
        rotate(Math.atan2(this.dy, this.dx) + 3 * Math.PI / 4);
        imageMode(CENTER);
        image(attackSprites[this.kind], 0, 0,
            this.kind === "knife" ? 20 : 25, this.kind === "knife" ? 20 : 25);
        pop();
    }
}

/** A slippery slime ball: two wall bounces, then it breaks on the next impact. */
export class SlimeBall {
    constructor(x, y, dx, dy, damage = 1) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.damage = damage;
        this.bounces = 0;
        this.life = 200;
        this.done = false;
        this.kind = "slime";
    }

    update(player, world, tileSize, frameScale = 1) {
        if (this.done) return;
        const step = 2.6 * Math.max(0, Math.min(frameScale, 3));
        const nextX = this.x + this.dx * step;
        const nextY = this.y + this.dy * step;
        const blockedX = !onFloor(world, nextX, this.y, tileSize, 3);
        const blockedY = !onFloor(world, this.x, nextY, tileSize, 3);
        // Reflect against whichever wall axis was hit; corners can reflect both.
        if (blockedX || blockedY) {
            if (blockedX) this.dx *= -1;
            if (blockedY) this.dy *= -1;
            this.bounces++;
            if (this.bounces > 2) this.done = true;
        } else if (!onFloor(world, nextX, nextY, tileSize, 3)) {
            this.dx *= -1;
            this.dy *= -1;
            if (++this.bounces > 2) this.done = true;
        } else {
            this.x = nextX;
            this.y = nextY;
        }
        this.life -= frameScale;
        if (this.life <= 0) this.done = true;
        if (!this.done && playerHit(player, this.x, this.y, 3)) {
            hitPlayer(player, this.damage);
            this.done = true;
        }
    }

    display(attackSprites) {
        // The four green slime frames cycle as the projectile travels.
        const frame = Math.floor((200 - this.life) / 6) % attackSprites.slime.length;
        push();
        imageMode(CENTER);
        image(attackSprites.slime[frame], this.x, this.y, 23, 23);
        pop();
    }
}

/** Dropped by a rushing goblin, with a two-second fuse and brief blast. */
export class Bomb {
    constructor(x, y, damage = 1) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.fuse = 120;
        this.blastFrames = 18;
        this.exploded = false;
        this.done = false;
        this.kind = "bomb";
    }

    update(player, world, tileSize, frameScale = 1) {
        if (this.done) return;
        if (!this.exploded) {
            this.fuse -= frameScale;
            if (this.fuse <= 0) {
                this.exploded = true;
                const [px, py] = playerCenter(player);
                if (Math.hypot(px - this.x, py - this.y) < 42) hitPlayer(player, this.damage);
            }
        } else {
            this.blastFrames -= frameScale;
            if (this.blastFrames <= 0) this.done = true;
        }
    }

    display(attackSprites) {
        // Bomb fuses have four stages; the last sprite is the lit red bomb.
        const frame = this.exploded
            ? Math.min(3, Math.floor((18 - this.blastFrames) / 4.5))
            : this.fuse < 30 ? 3 : Math.min(2, Math.floor((120 - this.fuse) / 30));
        const sprite = this.exploded ? attackSprites.explosion[frame] : attackSprites.bomb[frame];
        push();
        imageMode(CENTER);
        image(sprite, this.x, this.y, this.exploded ? 84 : 25, this.exploded ? 84 : 25);
        pop();
    }
}
