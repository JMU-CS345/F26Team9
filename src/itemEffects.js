/**
 * What happens when the player presses the hotkey of a non-spell item.
 * Spells are handled by SpellCaster; everything else (potions, tools, gear) is here.
 */

// Health restored by a healing potion.
export const HEAL_POTION_AMOUNT = 40;

// Mana restored by a mana potion.
export const MANA_POTION_AMOUNT = 30;

// How long potion effects last, in 60 FPS frames.
export const SPEED_POTION_FRAMES = 600;   // 10 seconds.
export const SHIELD_POTION_FRAMES = 480;  // 8 seconds.

// Fire bomb: damage dealt to every enemy within the radius of the player.
export const BOMB_DAMAGE = 3;
export const BOMB_RADIUS = 70;

// Passive gear bonuses, active while the item is owned.
export const STAFF_SPELL_POWER = 1;
export const BOOTS_SPEED_BONUS = 0.2;

/**
 * Copies gear bonuses from the inventory onto the player. Call each frame so
 * picking up or removing gear (chests, developer menu) takes effect at once.
 * @param {Player} player - Player receiving the bonuses.
 * @param {Inventory} inventory - The player's items.
 */
export function applyGear(player, inventory) {
    player.spellPower = inventory.has("arcane_staff") ? STAFF_SPELL_POWER : 0;
    player.gearSpeedBonus = inventory.has("swift_boots") ? BOOTS_SPEED_BONUS : 0;
}

/**
 * Uses an inventory item. Consumables are only used up when they did something,
 * so drinking a healing potion at full health keeps the potion.
 * @param {string} id - Catalog item id.
 * @param {Object} context - {player, inventory, enemies, effects, onDefeat}.
 *   effects: array that visual effects are pushed to (the SpellCaster's effects).
 *   onDefeat: called with each enemy a bomb defeats.
 * @returns {Object} {used: boolean, message: string}
 */
export function useItem(id, context) {
    const { player, inventory, enemies = [], effects = null, onDefeat = null } = context;
    const stats = player.stats;
    if (!inventory.has(id)) return { used: false, message: "You have no " + id };

    const consume = message => {
        inventory.consume(id);
        return { used: true, message };
    };

    switch (id) {
        case "healing_potion":
            if (stats.health >= stats.maxHealth) return { used: false, message: "Already at full health" };
            stats.heal(HEAL_POTION_AMOUNT);
            if (effects) effects.push(new PotionGlow(player, [110, 255, 140]));
            return consume("Healing Potion: +" + HEAL_POTION_AMOUNT + " HP");
        case "mana_potion":
            if (stats.mana >= stats.maxMana) return { used: false, message: "Mana is already full" };
            stats.restoreMana(MANA_POTION_AMOUNT);
            if (effects) effects.push(new PotionGlow(player, [120, 160, 255]));
            return consume("Mana Potion: +" + MANA_POTION_AMOUNT + " MP");
        case "speed_potion":
            player.speedBoostFrames = SPEED_POTION_FRAMES;
            if (effects) effects.push(new PotionGlow(player, [255, 200, 80]));
            return consume("Speed Potion: faster for " + SPEED_POTION_FRAMES / 60 + "s");
        case "shield_potion":
            player.shieldFrames = SHIELD_POTION_FRAMES;
            if (effects) effects.push(new PotionGlow(player, [120, 220, 255]));
            return consume("Shield Potion: no damage for " + SHIELD_POTION_FRAMES / 60 + "s");
        case "fire_bomb": {
            const cx = player.x + player.size / 2;
            const cy = player.y + player.size / 2;
            let hits = 0;
            for (const enemy of enemies) {
                if (!enemy.isAlive()) continue;
                const ex = enemy.x + enemy.size / 2;
                const ey = enemy.y + enemy.size / 2;
                if (Math.hypot(ex - cx, ey - cy) > BOMB_RADIUS + enemy.size / 4) continue;
                enemy.takeDamage(BOMB_DAMAGE);
                hits++;
                if (!enemy.isAlive() && onDefeat) onDefeat(enemy);
            }
            if (effects) effects.push(new Blast(cx, cy, BOMB_RADIUS));
            return consume(hits ? "Fire Bomb hit " + hits + (hits === 1 ? " enemy" : " enemies")
                                : "Fire Bomb: nothing in range");
        }
        case "arcane_staff":
            return { used: false, message: "Arcane Staff (passive): spells deal +" + STAFF_SPELL_POWER + " damage" };
        case "swift_boots":
            return { used: false, message: "Swift Boots (passive): +" + BOOTS_SPEED_BONUS * 100 + "% move speed" };
        default:
            return { used: false, message: "Nothing happens" };
    }
}

/** An expanding ring of fire with a bright flash, shown when a bomb goes off. */
export class Blast {
    static DURATION = 24;

    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.age = 0;
        this.done = false;
    }

    /** @param {number} frameScale - Elapsed time in 60 FPS frames. */
    update(frameScale) {
        this.age += frameScale;
        if (this.age >= Blast.DURATION) this.done = true;
    }

    /** @returns {number} 0 when it starts, 1 when it ends. */
    get progress() {
        return Math.min(1, this.age / Blast.DURATION);
    }

    getLights() {
        const strength = 1.6 * (1 - this.progress);
        return [{ x: this.x, y: this.y, radius: this.radius * 2,
                  color: [1.0 * strength, 0.55 * strength, 0.2 * strength] }];
    }

    display() {
        const t = this.progress;
        push();
        noFill();
        stroke(255, 160, 60, 255 * (1 - t));
        strokeWeight(3 * (1 - t) + 1);
        ellipse(this.x, this.y, this.radius * 2 * t, this.radius * 2 * t);
        noStroke();
        fill(255, 230, 150, 180 * (1 - t) * (1 - t));
        ellipse(this.x, this.y, this.radius * (1 - t), this.radius * (1 - t));
        pop();
    }
}

/** A short colored glow around the player after drinking a potion. */
export class PotionGlow {
    static DURATION = 30;

    constructor(player, color) {
        this.player = player;
        this.color = color;
        this.age = 0;
        this.done = false;
    }

    update(frameScale) {
        this.age += frameScale;
        if (this.age >= PotionGlow.DURATION) this.done = true;
    }

    get center() {
        return [this.player.x + this.player.size / 2, this.player.y + this.player.size / 2];
    }

    getLights() {
        const [x, y] = this.center;
        const fade = 1 - this.age / PotionGlow.DURATION;
        return [{ x, y, radius: 60, color: this.color.map(c => c / 255 * fade) }];
    }

    display() {
        const [x, y] = this.center;
        const t = this.age / PotionGlow.DURATION;
        push();
        noFill();
        stroke(...this.color, 200 * (1 - t));
        strokeWeight(1);
        ellipse(x, y, 16 + 24 * t, 16 + 24 * t);
        pop();
    }
}
