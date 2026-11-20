import { Enemy, createEnemyItemSprites } from "../src/enemy.js";
import { EnemyProjectile } from "../src/enemyProjectile.js";
import { World, FLOOR, WALL } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";
import { Player } from "../src/player.js";

function goblin(x = 50, y = 75, damage = 2) {
    return new Enemy(x, y, {}, { type: "goblin", damage, random: () => 0 });
}
const player = { x: 125, y: 75, size: 25, stats: { isAlive: () => true } };

function hallway(wall = false) {
    const world = new World(15, 7);
    for (let x = 1; x < 14; x++) world.floor.set(x, 3, FLOOR.BRICK);
    if (wall) world.walls.set(4, 3, WALL.STONE);
    return { world, walls: new WallCollider(world, 25) };
}

describe("Goblin knife attacks", function () {
    it("waits for its randomized initial cooldown", function () {
        const enemy = goblin();
        const shots = [];
        expect(enemy.knifeCooldown).toBe(90);
        for (let i = 0; i < 89; i++) enemy.updateGoblinAttack(player, shots);
        expect(shots.length).toBe(0);
        enemy.updateGoblinAttack(player, shots);
        expect(shots.length).toBe(1);
        const slower = new Enemy(50, 75, {}, { type: "goblin", random: () => 1 });
        expect(slower.knifeCooldown).toBe(180);
    });

    it("aims a knife at the player without moving the goblin", function () {
        const enemy = goblin(25, 50, 3);
        const shots = [];
        enemy.knifeCooldown = 1;
        enemy.updateGoblinAttack({ x: 85, y: 130, size: 25 }, shots);
        expect(shots[0] instanceof EnemyProjectile).toBe(true);
        expect(shots[0].kind).toBe("knife");
        expect(shots[0].damage).toBe(3);
        expect(Math.abs(shots[0].dx - 0.6) < 0.0001).toBe(true);
        expect(Math.abs(shots[0].dy - 0.8) < 0.0001).toBe(true);
        expect([enemy.x, enemy.y]).toEqual([25, 50]);
    });

    it("never throws from other types, dead goblins, or at dead players", function () {
        const shots = [];
        for (const type of ["skeleton", "slime", "bat"]) {
            const enemy = new Enemy(50, 75, {}, { type, random: () => 0 });
            enemy.updateGoblinAttack(player, shots, 3);
        }
        const dead = goblin();
        dead.takeDamage(10);
        dead.updateGoblinAttack(player, shots, 3);
        const enemy = goblin();
        enemy.knifeCooldown = 1;
        enemy.updateGoblinAttack({ ...player, stats: { isAlive: () => false } }, shots);
        expect(shots.length).toBe(0);
    });

    it("only attacks when the player is within range", function () {
        const enemy = goblin();
        const shots = [];
        enemy.knifeCooldown = 1;
        enemy.updateGoblinAttack({ x: 450, y: 75, size: 25 }, shots);
        enemy.updateGoblinAttack({ x: 50, y: 75, size: 25 }, shots);
        expect(shots.length).toBe(0);
        enemy.updateGoblinAttack(player, shots);
        expect(shots.length).toBe(1);
    });

    it("respects paused time and repeats after its cooldown", function () {
        const enemy = goblin();
        const shots = [];
        enemy.knifeCooldown = 2;
        enemy.updateGoblinAttack(player, shots, 0);
        enemy.updateGoblinAttack(player, shots, NaN);
        expect(enemy.knifeCooldown).toBe(2);
        enemy.updateGoblinAttack(player, shots, 100); // Clamps to three frames.
        expect(shots.length).toBe(1);
        for (let i = 0; i < 149; i++) enemy.updateGoblinAttack(player, shots);
        expect(shots.length).toBe(1);
        enemy.updateGoblinAttack(player, shots);
        expect(shots.length).toBe(2);
    });

    it("uses the knife artwork already cropped from enemy_items.png", function () {
        const sprites = createEnemyItemSprites({ get: (x, y) => ({ x, y }) });
        expect(sprites.knife.length).toBe(4);
        expect(sprites.knife[0]).toEqual({ x: 0, y: 75 });
        expect(sprites.knife[3]).toEqual({ x: 75, y: 75 });
    });

    it("damages the player once and stops knives at walls", function () {
        for (const hasWall of [false, true]) {
            const { world, walls } = hallway(hasWall);
            const enemy = goblin(50, 75, 4);
            const target = new Player(200, 75);
            const shots = [];
            enemy.knifeCooldown = 1;
            enemy.updateGoblinAttack(target, shots);
            for (let i = 0; i < 80 && !shots[0].done; i++) {
                shots[0].update(1, walls, world, 25, target);
            }
            expect(shots[0].done).toBe(true);
            expect(target.stats.health).toBe(hasWall ? 100 : 96);
        }
    });
});
