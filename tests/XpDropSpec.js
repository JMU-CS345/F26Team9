import { XpDrop } from "../src/xpDrop.js";
import { Player } from "../src/player.js";
import { Enemy } from "../src/enemy.js";
import { SpellCaster } from "../src/spellCaster.js";

describe("Enemy XP drops", function () {
    it("stays on the floor until the player walks close enough", function () {
        const player = new Player(0, 0);
        const drop = new XpDrop(100, 100);
        expect(drop.collect(player)).toBe(false);
        expect(player.stats.experience).toBe(0);
        player.x = 90;
        player.y = 90;
        expect(drop.collect(player)).toBe(true);
        expect(player.stats.experience).toBe(20);
    });
    it("can only be collected once", function () {
        const player = new Player(0, 0);
        const drop = new XpDrop(16, 16, 35);
        expect(drop.collect(player)).toBe(true);
        expect(drop.collect(player)).toBe(false);
        expect(player.stats.experience).toBe(35);
    });
    it("uses the existing XP bar and level-up rules", function () {
        const player = new Player(0, 0);
        const drop = new XpDrop(16, 16, 120);
        drop.collect(player);
        expect(player.stats.level).toBe(2);
        expect(player.stats.experience).toBe(20);
    });
    it("reports a fireball kill once and allows collecting its XP", function () {
        const player = new Player(0, 0);
        const enemy = new Enemy(90, 25, {}, { health: 2 });
        const spells = new SpellCaster({ fireball: {}, iceball: {}, sparkle: {} });
        const drops = [];
        spells.cast("fire_bolt", { x: 10, y: 30, size: 20, direction: "east" });
        for (let i = 0; i < 30; i++) {
            spells.update(1, 600, 400, [enemy], dead => {
                drops.push(new XpDrop(dead.x + dead.size / 2, dead.y + dead.size / 2));
            });
        }
        expect(enemy.health).toBe(1); // First hit should not kill the enemy.
        expect(drops.length).toBe(0);
        expect(spells.cast("fire_bolt", { x: 10, y: 30, size: 20, direction: "east" })).toBe(true);
        for (let i = 0; i < 20; i++) spells.update(1, 600, 400, [enemy], dead => {
            drops.push(new XpDrop(dead.x + dead.size / 2, dead.y + dead.size / 2));
        });
        expect(drops.length).toBe(1);
        expect(enemy.isAlive()).toBe(false);
        player.x = 85;
        player.y = 22;
        expect(drops[0].collect(player)).toBe(true);
        expect(player.stats.experience).toBe(20);
    });
    it("draws the XP pickup with visible pixel-art squares", function () {
        const drop = new XpDrop(50, 60);
        const previous = {};
        const squares = [];
        for (const name of ["push", "pop", "noStroke", "fill", "rect"]) {
            previous[name] = globalThis[name];
            globalThis[name] = (...args) => { if (name === "rect") squares.push(args); };
        }
        try {
            drop.display();
            expect(squares).toEqual([[45, 55, 10, 10], [48, 58, 4, 4]]);
        } finally {
            for (const name of Object.keys(previous)) globalThis[name] = previous[name];
        }
    });
    it("does not drop XP for a surviving enemy", function () {
        const enemy = new Enemy(90, 25);
        const spells = new SpellCaster({ fireball: {}, iceball: {}, sparkle: {} });
        let kills = 0;
        spells.cast("fire_bolt", { x: 10, y: 30, size: 20, direction: "east" });
        for (let i = 0; i < 20; i++) spells.update(1, 600, 400, [enemy], () => kills++);
        expect(kills).toBe(0);
        expect(enemy.health).toBe(2);
    });
});
