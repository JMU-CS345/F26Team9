import { createEnemyItemSprites, ENEMY_ITEM_PATH, createEnemySprites } from "../src/enemy.js";

describe("Enemy item artwork", function () {
    const sheet = { get: (x, y, w, h) => ({ x, y, w, h }) };

    it("crops each attack from the real item sheet", function () {
        const items = createEnemyItemSprites(sheet);
        expect(ENEMY_ITEM_PATH).toContain("enemy_items.png");
        expect(Object.keys(items).length).toBe(6);
        expect(items.sword[0]).toEqual({ x: 0, y: 200, w: 25, h: 25 });
        expect(items.knife[0].y).toBe(75);
        expect(items.slime[0].y).toBe(225);
        expect(items.echo[0].y).toBe(250);
        expect(items.bomb[0].y).toBe(175);
        expect(items.explosion[3].x).toBe(75);
    });

    it("loads special attack poses for slimes and bats", function () {
        expect(createEnemySprites(sheet, "slime").south.length).toBe(3);
        expect(createEnemySprites(sheet, "bat").south.length).toBe(3);
    });
});
