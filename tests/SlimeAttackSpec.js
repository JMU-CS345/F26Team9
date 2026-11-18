import { Enemy } from "../src/enemy.js";
import { EnemyProjectile } from "../src/enemyProjectile.js";
import { World, FLOOR } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";

function hallway() {
    const world = new World(9, 5);
    for (let col = 1; col <= 7; col++) world.floor.set(col, 2, FLOOR.BRICK);
    return { world, walls: new WallCollider(world, 25) };
}

function slime() {
    return new Enemy(50, 50, {}, { type: "slime", speed: 5, damage: 3, random: () => 0 });
}

const player = { x: 125, y: 50, size: 25 };

describe("Slime hopping attacks", function () {
    it("fires exactly two slime balls on landing, not while traveling", function () {
        const { world, walls } = hallway();
        const enemy = slime();
        const shots = [];
        for (let i = 0; i < 4; i++) {
            enemy.updateSlimeAttack(player, shots, enemy.updateWander(world, 25, walls));
        }
        expect(shots.length).toBe(0);
        enemy.updateSlimeAttack(player, shots, enemy.updateWander(world, 25, walls));
        expect(shots.length).toBe(2);
        expect(shots[0] instanceof EnemyProjectile).toBe(true);
        expect(shots[0].kind).toBe("slime");
        expect(shots[1].damage).toBe(3);
        expect(shots[0].x).toBe(87.5);
    });

    it("spreads shots around the direction to the player", function () {
        const enemy = slime();
        const shots = [];
        enemy.updateSlimeAttack(player, shots, true);
        expect(shots[0].dx > 0).toBe(true);
        expect(shots[1].dx > 0).toBe(true);
        expect(shots[0].dy < 0).toBe(true);
        expect(shots[1].dy > 0).toBe(true);
    });

    it("waits between hops and does not fire again while resting", function () {
        const { world, walls } = hallway();
        const enemy = slime();
        const shots = [];
        enemy.updateSlimeAttack(player, shots, true);
        for (let i = 0; i < 45; i++) {
            enemy.updateSlimeAttack(player, shots, enemy.updateWander(world, 25, walls));
        }
        expect(enemy.x).toBe(50);
        expect(shots.length).toBe(2);
        expect(enemy.hopPause).toBe(0);
        enemy.updateWander(world, 25, walls);
        expect(enemy.x).toBe(55);
    });

    it("does not attack when dead, unlanded, or a different enemy", function () {
        const shots = [];
        const enemy = slime();
        enemy.updateSlimeAttack(player, shots, false);
        enemy.takeDamage(enemy.health);
        enemy.updateSlimeAttack(player, shots, true);
        new Enemy(50, 50, {}, { type: "skeleton" }).updateSlimeAttack(player, shots, true);
        expect(shots.length).toBe(0);
    });

    it("fires again after the next hop, but not on paused frames", function () {
        const { world, walls } = hallway();
        const enemy = slime();
        const shots = [];
        for (let i = 0; i < 5; i++) {
            enemy.updateSlimeAttack(player, shots, enemy.updateWander(world, 25, walls));
        }
        enemy.updateWander(world, 25, walls, [], 0);
        expect(enemy.hopPause).toBe(45);
        for (let i = 0; i < 50; i++) {
            enemy.updateSlimeAttack(player, shots, enemy.updateWander(world, 25, walls));
        }
        expect(shots.length).toBe(4);
    });

    it("uses the hopping sprite only while moving", function () {
        const frames = [{ id: 0 }, { id: 1 }, { id: 2 }];
        const enemy = new Enemy(50, 50, { south: frames }, { type: "slime" });
        expect(enemy.getCurrentSprite()).toBe(frames[0]);
        enemy.isMoving = true;
        expect(enemy.getCurrentSprite()).toBe(frames[2]);
        enemy.isMoving = false;
        expect(enemy.getCurrentSprite()).toBe(frames[0]);
    });

    it("makes real slime balls that bounce twice before breaking", function () {
        const { world, walls } = hallway();
        const shots = [];
        slime().updateSlimeAttack(player, shots, true);
        for (const shot of shots) {
            for (let i = 0; i < 200 && !shot.done; i++) shot.update(1, walls, world, 25);
            expect(shot.bounces).toBe(3);
            expect(shot.done).toBe(true);
        }
    });
});
