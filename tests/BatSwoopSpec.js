import { Enemy } from "../src/enemy.js";
import { World, FLOOR, WALL } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";

function arena() {
    const world = new World(12, 7);
    for (let y = 1; y <= 5; y++) {
        for (let x = 1; x <= 10; x++) world.floor.set(x, y, FLOOR.BRICK);
    }
    return { world, walls: new WallCollider(world, 25) };
}

function bat(x = 50, y = 75) {
    return new Enemy(x, y, { south: [{}, {}, { id: "attack" }] },
        { type: "bat", damage: 4, random: () => 0 });
}

function player(x = 150, y = 75) {
    const p = { x, y, size: 25, hits: 0, health: 50 };
    p.takeDamage = amount => { p.hits++; p.health -= amount; };
    p.stats = { isAlive: () => p.health > 0 };
    return p;
}

describe("Bat swoop attacks", function () {
    it("damages only once per swoop, then returns to wandering", function () {
        const { world, walls } = arena();
        const enemy = bat();
        const p = player(95, 75);
        enemy.swoopCooldown = 1;
        enemy.updateBatSwoop(p, world, 25, walls);
        expect(enemy.x).toBe(58); // Swooping is much faster than wandering.
        for (let i = 1; i < 30; i++) enemy.updateBatSwoop(p, world, 25, walls);
        expect(p.hits).toBe(1);
        expect(p.health).toBe(46);
        expect(enemy.updateBatSwoop(p, world, 25, walls)).toBe(false);
    });

    it("stops at walls instead of passing through", function () {
        const { world, walls } = arena();
        world.floor.set(4, 3, 0);
        world.walls.set(4, 3, WALL.STONE);
        const enemy = bat();
        enemy.swoopCooldown = 1;
        for (let i = 0; i < 20; i++) enemy.updateBatSwoop(player(), world, 25, walls);
        expect(enemy.x + enemy.size <= 100).toBe(true);
    });

    it("does not pass through other enemies or rush on paused frames", function () {
        const { world, walls } = arena();
        const enemy = bat();
        const blocker = new Enemy(80, 75);
        enemy.swoopCooldown = 1;
        expect(enemy.updateBatSwoop(player(), world, 25, walls, [enemy, blocker], 0)).toBe(false);
        expect(enemy.swoopCooldown).toBe(1);
        enemy.updateBatSwoop(player(), world, 25, walls, [enemy, blocker]);
        expect(enemy.x + enemy.size <= blocker.x).toBe(true);
    });

    it("uses the attack pose and echo sprites only during swoops", function () {
        const { world, walls } = arena();
        const enemy = bat();
        enemy.swoopCooldown = 1;
        enemy.updateBatSwoop(player(), world, 25, walls);
        enemy.direction = "south";
        expect(enemy.getCurrentSprite().id).toBe("attack");
        enemy.swoopFrames = 0;
        expect(enemy.getCurrentSprite().id).toBe(undefined);
    });
});
