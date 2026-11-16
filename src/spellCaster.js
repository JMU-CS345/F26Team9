import { DIRECTION_VECTORS, Projectile, LightningStrike, HealBurst } from "./spellEffects.js";

// How far in front of the caster's center a spell appears.
const CAST_OFFSET = 22;

// How far lightning reaches from the caster.
const LIGHTNING_RANGE = 140;

/**
 * Spell definitions keyed by inventory item id.
 * cooldown is in 60 FPS frames; create() returns the new effect.
 * create() receives the walls (or null) so spells can stop where a wall is.
 */
export const SPELLS = {
    fire_bolt: {
        cooldown: 30,
        create: (art, x, y, dir) => new Projectile(x, y, dir, {
            sheet: art.fireball, speed: 7, range: 520,
            lightRadius: 85, lightColor: [1.0, 0.55, 0.2], sparkColor: [255, 170, 70],
            wobble: { amplitude: 3, wavelength: 220 }
        })
    },
    ice_shard: {
        cooldown: 30,
        create: (art, x, y, dir) => new Projectile(x, y, dir, {
            sheet: art.iceball, speed: 8, range: 460,
            lightRadius: 80, lightColor: [0.45, 0.75, 1.0], sparkColor: [140, 200, 255],
            wobble: { amplitude: 2, wavelength: 240 }
        })
    },
    lightning: {
        cooldown: 60,
        create: (art, x, y, dir, caster, walls) => {
            // The bolt ends at the first wall in its path.
            const reach = walls ? walls.castRay(x, y, dir, LIGHTNING_RANGE) : LIGHTNING_RANGE;
            return new LightningStrike(x, y, x + dir[0] * reach, y + dir[1] * reach, art.sparkle);
        }
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

        // Walls that stop spells; set by the game once the world exists.
        this.walls = null;
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
        const [originX, originY] = this.castOrigin(caster);

        // Never start a spell on the far side of a wall the caster is facing.
        const offset = this.walls
            ? this.walls.castRay(originX, originY, dir, CAST_OFFSET) : CAST_OFFSET;
        const x = originX + dir[0] * offset;
        const y = originY + dir[1] * offset;

        this.effects.push(SPELLS[id].create(this.art, x, y, dir, caster, this.walls));
        this.cooldowns[id] = SPELLS[id].cooldown;
        return true;
    }

    /**
     * Where a spell starts: the caster's center, unless that point is inside or
     * past a wall. A caster's head may overlap a wall in front of it, so in that
     * case the spell starts from the furthest clear point between the caster's
     * feet (which never enter walls) and its center.
     * @param {Entity} caster - Entity casting the spell.
     * @returns {number[]} [x, y] in world pixels.
     */
    castOrigin(caster) {
        const centerX = caster.x + caster.size / 2;
        const centerY = caster.y + caster.size / 2;
        if (!this.walls || !caster.getHitbox) return [centerX, centerY];

        const feet = caster.getHitbox();
        const feetX = feet.x + feet.w / 2;
        const feetY = feet.y + feet.h / 2;
        const length = Math.hypot(centerX - feetX, centerY - feetY);
        if (length === 0) return [centerX, centerY];

        const toCenter = [(centerX - feetX) / length, (centerY - feetY) / length];
        const clear = this.walls.castRay(feetX, feetY, toCenter, length);
        return [feetX + toCenter[0] * clear, feetY + toCenter[1] * clear];
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
        for (const effect of this.effects) effect.update(frameScale, w, h, this.walls);
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
