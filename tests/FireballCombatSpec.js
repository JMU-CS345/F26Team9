import { Enemy } from "../src/enemy.js";
import { SpellCaster } from "../src/spellCaster.js";

function fire(enemies, walls = null, step = 1) {
    const spells = new SpellCaster({ fireball: {}, iceball: {}, sparkle: {} });
    spells.walls = walls;
    spells.cast("fire_bolt", { x: 10, y: 30, size: 20, direction: "east" });
    for (let i = 0; i < 30 && !spells.effects[0].exploding; i++) {
        spells.update(step, 600, 400, enemies);
    }
    return spells.effects[0];
}

describe("Fireball enemy combat", function () {
    it("deals one damage and triggers a red flash", function () {
        const target = new Enemy(90, 25);
        const shot = fire([target]);
        expect(target.health).toBe(2);
        expect(target.hitFlash).toBe(12);
        expect(shot.exploding).toBe(true);
        for (let i = 0; i < 10; i++) shot.update(1, 600, 400, null, [target]);
        expect(target.health).toBe(2); // Explosion doesn't deal damage repeatedly.
    });
    it("kills low-health enemies and records the defeat once", function () {
        const target = new Enemy(90, 25, {}, { health: 1 });
        const shot = fire([target], null, 3);
        expect(target.isAlive()).toBe(false);
        expect(shot.defeatedEnemy).toBe(target);
    });
    it("hits only the first enemy in its flight path", function () {
        const front = new Enemy(90, 25);
        const back = new Enemy(120, 25);
        fire([front, back], null, 3);
        expect(front.health).toBe(2);
        expect(back.health).toBe(3);
    });
    it("renders a temporary red tint after damage", function () {
        const enemy = new Enemy(90, 25);
        const previous = {};
        const calls = [];
        for (const name of ["push", "pop", "tint", "fill", "rect"]) {
            previous[name] = globalThis[name];
            globalThis[name] = (...args) => { if (name === "tint") calls.push(args); };
        }
        try {
            enemy.takeDamage(1);
            enemy.display();
            expect(calls.length).toBe(1);
            expect(calls[0]).toEqual([255, 60, 60]);
            enemy.hitFlash = 0;
            enemy.display();
            expect(calls.length).toBe(1);
        } finally {
            for (const name of Object.keys(previous)) globalThis[name] = previous[name];
        }
    });
    it("cannot hit an enemy behind a solid wall", function () {
        const target = new Enemy(110, 25);
        const walls = { blocksPoint: (x) => x >= 80 && x <= 90,
            castRay: () => 22 };
        const shot = fire([target], walls);
        expect(shot.exploding).toBe(true);
        expect(target.health).toBe(3);
    });
    it("doesn't deal damage for blue ice spells yet", function () {
        const target = new Enemy(90, 25);
        const spells = new SpellCaster({ fireball: {}, iceball: {}, sparkle: {} });
        spells.cast("ice_shard", { x: 10, y: 30, size: 20, direction: "east" });
        for (let i = 0; i < 25; i++) spells.update(1, 600, 400, [target]);
        expect(target.health).toBe(3);
    });
});
