import { Enemy } from "../src/enemy.js";
import { EnemyProjectile } from "../src/enemyProjectile.js";

function skeleton(x = 50, y = 50, damage = 1) {
    return new Enemy(x, y, {}, { type: "skeleton", damage, random: () => 0 });
}

const nearbyPlayer = { x: 120, y: 50, size: 25 };

describe("Skeleton sword attacks", function () {
    it("waits for its initial cooldown before creating a sword", function () {
        const enemy = skeleton(50, 50, 2);
        const shots = [];
        for (let frame = 0; frame < 59; frame++) {
            enemy.updateSkeletonAttack(nearbyPlayer, shots);
        }
        expect(shots.length).toBe(0);
        enemy.updateSkeletonAttack(nearbyPlayer, shots);
        expect(shots.length).toBe(1);
        expect(shots[0] instanceof EnemyProjectile).toBe(true);
        expect(shots[0].kind).toBe("sword");
        expect(shots[0].damage).toBe(2);
        expect(shots[0].x).toBe(62.5);
        expect(shots[0].y).toBe(62.5);
    });

    it("aims at the player's center instead of always chasing", function () {
        const enemy = skeleton(25, 50);
        const shots = [];
        const player = { x: 85, y: 130, size: 25 };
        enemy.throwCooldown = 1;
        enemy.updateSkeletonAttack(player, shots);
        expect(Math.abs(shots[0].dx - 0.6) < 0.0001).toBe(true);
        expect(Math.abs(shots[0].dy - 0.8) < 0.0001).toBe(true);
        expect(enemy.x).toBe(25);
        expect(enemy.y).toBe(50);
        expect(enemy.direction).toBe("southeast");
    });

    it("never throws for other enemy types or dead skeletons", function () {
        const shots = [];
        for (const type of ["goblin", "slime", "bat"]) {
            const enemy = new Enemy(50, 50, {}, { type, random: () => 0 });
            enemy.updateSkeletonAttack(nearbyPlayer, shots, 3);
        }
        const dead = skeleton();
        dead.takeDamage(dead.health);
        dead.updateSkeletonAttack(nearbyPlayer, shots, 3);
        expect(shots.length).toBe(0);
    });

    it("only fires when the player is in range and not on top of it", function () {
        const enemy = skeleton();
        const shots = [];
        enemy.throwCooldown = 1;
        enemy.updateSkeletonAttack({ x: 500, y: 50, size: 25 }, shots);
        enemy.updateSkeletonAttack({ x: 50, y: 50, size: 25 }, shots);
        expect(shots.length).toBe(0);
        enemy.updateSkeletonAttack(nearbyPlayer, shots);
        expect(shots.length).toBe(1);
    });

    it("repeats after a 120-frame cooldown, not every frame", function () {
        const enemy = skeleton();
        const shots = [];
        enemy.throwCooldown = 1;
        enemy.updateSkeletonAttack(nearbyPlayer, shots);
        for (let frame = 0; frame < 119; frame++) {
            enemy.updateSkeletonAttack(nearbyPlayer, shots);
        }
        expect(shots.length).toBe(1);
        enemy.updateSkeletonAttack(nearbyPlayer, shots);
        expect(shots.length).toBe(2);
    });

    it("respects paused time and caps large frame delays", function () {
        const enemy = skeleton();
        const shots = [];
        enemy.throwCooldown = 2;
        enemy.updateSkeletonAttack(nearbyPlayer, shots, 0);
        enemy.updateSkeletonAttack(nearbyPlayer, shots, -5);
        expect(enemy.throwCooldown).toBe(2);
        enemy.updateSkeletonAttack(nearbyPlayer, shots, 100);
        expect(shots.length).toBe(1);
        enemy.updateSkeletonAttack(nearbyPlayer, shots, 0);
        expect(enemy.throwCooldown).toBe(120);
    });

    it("starts skeletons at different cooldowns when randomized", function () {
        const first = skeleton();
        const second = new Enemy(50, 50, {}, { type: "skeleton", random: () => 1 });
        expect(first.throwCooldown).toBe(60);
        expect(second.throwCooldown).toBe(120);
    });
});
