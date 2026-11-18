import { EnemyProjectile } from "../src/enemyProjectile.js";
import { Player } from "../src/player.js";
import { Enemy } from "../src/enemy.js";
import { World, FLOOR, WALL } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";

function hallway() {
    const world = new World(24, 7);
    for (let col = 0; col < 24; col++) world.floor.set(col, 3, FLOOR.BRICK);
    return { world, walls: new WallCollider(world, 25) };
}

function moveUntilDone(shot, walls, world, player, scale = 1) {
    for (let frame = 0; frame < 100 && !shot.done; frame++) {
        shot.update(scale, walls, world, 25, player);
    }
}

describe("Enemy projectile damage", function () {
    it("damages the player's body and removes a sword after one hit", function () {
        const { world, walls } = hallway();
        const player = new Player(100, 72);
        const sword = new EnemyProjectile(40, 88, 1, 0, "sword", 7);
        moveUntilDone(sword, walls, world, player);
        expect(player.stats.health).toBe(93);
        expect(sword.done).toBe(true);
        sword.update(3, walls, world, 25, player);
        expect(player.stats.health).toBe(93);
    });

    it("misses players who are outside the projectile's path", function () {
        const { world, walls } = hallway();
        const player = new Player(100, 120);
        const sword = new EnemyProjectile(40, 88, 1, 0, "sword", 9);
        moveUntilDone(sword, walls, world, player);
        expect(player.stats.health).toBe(100);
        expect(sword.distance >= 220).toBe(true);
    });

    it("does not damage a player through a wall", function () {
        const { world } = hallway();
        world.walls.set(8, 3, WALL.STONE);
        const walls = new WallCollider(world, 25);
        const player = new Player(225, 72);
        const sword = new EnemyProjectile(90, 88, 1, 0, "sword", 12);
        moveUntilDone(sword, walls, world, player);
        expect(sword.done).toBe(true);
        expect(sword.x < 200).toBe(true);
        expect(player.stats.health).toBe(100);
    });

    it("detects a hit at low FPS without skipping past the player", function () {
        const { world, walls } = hallway();
        const player = new Player(100, 72);
        const sword = new EnemyProjectile(40, 88, 1, 0, "sword", 3);
        moveUntilDone(sword, walls, world, player, 3);
        expect(player.stats.health).toBe(97);
        expect(sword.done).toBe(true);
    });

    it("does not move or deal damage during paused updates", function () {
        const { world, walls } = hallway();
        const player = new Player(42, 72);
        const sword = new EnemyProjectile(40, 88, 1, 0, "sword", 4);
        sword.update(0, walls, world, 25, player);
        expect(sword.x).toBe(40);
        expect(player.stats.health).toBe(100);
        sword.update(1, walls, world, 25, player);
        expect(player.stats.health).toBe(96);
    });

    it("also supports knife and slime-ball hits using the same logic", function () {
        for (const kind of ["knife", "slime"]) {
            const { world, walls } = hallway();
            const player = new Player(100, 72);
            const shot = new EnemyProjectile(40, 88, 1, 0, kind, 6);
            moveUntilDone(shot, walls, world, player);
            expect(player.stats.health).toBe(94);
            expect(shot.done).toBe(true);
        }
    });

    it("connects a real skeleton throw to the player's health", function () {
        const { world, walls } = hallway();
        const player = new Player(100, 72);
        const skeleton = new Enemy(40, 75, {}, {
            type: "skeleton", damage: 9, random: () => 0
        });
        const shots = [];
        skeleton.throwCooldown = 1;
        skeleton.updateSkeletonAttack(player, shots, 1);
        expect(shots.length).toBe(1);
        moveUntilDone(shots[0], walls, world, player);
        expect(player.stats.health).toBe(91);
        expect(shots[0].done).toBe(true);
    });

    it("keeps an already defeated player's health at zero", function () {
        const { world, walls } = hallway();
        const player = new Player(100, 72);
        player.takeDamage(100);
        const sword = new EnemyProjectile(40, 88, 1, 0, "sword", 5);
        moveUntilDone(sword, walls, world, player);
        expect(player.stats.health).toBe(0);
    });
});
