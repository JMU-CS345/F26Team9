import { DIRECTION_VECTORS, Projectile, LightningStrike, HealBurst } from "./spellEffects.js";

// How far in front of the caster's center a spell appears.
const CAST_OFFSET = 40;

// How far lightning reaches from the caster.
const LIGHTNING_RANGE = 240;

/**
 * Spell definitions keyed by inventory item id.
 * cooldown is in 60 FPS frames; create() returns the new effect.
 */
export const SPELLS = {
    fire_bolt: {
        cooldown: 30,
        create: (art, x, y, dir) => new Projectile(x, y, dir, {
            sheet: art.fireball, speed: 7, range: 520,
            lightRadius: 150, lightColor: [1.0, 0.55, 0.2], sparkColor: [255, 170, 70],
            wobble: { amplitude: 6, wavelength: 220 }
        })
    },
    ice_shard: {
        cooldown: 30,
        create: (art, x, y, dir) => new Projectile(x, y, dir, {
            sheet: art.iceball, speed: 8, range: 460,
            lightRadius: 140, lightColor: [0.45, 0.75, 1.0], sparkColor: [140, 200, 255],
            wobble: { amplitude: 4, wavelength: 240 }
        })
    },
    lightning: {
        cooldown: 60,
        create: (art, x, y, dir) => new LightningStrike(
            x, y, x + dir[0] * LIGHTNING_RANGE, y + dir[1] * LIGHTNING_RANGE, art.sparkle)
    },
    heal_spell: {
        cooldown: 120,
        create: (art, x, y, dir, caster) => new HealBurst(caster, art.sparkle)
    }
};

/** Casts spells, tracks cooldowns, and owns every active spell effect. */
export class SpellCaster {
    /**
     * @param {Object} art - Sprite sheets: {fireball, iceball, sparkle}.
     */
    constructor(art) {
        this.art = art;
        this.effects = [];
        this.cooldowns = {};
    }

    /**
     * Checks whether an item id is a spell this caster knows.
     * @param {string} id - Inventory item id.
     * @returns {boolean} True if it can be cast.
     */
    knows(id) {
        return Object.prototype.hasOwnProperty.call(SPELLS, id);
    }

    /**
     * @param {string} id - Spell id.
     * @returns {number} Frames until the spell can be cast again (0 when ready).
     */
    cooldownRemaining(id) {
        return this.cooldowns[id] || 0;
    }

    /**
     * Casts a spell from the caster's center in the direction it faces.
     * @param {string} id - Spell id.
     * @param {Entity} caster - Entity casting the spell.
     * @returns {boolean} True if the spell was cast; false if unknown or recharging.
     */
    cast(id, caster) {
        if (!this.knows(id) || this.cooldownRemaining(id) > 0) return false;

        const dir = DIRECTION_VECTORS[caster.direction] || DIRECTION_VECTORS.south;
        const x = caster.x + caster.size / 2 + dir[0] * CAST_OFFSET;
        const y = caster.y + caster.size / 2 + dir[1] * CAST_OFFSET;

        this.effects.push(SPELLS[id].create(this.art, x, y, dir, caster));
        this.cooldowns[id] = SPELLS[id].cooldown;
        return true;
    }

    /**
     * Advances cooldowns and effects, and removes finished effects.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     * @param {number} w - Canvas width.
     * @param {number} h - Canvas height.
     */
    update(frameScale, w, h) {
        for (const id of Object.keys(this.cooldowns)) {
            this.cooldowns[id] = Math.max(0, this.cooldowns[id] - frameScale);
        }
        for (const effect of this.effects) effect.update(frameScale, w, h);
        this.effects = this.effects.filter(effect => !effect.done);
    }

    /** @returns {Object[]} Lights from every active effect. */
    getLights() {
        return this.effects.flatMap(effect => effect.getLights());
    }

    /** Draws every active effect. Call after the lighting pass so effects stay bright. */
    display() {
        for (const effect of this.effects) effect.display();
    }
}
