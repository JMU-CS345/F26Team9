import { spawnEnemies, Enemy } from "../src/enemy.js";
import { World, FLOOR, createRandom, generateWorld } from "../src/worldGenerator.js";

describe("Enemy room spawning", function () {
    it("skips the starting room and uses floor tiles", function () {
        const world = new World(16, 9);
        world.rooms = [{ x: 1, y: 1, w: 5, h: 5 }, { x: 9, y: 1, w: 5, h: 5 }];
        for (const room of world.rooms)
            for (let x = room.x; x < room.x + room.w; x++)
                for (let y = room.y; y < room.y + room.h; y++)
                    world.floor.set(x, y, FLOOR.BRICK);
        const enemies = spawnEnemies(world, 25, {}, () => 0.5);
        expect(enemies.length).toBe(1);
        expect(enemies[0] instanceof Enemy).toBe(true);
        expect(enemies[0].maxHealth).toBe(2);
        expect(enemies[0].x).toBeGreaterThan(9 * 25);
    });

    it("spawns in multiple seeded generated dungeons", function () {
        for (let seed = 1; seed <= 10; seed++) {
            const world = generateWorld(64, 40, createRandom(seed), { maxRooms: 14 });
            const enemies = spawnEnemies(world, 25, {}, createRandom(seed));
            expect(enemies.length).toBe(world.rooms.length - 1);
            for (const enemy of enemies) {
                expect(world.isFloor(Math.floor((enemy.x + 12.5) / 25),
                    Math.floor((enemy.y + 12.5) / 25))).toBe(true);
            }
        }
    });
    it("assigns four enemy types and varied walking speeds", function () {
        const world = generateWorld(64, 40, createRandom(23), { maxRooms: 14 });
        const enemies = spawnEnemies(world, 25, {}, createRandom(99));
        expect(new Set(enemies.map(enemy => enemy.type)).size).toBe(4);
        expect(new Set(enemies.map(enemy => enemy.speed)).size).toBeGreaterThan(1);
        for (const enemy of enemies) {
            expect(enemy.speed).toBeGreaterThanOrEqual(0.85);
            expect(enemy.speed).toBeLessThanOrEqual(1.15);
            const col = Math.floor((enemy.x + 12.5) / 25);
            const row = Math.floor((enemy.y + 12.5) / 25);
            expect(world.isWall(col, row)).toBe(false);
        }
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const dx = Math.abs(enemies[i].x - enemies[j].x);
                const dy = Math.abs(enemies[i].y - enemies[j].y);
                expect(dx >= 25 || dy >= 25).toBe(true);
            }
        }
    });

});
