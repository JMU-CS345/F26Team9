import { Enemy, SwordProjectile, spawnEnemies } from "../src/enemy.js";
import { FLOOR, World } from "../src/worldGenerator.js";

describe("Enemy spawning and movement", function () {
    function fill(world, col, row) { world.floor.set(col, row, FLOOR.BRICK); }

    it("spawns enemies on floor tiles outside the starting room", function () {
        const world = new World(12, 7);
        world.rooms = [{ x: 1, y: 1, w: 4, h: 4 }, { x: 7, y: 1, w: 4, h: 4 }];
        for (const room of world.rooms) {
            for (let x = room.x; x < room.x + room.w; x++)
                for (let y = room.y; y < room.y + room.h; y++) fill(world, x, y);
        }
        const enemies = spawnEnemies(world, 25, { skeleton: {} }, () => 0.5);
        expect(enemies.length).toBe(1);
        expect(enemies[0] instanceof Enemy).toBe(true);
        expect(world.isFloor(Math.floor((enemies[0].x + 12.5) / 25),
            Math.floor((enemies[0].y + 12.5) / 25))).toBe(true);
        expect(enemies[0].x).toBeGreaterThan(7 * 25);
    });
    it("moves toward a player at the configured speed", function () {
        const world = new World(5, 3);
        fill(world, 1, 1);
        fill(world, 2, 1);
        const enemy = new Enemy(25, 25, {}, { speed: 2 });
        enemy.update({ x: 34, y: 21.5, size: 32 }, world, 25);
        expect(enemy.x).toBe(27);
        expect(enemy.direction).toBe("east");
        expect(enemy.isMoving).toBe(true);
    });
    it("routes a charging bat around a wall without entering non-floor tiles", function () {
        const world = new World(7, 5);
        for (const [col, row] of [[1, 1], [2, 1], [4, 1], [2, 2], [3, 2], [4, 2]]) {
            fill(world, col, row);
        }
        const enemy = new Enemy(25, 25, {}, { type: "bat" });
        enemy.swoopFrames = 70;
        enemy.swoopCooldown = 9999;
        const player = { x: 96.5, y: 21.5, size: 32 }; // Centered on tile (4, 1).
        let wentAround = false;
        for (let i = 0; i < 55; i++) {
            enemy.update(player, world, 25);
            if (enemy.y > 25) wentAround = true;
            const x = Math.floor((enemy.x + 12.5) / 25);
            const y = Math.floor((enemy.y + 12.5) / 25);
            expect(world.isFloor(x, y)).toBe(true);
        }
        expect(wentAround).toBe(true);
        expect(enemy.x).toBe(100);
        expect(enemy.y).toBe(25);
    });
    it("does not move through an unreachable wall or after dying", function () {
        const world = new World(5, 3);
        fill(world, 1, 1);
        fill(world, 3, 1);
        const enemy = new Enemy(25, 25);
        const player = { x: 71.5, y: 21.5, size: 32 };
        enemy.update(player, world, 25);
        expect(enemy.x).toBe(25);
        enemy.takeDamage(10);
        enemy.update(player, world, 25);
        expect(enemy.x).toBe(25);
    });
});

describe("Enemy separation and speed variation", function () {
    it("gives spawned enemies slightly different speeds", function () {
        const world = new World(16, 6);
        world.rooms = [
            { x: 1, y: 1, w: 4, h: 4 },
            { x: 6, y: 1, w: 4, h: 4 },
            { x: 11, y: 1, w: 4, h: 4 }
        ];
        for (const room of world.rooms) {
            for (let col = room.x; col < room.x + room.w; col++) {
                for (let row = room.y; row < room.y + room.h; row++) {
                    world.floor.set(col, row, FLOOR.BRICK);
                }
            }
        }
        const values = [0.5, 0.5, 0, 0.5, 0.5, 1];
        let index = 0;
        const sprites = { skeleton: {}, goblin: {} };
        const enemies = spawnEnemies(world, 25, sprites, () => values[index++]);
        expect(enemies.length).toBe(2);
        expect(enemies[0].speed).toBe(0.85);
        expect(enemies[1].speed).toBe(1.15);
    });

    it("prevents enemies from overlapping while chasing the same player", function () {
        const world = new World(9, 3);
        for (let col = 1; col <= 7; col++) world.floor.set(col, 1, FLOOR.BRICK);
        const slow = new Enemy(75, 25, {}, { speed: 0.5 });
        const fast = new Enemy(25, 25, {}, { speed: 2 });
        const enemies = [slow, fast];
        const player = { x: 175, y: 21.5, size: 32 };
        for (let i = 0; i < 200; i++) {
            for (const enemy of enemies) enemy.update(player, world, 25, 1, enemies);
            expect(Math.abs(slow.x - fast.x) >= 25 ||
                Math.abs(slow.y - fast.y) >= 25).toBe(true);
        }
        expect(fast.x).toBeGreaterThan(25);
        expect(slow.x).toBeGreaterThan(75);
    });

    it("ignores defeated enemies when checking whether movement is blocked", function () {
        const world = new World(6, 3);
        for (let col = 1; col <= 4; col++) world.floor.set(col, 1, FLOOR.BRICK);
        const moving = new Enemy(25, 25);
        const defeated = new Enemy(50, 25);
        defeated.takeDamage(10);
        moving.update({ x: 96.5, y: 21.5, size: 32 }, world, 25,
            1, [moving, defeated]);
        expect(moving.x).toBe(26);
    });
});

describe("Wandering skeletons and thrown swords", function () {
    it("wanders independently of the player's position", function () {
        const world = new World(7, 3);
        for (let col = 1; col <= 5; col++) world.floor.set(col, 1, FLOOR.BRICK);
        const skeleton = new Enemy(50, 25, {},
            { type: "skeleton", speed: 1, random: () => 0 });
        skeleton.update({ x: 25, y: 21.5, size: 32 }, world, 25);
        expect(skeleton.x).toBe(51); // Wanders right, away from the player on the left.
    });

    it("throws a sword toward the player, then waits for its cooldown", function () {
        const world = new World(9, 3);
        for (let col = 1; col <= 7; col++) world.floor.set(col, 1, FLOOR.BRICK);
        const skeleton = new Enemy(50, 25, {}, { type: "skeleton", random: () => 0 });
        skeleton.throwCooldown = 0;
        const player = { x: 125, y: 21.5, size: 32 };
        const sword = skeleton.update(player, world, 25);
        expect(sword instanceof SwordProjectile).toBe(true);
        expect(sword.dx).toBeGreaterThan(0);
        expect(skeleton.update(player, world, 25)).toBe(null);
    });

    it("stops thrown swords when they reach a wall", function () {
        const world = new World(7, 3);
        world.floor.set(1, 1, FLOOR.BRICK);
        world.floor.set(2, 1, FLOOR.BRICK);
        const sword = new SwordProjectile(55, 37.5, 1, 0);
        for (let i = 0; i < 15; i++) sword.update({ x: 130, y: 25, size: 25 }, world, 25);
        expect(sword.done).toBe(true);
        expect(sword.x).toBeGreaterThan(74);
    });

    it("hits the player once and uses takeDamage when it exists", function () {
        const world = new World(7, 3);
        for (let col = 1; col <= 5; col++) world.floor.set(col, 1, FLOOR.BRICK);
        let hits = 0;
        const player = { x: 65, y: 25, size: 25, takeDamage: amount => hits += amount };
        const sword = new SwordProjectile(55, 37.5, 1, 0);
        for (let i = 0; i < 6; i++) sword.update(player, world, 25);
        expect(sword.done).toBe(true);
        expect(hits).toBe(1);
    });

});
