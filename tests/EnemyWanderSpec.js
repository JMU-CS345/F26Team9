import { Enemy, spawnEnemies } from "../src/enemy.js";
import { World, FLOOR, WALL, createRandom, generateWorld } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";

/** A narrow floor strip makes the possible movement directions predictable. */
function strip() {
    const world = new World(9, 5);
    for (let col = 1; col <= 7; col++) world.floor.set(col, 2, FLOOR.BRICK);
    return world;
}

describe("Enemy wandering", function () {
    it("moves between floor centers at its configured speed", function () {
        const world = strip();
        const walls = new WallCollider(world, 25);
        const slow = new Enemy(50, 50, {}, { speed: 1, random: () => 0 });
        const fast = new Enemy(50, 50, {}, { speed: 2, random: () => 0 });
        for (let i = 0; i < 10; i++) {
            slow.updateWander(world, 25, walls);
            fast.updateWander(world, 25, walls);
        }
        expect(slow.x).toBe(60);
        expect(fast.x).toBe(70);
        expect(slow.direction).toBe("east");
        expect(slow.isMoving).toBe(true);
    });

    it("uses frame time and stays frozen without an update", function () {
        const world = strip();
        const walls = new WallCollider(world, 25);
        const enemy = new Enemy(50, 50, {}, { speed: 1, random: () => 0 });
        enemy.updateWander(world, 25, walls, [], 2);
        expect(enemy.x).toBe(52);
        enemy.updateWander(world, 25, walls, [], 0);
        expect(enemy.x).toBe(52);
        enemy.updateWander(world, 25, walls, [], 100);
        expect(enemy.x).toBe(55); // Large frame delays are capped at 3.
    });

    it("never moves through the wall at the end of a corridor", function () {
        const world = strip();
        world.walls.set(8, 2, WALL.STONE);
        const walls = new WallCollider(world, 25);
        const enemy = new Enemy(150, 50, {}, { random: () => 0 });
        for (let i = 0; i < 250; i++) {
            enemy.updateWander(world, 25, walls);
            expect(walls.hits(enemy.getHitbox()).length).toBe(0);
            expect(enemy.x).toBeLessThanOrEqual(175);
            expect(enemy.x).toBeGreaterThanOrEqual(25);
        }
    });

    it("keeps two enemies from overlapping while they walk", function () {
        const world = strip();
        const walls = new WallCollider(world, 25);
        const left = new Enemy(50, 50, {}, { random: () => 0 });
        const right = new Enemy(100, 50, {}, { random: () => 0.75 });
        const enemies = [left, right];
        for (let frame = 0; frame < 120; frame++) {
            for (const enemy of enemies) enemy.updateWander(world, 25, walls, enemies);
            expect(left.x + left.size <= right.x || right.x + right.size <= left.x).toBe(true);
        }
    });

    it("stays on valid, non-overlapping tiles in generated dungeons", function () {
        for (let seed = 1; seed <= 12; seed++) {
            const world = generateWorld(64, 40, createRandom(seed), { maxRooms: 14 });
            const walls = new WallCollider(world, 25);
            const enemies = spawnEnemies(world, 25, {}, createRandom(seed + 30));
            for (let frame = 0; frame < 100; frame++) {
                for (const enemy of enemies) enemy.updateWander(world, 25, walls, enemies);
                for (let i = 0; i < enemies.length; i++) {
                    const a = enemies[i];
                    expect(walls.hits(a.getHitbox()).length).toBe(0);
                    expect(world.isFloor(Math.floor((a.x + 12.5) / 25),
                        Math.floor((a.y + 12.5) / 25))).toBe(true);
                    for (let j = i + 1; j < enemies.length; j++) {
                        const b = enemies[j];
                        expect(a.x + a.size <= b.x || b.x + b.size <= a.x ||
                            a.y + a.size <= b.y || b.y + b.size <= a.y).toBe(true);
                    }
                }
            }
        }
    });
});
