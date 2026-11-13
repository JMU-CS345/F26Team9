import { Entity } from "../src/entity.js";
import { Enemy, createEnemySprites, ENEMY_SPRITE_PATH } from "../src/enemy.js";

describe("Enemy", function () {
    it("inherits Entity's movement and display behavior", function () {
        const enemy = new Enemy(50, 60);
        expect(enemy instanceof Entity).toBe(true);
        expect(enemy.size).toBe(25);
        enemy.move(1, 0, 200, 200);
        expect(enemy.x).toBe(51);
        expect(enemy.direction).toBe("east");
    });

    it("starts with default health, speed, and damage", function () {
        const enemy = new Enemy(0, 0);
        expect(enemy.health).toBe(3);
        expect(enemy.maxHealth).toBe(3);
        expect(enemy.speed).toBe(1);
        expect(enemy.damage).toBe(1);
        expect(enemy.isAlive()).toBe(true);
    });

    it("allows different stats for different enemies", function () {
        const enemy = new Enemy(0, 0, {}, { health: 8, speed: 2, damage: 3 });
        expect(enemy.health).toBe(8);
        expect(enemy.maxHealth).toBe(8);
        expect(enemy.speed).toBe(2);
        expect(enemy.damage).toBe(3);
    });

    it("takes damage, ignores negative damage, and cannot go below zero", function () {
        const enemy = new Enemy(0, 0);
        enemy.takeDamage(1);
        expect(enemy.health).toBe(2);
        enemy.takeDamage(-5);
        expect(enemy.health).toBe(2);
        enemy.takeDamage(10);
        expect(enemy.health).toBe(0);
        expect(enemy.isAlive()).toBe(false);
    });
});

describe("Enemy sprite sheet", function () {
    // Records which rectangles would be cropped without needing a p5 canvas.
    const sheet = {
        get(x, y, width, height) { return { x, y, width, height }; }
    };

    it("uses the existing enemy artwork", function () {
        expect(ENEMY_SPRITE_PATH.includes("enemy_sprites")).toBe(true);
    });

    it("loads two frames for each of the eight directions", function () {
        const sprites = createEnemySprites(sheet, "skeleton");
        expect(Object.keys(sprites).length).toBe(8);
        expect(sprites.south[0]).toEqual({ x: 0, y: 0, width: 25, height: 25 });
        expect(sprites.east[1]).toEqual({ x: 25, y: 50, width: 25, height: 25 });
        expect(sprites.north[0].y).toBe(100);
    });

    it("selects the correct rows for each enemy type", function () {
        expect(createEnemySprites(sheet, "goblin").south[0].y).toBe(200);
        expect(createEnemySprites(sheet, "slime").south[0].y).toBe(400);
        expect(createEnemySprites(sheet, "bat").south[0].y).toBe(600);
    });

    it("passes the sprite frames to Entity's existing animation", function () {
        const sprites = createEnemySprites(sheet);
        const enemy = new Enemy(50, 50, sprites);
        enemy.move(1, 0, 300, 300);
        expect(enemy.getCurrentSprite()).toBe(sprites.east[0]);
        for (let i = 1; i < 8; i++) enemy.move(1, 0, 300, 300);
        expect(enemy.getCurrentSprite()).toBe(sprites.east[1]);
    });

    it("rejects unknown enemy types", function () {
        expect(() => createEnemySprites(sheet, "dragon")).toThrowError();
    });
});
