import { SpellCaster, SPELLS } from "../src/spellCaster.js";
import { Projectile, LightningStrike, HealBurst, DIRECTION_VECTORS } from "../src/spellEffects.js";

/** Jasmine unit tests for casting spells and their effects (no drawing). */
describe("Spells", function () {
    // Sprite sheets are only used for drawing, so tests can use placeholders.
    const art = { fireball: {}, iceball: {}, sparkle: {} };

    function caster(direction = "east") {
        return { x: 100, y: 100, size: 32, direction };
    }

    function run(spells, frames) {
        for (let i = 0; i < frames; i++) spells.update(1, 1000, 1000);
    }

    it("casts known spells and ignores other items", function () {
        const spells = new SpellCaster(art);
        expect(spells.knows("fire_bolt")).toBe(true);
        expect(spells.knows("healing_potion")).toBe(false);
        expect(spells.cast("healing_potion", caster())).toBe(false);
        expect(spells.effects.length).toBe(0);
    });

    it("blocks a spell until its cooldown runs out", function () {
        const spells = new SpellCaster(art);
        expect(spells.cast("fire_bolt", caster())).toBe(true);
        expect(spells.cast("fire_bolt", caster())).toBe(false);
        run(spells, SPELLS.fire_bolt.cooldown);
        expect(spells.cast("fire_bolt", caster())).toBe(true);
    });

    it("tracks cooldowns separately for each spell", function () {
        const spells = new SpellCaster(art);
        spells.cast("fire_bolt", caster());
        expect(spells.cast("ice_shard", caster())).toBe(true);
    });

    it("fires a bolt in the direction the caster faces", function () {
        const spells = new SpellCaster(art);
        spells.cast("fire_bolt", caster("north"));
        const bolt = spells.effects[0];
        const startY = bolt.y;
        run(spells, 5);
        expect(bolt.y).toBeLessThan(startY);
        // Sideways wobble only, never more than the wave's height.
        expect(Math.abs(bolt.x - 116)).toBeLessThanOrEqual(6);
    });

    it("explodes a bolt at the canvas edge and then removes it", function () {
        const bolt = new Projectile(990, 500, DIRECTION_VECTORS.east,
            { sheet: {}, speed: 7, range: 500, lightRadius: 100, lightColor: [1, 0.5, 0.2] });
        bolt.update(1, 1000, 1000);
        bolt.update(1, 1000, 1000);
        expect(bolt.exploding).toBe(true);
        expect(bolt.x).toBe(1000);

        // Done once the explosion has played and every spark has faded.
        const frames = Projectile.EXPLODE_COUNT * Projectile.FRAME_TIME + Projectile.SPARK_LIFE;
        for (let i = 0; i < frames; i++) bolt.update(1, 1000, 1000);
        expect(bolt.done).toBe(true);
    });

    it("explodes a bolt when it reaches its range", function () {
        const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east,
            { sheet: {}, speed: 10, range: 50, lightRadius: 100, lightColor: [1, 1, 1] });
        for (let i = 0; i < 4; i++) bolt.update(1, 1000, 1000);
        expect(bolt.exploding).toBe(false);
        bolt.update(1, 1000, 1000);
        expect(bolt.exploding).toBe(true);
    });

    it("gives every active effect a light that the lighting renderer can use", function () {
        const spells = new SpellCaster(art);
        spells.cast("fire_bolt", caster());
        spells.cast("lightning", caster());
        spells.cast("heal_spell", caster());
        // Long enough for the bolt to fly past both trailing light distances.
        run(spells, 12);
        const lights = spells.getLights();
        // Bolt + its two trailing lights, three along the lightning, one for heal.
        expect(lights.length).toBe(3 + 3 + 1);
        for (const light of lights) {
            expect(light.radius).toBeGreaterThan(0);
            expect(light.color.length).toBe(3);
        }
    });

    it("fades an explosion's light out", function () {
        const bolt = new Projectile(500, 500, DIRECTION_VECTORS.east,
            { sheet: {}, speed: 7, range: 0, lightRadius: 100, lightColor: [1, 1, 1] });
        bolt.update(1, 1000, 1000);
        const early = bolt.getLights()[0].color[0];
        for (let i = 0; i < 30; i++) bolt.update(1, 1000, 1000);
        expect(bolt.getLights()[0].color[0]).toBeLessThan(early);
    });

    it("ends lightning after its duration", function () {
        const strike = new LightningStrike(0, 0, 100, 0, {});
        expect(strike.points.length).toBe(LightningStrike.SEGMENTS + 1);
        expect(strike.points[0]).toEqual([0, 0]);
        expect(strike.points[LightningStrike.SEGMENTS]).toEqual([100, 0]);
        for (let i = 0; i < LightningStrike.DURATION; i++) strike.update(1);
        expect(strike.done).toBe(true);
    });

    it("keeps the heal light on the caster as it moves", function () {
        const hero = caster();
        const heal = new HealBurst(hero, {});
        heal.update(10);
        hero.x = 300;
        expect(heal.getLights()[0].x).toBe(316);
    });

    it("removes finished effects", function () {
        const spells = new SpellCaster(art);
        spells.cast("heal_spell", caster());
        run(spells, HealBurst.DURATION);
        expect(spells.effects.length).toBe(0);
    });

    describe("bolt path and trail", function () {
        const style = {
            sheet: {}, speed: 5, range: 1000, lightRadius: 100, lightColor: [1, 0.5, 0.2],
            wobble: { amplitude: 12, wavelength: 80 }
        };

        it("weaves to both sides of its line without going past the wave height", function () {
            const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east, style);
            let above = false;
            let below = false;
            for (let i = 0; i < 40; i++) {
                bolt.update(1, 2000, 2000);
                expect(Math.abs(bolt.y - 500)).toBeLessThanOrEqual(12 + 1e-9);
                if (bolt.y < 499) above = true;
                if (bolt.y > 501) below = true;
            }
            expect(above && below).toBe(true);
        });

        it("still moves forward at its full speed", function () {
            const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east, style);
            for (let i = 0; i < 10; i++) bolt.update(1, 2000, 2000);
            expect(bolt.x).toBeCloseTo(50, 5);
        });

        it("places trailing lights behind the bolt on its path, dimmer than the bolt", function () {
            const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east, style);
            for (let i = 0; i < 40; i++) bolt.update(1, 2000, 2000);
            const [head, ...trail] = bolt.getLights();
            expect(trail.length).toBe(Projectile.TRAIL_LIGHTS.length);
            for (const light of trail) {
                expect(light.x).toBeLessThan(head.x);
                expect(light.color[0]).toBeLessThan(head.color[0]);
                expect(Math.abs(light.y - 500)).toBeLessThanOrEqual(12 + 1e-9);
            }
        });

        it("has no trailing lights right after leaving the caster", function () {
            const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east, style);
            bolt.update(1, 2000, 2000);
            expect(bolt.getLights().length).toBe(1);
        });

        it("sheds sparks that drift backward and fade away", function () {
            const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east, style);
            for (let i = 0; i < 10; i++) bolt.update(1, 2000, 2000);
            expect(bolt.sparks.length).toBeGreaterThan(0);
            for (const spark of bolt.sparks) expect(spark.vx).toBeLessThan(0);
        });

        it("keeps the same speed when there is no wobble", function () {
            const plain = { ...style, wobble: undefined };
            const bolt = new Projectile(0, 500, DIRECTION_VECTORS.east, plain);
            for (let i = 0; i < 10; i++) bolt.update(1, 2000, 2000);
            expect(bolt.y).toBe(500);
        });
    });
});
