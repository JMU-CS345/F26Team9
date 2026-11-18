import { EnemyProjectile } from "../src/enemyProjectile.js";
import { World, FLOOR, WALL } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";

function corridor() {
    const world = new World(9, 5);
    for (let col = 1; col <= 5; col++) world.floor.set(col, 2, FLOOR.BRICK);
    world.walls.set(6, 2, WALL.STONE);
    return { world, walls: new WallCollider(world, 25) };
}

describe("Enemy projectiles", function () {
    it("normalizes direction and scales movement with frame time", function () {
        const { world, walls } = corridor();
        const shot = new EnemyProjectile(55, 62, 3, 4, "sword");
        shot.update(2, walls, world, 25);
        expect(Math.abs(shot.x - 59.8) < 0.001).toBe(true);
        expect(Math.abs(shot.y - 68.4) < 0.001).toBe(true);
        shot.update(0, walls, world, 25);
        expect(Math.abs(shot.x - 59.8) < 0.001).toBe(true);
    });

    it("stops a sword against walls without tunneling at low FPS", function () {
        const { world, walls } = corridor();
        const sword = new EnemyProjectile(135, 62, 1, 0);
        sword.update(3, walls, world, 25);
        expect(sword.done).toBe(true);
        expect(sword.x < 150).toBe(true);
    });

    it("bounces a slime ball twice and breaks on the third wall hit", function () {
        const world = new World(4, 3);
        for (let col = 1; col <= 2; col++) world.floor.set(col, 1, FLOOR.BRICK);
        const ball = new EnemyProjectile(50, 37.5, 1, 0, "slime");
        const walls = new WallCollider(world, 25);
        for (let i = 0; i < 100 && !ball.done; i++) ball.update(1, walls, world, 25);
        expect(ball.bounces).toBe(3);
        expect(ball.done).toBe(true);
    });

    it("expires a projectile after its maximum travel distance", function () {
        const world = new World(30, 5);
        for (let col = 0; col < 30; col++) world.floor.set(col, 2, FLOOR.BRICK);
        const shot = new EnemyProjectile(20, 62, 1, 0, "knife");
        const walls = new WallCollider(world, 25);
        for (let i = 0; i < 80 && !shot.done; i++) shot.update(1, walls, world, 25);
        expect(shot.done).toBe(true);
        expect(shot.distance >= 220).toBe(true);
    });
});
