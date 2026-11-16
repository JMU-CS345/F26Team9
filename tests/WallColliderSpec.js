import { WallCollider } from "../src/wallCollider.js";
import { World, WALL } from "../src/worldGenerator.js";
import { Player } from "../src/player.js";
import { SpellCaster } from "../src/spellCaster.js";
import { Projectile, DIRECTION_VECTORS } from "../src/spellEffects.js";

/** Jasmine unit tests for wall collision. */
describe("Wall collision", function () {
    // 25px tiles; the wall band covers pixels 9 to 16 of each tile.
    const TILE = 25;

    // An empty 12 x 12 world with walls placed by hand.
    function worldWith(wallTiles) {
        const world = new World(12, 12);
        for (const [col, row] of wallTiles) world.walls.set(col, row, WALL.STONE);
        return world;
    }

    // A vertical wall in column 6 from row 0 to row 11.
    function verticalWall() {
        const tiles = [];
        for (let row = 0; row < 12; row++) tiles.push([6, row]);
        return new WallCollider(worldWith(tiles), TILE);
    }

    // A horizontal wall in row 6 from column 0 to column 11.
    function horizontalWall() {
        const tiles = [];
        for (let col = 0; col < 12; col++) tiles.push([col, 6]);
        return new WallCollider(worldWith(tiles), TILE);
    }

    describe("WallCollider", function () {
        it("makes a lone wall tile a small square in the middle of the tile", function () {
            const walls = new WallCollider(worldWith([[2, 3]]), TILE);
            expect(walls.solidRects(2, 3)).toEqual([{ x: 59, y: 84, w: 7, h: 7 }]);
            expect(walls.solidRects(0, 0)).toEqual([]);
        });

        it("adds an arm toward each neighboring wall", function () {
            const walls = new WallCollider(worldWith([[2, 2], [3, 2], [2, 3]]), TILE);
            const rects = walls.solidRects(2, 2);
            expect(rects.length).toBe(3);
            expect(rects).toContain({ x: 66, y: 59, w: 9, h: 7 });   // east arm
            expect(rects).toContain({ x: 59, y: 66, w: 7, h: 9 });   // south arm
        });

        it("blocks points on the wall band but not the rest of the tile", function () {
            const walls = verticalWall();
            expect(walls.blocksPoint(6 * TILE + 12, 100)).toBe(true);
            expect(walls.blocksPoint(6 * TILE + 2, 100)).toBe(false);
            expect(walls.blocksPoint(6 * TILE + 20, 100)).toBe(false);
        });

        it("does not count a box touching a wall's edge as a hit", function () {
            const walls = verticalWall();
            const wallLeft = 6 * TILE + 9;
            expect(walls.hits({ x: wallLeft - 10, y: 100, w: 10, h: 10 }).length).toBe(0);
            expect(walls.hits({ x: wallLeft - 9, y: 100, w: 10, h: 10 }).length).toBeGreaterThan(0);
        });

        it("finds how far a ray travels before it reaches a wall", function () {
            const walls = verticalWall();
            const distance = walls.castRay(100, 100, DIRECTION_VECTORS.east, 300);
            expect(distance).toBeGreaterThan(6 * TILE + 9 - 100 - 3);
            expect(distance).toBeLessThanOrEqual(6 * TILE + 9 - 100);
            expect(walls.castRay(100, 100, DIRECTION_VECTORS.west, 50)).toBe(50);
        });
    });

    describe("player movement", function () {
        function walkRight(player, walls, frames) {
            for (let i = 0; i < frames; i++) player.moveSmooth(1, 0, 1000, 1000, 1, walls);
        }

        it("stops the player's feet flush against a wall", function () {
            const walls = verticalWall();
            const player = new Player(60, 100);
            walkRight(player, walls, 120);
            const feet = player.getHitbox();
            expect(feet.x + feet.w).toBe(6 * TILE + 9);
            expect(player.vx).toBe(0);
        });

        it("stops the player walking up into a wall with their head overlapping it", function () {
            const walls = horizontalWall();
            const player = new Player(100, 220);
            for (let i = 0; i < 120; i++) player.moveSmooth(0, -1, 1000, 1000, 1, walls);
            expect(player.getHitbox().y).toBe(6 * TILE + 16);
            // The sprite's top is above the wall's bottom edge.
            expect(player.y).toBeLessThan(6 * TILE + 16);
        });

        it("slides along a wall when moving diagonally into it", function () {
            const walls = verticalWall();
            const player = new Player(100, 100);
            for (let i = 0; i < 60; i++) player.moveSmooth(1, 1, 1000, 1000, 1, walls);
            const feet = player.getHitbox();
            expect(feet.x + feet.w).toBe(6 * TILE + 9);
            expect(player.y).toBeGreaterThan(150);
        });

        it("can walk through a gap in a wall", function () {
            const tiles = [];
            for (let row = 0; row < 12; row++) if (row !== 4 && row !== 5) tiles.push([6, row]);
            const walls = new WallCollider(worldWith(tiles), TILE);
            const player = new Player(60, 4 * TILE + 5);
            walkRight(player, walls, 120);
            expect(player.x).toBeGreaterThan(7 * TILE);
        });

        it("still moves freely without walls", function () {
            const player = new Player(60, 100);
            walkRight(player, null, 120);
            expect(player.x).toBeGreaterThan(7 * TILE);
        });
    });

    describe("spells", function () {
        const art = { fireball: {}, iceball: {}, sparkle: {} };

        it("explodes a bolt when it reaches a wall", function () {
            const walls = verticalWall();
            const bolt = new Projectile(100, 100, DIRECTION_VECTORS.east,
                { sheet: {}, speed: 4, range: 1000, lightRadius: 100, lightColor: [1, 1, 1] });
            for (let i = 0; i < 40 && !bolt.exploding; i++) bolt.update(1, 1000, 1000, walls);
            expect(bolt.exploding).toBe(true);
            expect(bolt.x).toBeGreaterThanOrEqual(6 * TILE + 9);
            expect(bolt.x).toBeLessThan(6 * TILE + 16 + 4);
        });

        it("does not let a fast bolt skip over a wall between frames", function () {
            const walls = verticalWall();
            // Faster per frame than the wall band is thick.
            const bolt = new Projectile(100, 100, DIRECTION_VECTORS.east,
                { sheet: {}, speed: 12, range: 1000, lightRadius: 100, lightColor: [1, 1, 1] });
            for (let i = 0; i < 40 && !bolt.exploding; i++) bolt.update(1, 1000, 1000, walls);
            expect(bolt.exploding).toBe(true);
            expect(bolt.x).toBeGreaterThanOrEqual(6 * TILE + 9);
            expect(bolt.x).toBeLessThan(6 * TILE + 16);
        });

        it("ends lightning at the first wall", function () {
            const spells = new SpellCaster(art);
            spells.walls = verticalWall();
            spells.cast("lightning", { x: 84, y: 84, size: 32, direction: "east" });
            const strike = spells.effects[0];
            expect(strike.x2).toBeLessThanOrEqual(6 * TILE + 9);
            expect(strike.x2).toBeGreaterThan(6 * TILE);
        });

        it("stops a bolt cast north by a player whose head overlaps the wall", function () {
            const walls = horizontalWall();
            const player = new Player(100, 220);
            for (let i = 0; i < 200; i++) player.moveSmooth(0, -1, 1000, 1000, 1, walls);
            const spells = new SpellCaster(art);
            spells.walls = walls;
            spells.cast("fire_bolt", player);
            const bolt = spells.effects[0];
            for (let i = 0; i < 20 && !bolt.exploding; i++) spells.update(1, 1000, 1000);
            expect(bolt.exploding).toBe(true);
            // It never gets above the wall's top edge.
            expect(bolt.y).toBeGreaterThanOrEqual(6 * TILE + 9);
        });

        it("never starts a spell on the far side of a wall", function () {
            const spells = new SpellCaster(art);
            spells.walls = verticalWall();
            // Caster center is 10px left of the wall band, closer than the usual cast distance.
            const casterX = 6 * TILE + 9 - 10 - 16;
            spells.cast("fire_bolt", { x: casterX, y: 84, size: 32, direction: "east" });
            expect(spells.effects[0].x).toBeLessThan(6 * TILE + 9);
        });
    });
});
