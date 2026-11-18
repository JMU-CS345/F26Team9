import { EnemyBomb } from "../src/enemyBomb.js";
import { Player } from "../src/player.js";
import { createEnemyItemSprites } from "../src/enemy.js";
import { World, FLOOR, WALL } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";

function arena(block = false) {
    const world = new World(14, 7);
    for (let y = 1; y < 6; y++) for (let x = 1; x < 13; x++) {
        world.floor.set(x, y, FLOOR.BRICK);
    }
    if (block) {
        world.floor.set(5, 3, FLOOR.EMPTY);
        world.walls.set(5, 3, WALL.STONE);
    }
    return { world, walls: new WallCollider(world, 25) };
}

function detonate(bomb, player, scene) {
    for (let i = 0; i < 120; i++) {
        bomb.update(1, player, scene.walls, scene.world, 25);
    }
}

describe("Goblin bomb explosions", function () {
    it("deals area damage only when the two-second fuse ends", function () {
        const scene = arena(), player = new Player(120, 72);
        const bomb = new EnemyBomb(100, 88, 7);
        for (let i = 0; i < 119; i++) bomb.update(1, player, scene.walls, scene.world, 25);
        expect(player.stats.health).toBe(100);
        bomb.update(1, player, scene.walls, scene.world, 25);
        expect(bomb.exploding).toBe(true);
        expect(player.stats.health).toBe(93);
    });
    it("damages once, then finishes its explosion animation", function () {
        const scene = arena(), player = new Player(120, 72);
        const bomb = new EnemyBomb(100, 88, 5);
        detonate(bomb, player, scene);
        bomb.update(12, player, scene.walls, scene.world, 25); // Capped to 3 frames.
        expect(player.stats.health).toBe(95);
        for (let i = 0; i < 21; i++) bomb.update(1, player, scene.walls, scene.world, 25);
        expect(bomb.done).toBe(true);
        bomb.update(1, player, scene.walls, scene.world, 25);
        expect(player.stats.health).toBe(95);
    });
    it("does not damage a player outside the blast radius", function () {
        const scene = arena(), player = new Player(225, 72);
        detonate(new EnemyBomb(100, 88, 8), player, scene);
        expect(player.stats.health).toBe(100);
    });
    it("blocks blast damage through solid walls and missing floor", function () {
        for (const barrier of ["wall", "gap"]) {
            const scene = arena(true), player = new Player(151, 72);
            if (barrier === "wall") scene.world.floor.set(5, 3, FLOOR.BRICK);
            else scene.world.walls.set(5, 3, WALL.NONE);
            detonate(new EnemyBomb(113, 88, 9), player, scene);
            expect(player.stats.health).toBe(100);
        }
        const clear = arena(), openPlayer = new Player(151, 72);
        detonate(new EnemyBomb(113, 88, 9), openPlayer, clear);
        expect(openPlayer.stats.health).toBe(91);
    });

    it("freezes fuse and explosion animations while paused", function () {
        const scene = arena(), player = new Player(120, 72);
        const bomb = new EnemyBomb(100, 88, 1);
        bomb.update(0, player, scene.walls, scene.world, 25);
        expect(bomb.fuse).toBe(120);
        detonate(bomb, player, scene);
        bomb.update(0, player, scene.walls, scene.world, 25);
        expect(bomb.explosionFrames).toBe(24);
    });

    it("renders real bomb and explosion sprites from enemy_items.png", function () {
        const scene = arena(), player = new Player(120, 72);
        const sprites = createEnemyItemSprites({ get: (x, y) => ({ x, y }) });
        const bomb = new EnemyBomb(100, 88);
        const previous = [globalThis.push, globalThis.pop, globalThis.imageMode,
            globalThis.image, globalThis.CENTER];
        const drawn = [];
        globalThis.push = () => {};
        globalThis.pop = () => {};
        globalThis.imageMode = () => {};
        globalThis.CENTER = "CENTER";
        globalThis.image = (...args) => drawn.push(args);
        try {
            bomb.display(sprites);
            detonate(bomb, player, scene);
            bomb.display(sprites);
            expect(drawn[0][0]).toEqual({ x: 0, y: 175 });
            expect(drawn[1][0]).toEqual({ x: 0, y: 325 });
            expect(drawn[1][3]).toBe(100);
        } finally {
            [globalThis.push, globalThis.pop, globalThis.imageMode,
                globalThis.image, globalThis.CENTER] = previous;
        }
    });
});
