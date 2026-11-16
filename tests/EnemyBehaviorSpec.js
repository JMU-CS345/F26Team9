import { Enemy, SlimeBall, Bomb, SwordProjectile,
    createEnemySprites, createEnemyAttackSprites, ENEMY_ITEMS_PATH } from "../src/enemy.js";
import { FLOOR, World } from "../src/worldGenerator.js";

describe("Enemy attack patterns", function () {
    function corridor(length = 10) {
        const world = new World(length, 5);
        for (let col = 1; col < length - 1; col++) world.floor.set(col, 2, FLOOR.BRICK);
        return world;
    }
    function room() {
        const world = new World(10, 10);
        for (let c = 1; c < 9; c++) for (let r = 1; r < 9; r++) {
            world.floor.set(c, r, FLOOR.BRICK);
        }
        return world;
    }

    it("uses the special sprite frames for bouncing slimes and swooping bats", function () {
        const sheet = { get: (x, y, w, h) => ({ x, y, w, h }) };
        const slimeFrames = createEnemySprites(sheet, "slime");
        const batFrames = createEnemySprites(sheet, "bat");
        const slime = new Enemy(50, 50, slimeFrames, { type: "slime" });
        const bat = new Enemy(50, 50, batFrames, { type: "bat" });
        slime.isMoving = true;
        bat.swoopFrames = 30;
        expect(slime.getCurrentSprite()).toBe(slimeFrames.south[2]);
        expect(bat.getCurrentSprite()).toBe(batFrames.south[2]);
        const art = createEnemyAttackSprites(sheet);
        expect(ENEMY_ITEMS_PATH.includes("enemy_items.png")).toBe(true);
        expect(art.sword.y).toBe(0);
        expect(art.knife.y).toBe(25);
        expect(art.slime[0].y).toBe(225);
        expect(art.echo[0].y).toBe(250);
        expect(art.bomb[0].y).toBe(175);
        expect(art.explosion[0].y).toBe(325);
        expect(art.explosion[3].x).toBe(75);
    });

    it("renders each attack with the corresponding item sprite", function () {
        const sheet = { get: (x, y) => ({ x, y, width: 25, height: 25 }) };
        const art = createEnemyAttackSprites(sheet);
        const calls = [];
        const original = {};
        for (const name of ["push", "pop", "translate", "rotate", "imageMode", "image"]) {
            original[name] = globalThis[name];
            globalThis[name] = name === "image" ? sprite => calls.push(sprite) : () => {};
        }
        original.CENTER = globalThis.CENTER;
        original.CORNER = globalThis.CORNER;
        globalThis.CENTER = "center";
        globalThis.CORNER = "corner";
        try {
            new SwordProjectile(0, 0, 1, 0).display(art);
            new SwordProjectile(0, 0, 1, 0, 1, "knife").display(art);
            new SlimeBall(0, 0, 1, 0).display(art);
            const bomb = new Bomb(0, 0);
            bomb.display(art);
            bomb.exploded = true;
            bomb.display(art);
            const bat = new Enemy(0, 0, createEnemySprites(sheet, "bat"), { type: "bat" });
            bat.swoopFrames = 30;
            bat.display(art);
            expect(calls[0]).toBe(art.sword);
            expect(calls[1]).toBe(art.knife);
            expect(calls[2]).toBe(art.slime[0]);
            expect(calls[3]).toBe(art.bomb[0]);
            expect(calls[4]).toBe(art.explosion[0]);
            expect(calls[6]).toBe(art.echo[1]);
        } finally {
            for (const name of ["push", "pop", "translate", "rotate", "imageMode", "image", "CENTER", "CORNER"]) {
                globalThis[name] = original[name];
            }
        }
    });

    it("makes a slime wander and release exactly two balls on landing", function () {
        const world = corridor();
        const slime = new Enemy(50, 50, {},
            { type: "slime", speed: 1, random: () => 0 });
        const player = { x: 25, y: 46.5, size: 32 };
        let shots = null;
        for (let i = 0; i < 25; i++) shots = slime.update(player, world, 25) || shots;
        expect(slime.x).toBe(75); // Right, away from the player.
        expect(shots.length).toBe(2);
        expect(shots[0] instanceof SlimeBall).toBe(true);
        expect(shots[1] instanceof SlimeBall).toBe(true);
        const x = slime.x;
        slime.update(player, world, 25); // Pause between hops.
        expect(slime.x).toBe(x);
    });

    it("bounces slime balls off walls twice then breaks on the third hit", function () {
        const world = corridor(5); // Only floor x=25..99.
        const ball = new SlimeBall(62.5, 62.5, 1, 0);
        const player = { x: -100, y: -100, size: 32 };
        let lastBounces = 0;
        for (let i = 0; i < 150 && !ball.done; i++) {
            ball.update(player, world, 25);
            expect(ball.bounces >= lastBounces).toBe(true);
            lastBounces = ball.bounces;
            expect(world.isFloor(Math.floor(ball.x / 25), Math.floor(ball.y / 25))).toBe(true);
        }
        expect(ball.bounces).toBe(3);
        expect(ball.done).toBe(true);
    });

    it("slime balls hit only once and expire if they never hit a wall", function () {
        const world = room();
        let damage = 0;
        const player = { x: 55, y: 50, size: 25, takeDamage: n => damage += n };
        const ball = new SlimeBall(45, 62.5, 1, 0);
        for (let i = 0; i < 20; i++) ball.update(player, world, 25);
        expect(damage).toBe(1);
        expect(ball.done).toBe(true);
        const other = new SlimeBall(62, 62, 0, 0);
        for (let i = 0; i < 200; i++) other.update({ x: -100, y: -100, size: 25 }, world, 25);
        expect(other.done).toBe(true);
    });

    it("makes goblins wander and throw a knife rather than a sword", function () {
        const world = corridor();
        const goblin = new Enemy(50, 50, {},
            { type: "goblin", random: () => 0, speed: 1 });
        goblin.throwCooldown = 0;
        goblin.rushCooldown = 9999;
        const player = { x: 25, y: 46.5, size: 32 };
        const knife = goblin.update(player, world, 25);
        expect(goblin.x).toBe(51); // Wanders right, away from player.
        expect(knife instanceof SwordProjectile).toBe(true);
        expect(knife.kind).toBe("knife");
    });

    it("goblin rushes toward player and drops a bomb nearby", function () {
        const world = corridor(12);
        const goblin = new Enemy(50, 50, {}, { type: "goblin", random: () => 0 });
        goblin.rushCooldown = 0;
        const player = { x: 175, y: 46.5, size: 32 };
        let bomb = null;
        for (let i = 0; i < 100; i++) {
            const attack = goblin.update(player, world, 25);
            const list = !attack ? [] : Array.isArray(attack) ? attack : [attack];
            bomb = bomb || list.find(a => a instanceof Bomb);
        }
        expect(bomb instanceof Bomb).toBe(true);
        expect(bomb.x).toBeGreaterThan(50);
        expect(Math.abs(bomb.x - (player.x + 16)) < 42).toBe(true);
    });

    it("bomb explodes after two seconds, dealing damage only once", function () {
        let hits = 0;
        const player = { x: 50, y: 50, size: 25, takeDamage: n => hits += n };
        const bomb = new Bomb(62.5, 62.5);
        for (let i = 0; i < 119; i++) bomb.update(player);
        expect(hits).toBe(0);
        expect(bomb.exploded).toBe(false);
        bomb.update(player);
        expect(bomb.exploded).toBe(true);
        expect(hits).toBe(1);
        for (let i = 0; i < 20; i++) bomb.update(player);
        expect(hits).toBe(1);
        expect(bomb.done).toBe(true);
    });

    it("bat wanders until cooldown then swoops and hits only once", function () {
        const world = corridor(12);
        let hits = 0;
        const player = { x: 175, y: 46.5, size: 32, takeDamage: n => hits += n };
        const bat = new Enemy(50, 50, {}, { type: "bat", random: () => 0 });
        bat.swoopCooldown = 0;
        bat.update(player, world, 25);
        expect(bat.swoopFrames > 0).toBe(true);
        let gotClose = false;
        for (let i = 0; i < 90; i++) {
            bat.update(player, world, 25);
            if (bat.x > 120) gotClose = true;
        }
        expect(gotClose).toBe(true);
        expect(hits).toBe(1);
        expect(bat.swoopHit).toBe(true);
    });
});
