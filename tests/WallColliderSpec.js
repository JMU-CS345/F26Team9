import { WallCollider } from "../src/wallCollider.js";
import { World, WALL, FLOOR, WALL_PIECE } from "../src/worldGenerator.js";
import { Player } from "../src/player.js";
import { SpellCaster } from "../src/spellCaster.js";
import { Projectile, DIRECTION_VECTORS } from "../src/spellEffects.js";

/** Jasmine unit tests for wall collision. */
describe("Wall collision", function () {
    // 25px tiles, the same size as the wall sheet.
    const TILE = 25;

    // A vertical wall in column 6 with floor to its west: solid from x 150 to 158.
    const WALL_LEFT = 6 * TILE;
    const WALL_RIGHT = 6 * TILE + 8;

    // A horizontal wall in row 6 with floor below it: solid from y 156 to 175,
    // its thin top plus its front face.
    const FACE_TOP = 6 * TILE + 6;
    const FACE_BOTTOM = 7 * TILE;

    // An empty 12 x 12 world with floor and walls placed by hand.
    function worldWith(wallTiles, floorTiles = []) {
        const world = new World(12, 12);
        for (const [col, row] of floorTiles) world.floor.set(col, row, FLOOR.BRICK);
        for (const [col, row] of wallTiles) world.walls.set(col, row, WALL.STONE);
        return world;
    }

    // A vertical wall in column 6 from row 0 to row 11, floor in column 5.
    function verticalWall() {
        const tiles = [];
        const floor = [];
        for (let row = 0; row < 12; row++) {
            tiles.push([6, row]);
            floor.push([5, row]);
        }
        return new WallCollider(worldWith(tiles, floor), TILE);
    }

    // A horizontal wall in row 6 from column 0 to column 11, floor in row 7.
    function horizontalWall() {
        const tiles = [];
        const floor = [];
        for (let col = 0; col < 12; col++) {
            tiles.push([col, 6]);
            floor.push([col, 7]);
        }
        return new WallCollider(worldWith(tiles, floor), TILE);
    }

    describe("World.wallPieces", function () {
        // A 3 x 3 room at columns 3-5, rows 3-5, with a ring of walls around it.
        function room() {
            const floor = [];
            const tiles = [];
            for (let row = 2; row <= 6; row++) {
                for (let col = 2; col <= 6; col++) {
                    if (row >= 3 && row <= 5 && col >= 3 && col <= 5) floor.push([col, row]);
                    else tiles.push([col, row]);
                }
            }
            return worldWith(tiles, floor);
        }

        it("gives a room's top wall the tall front face", function () {
            expect(room().wallPieces(4, 2)).toEqual([WALL_PIECE.SOUTH]);
        });

        it("hugs the floor side of the other straight walls", function () {
            const world = room();
            expect(world.wallPieces(4, 6)).toEqual([WALL_PIECE.NORTH]);
            expect(world.wallPieces(2, 4)).toEqual([WALL_PIECE.EAST]);
            expect(world.wallPieces(6, 4)).toEqual([WALL_PIECE.WEST]);
        });

        it("uses outer corner pieces at a room's corners", function () {
            const world = room();
            expect(world.wallPieces(2, 2)).toEqual([WALL_PIECE.SOUTH_EAST_CORNER]);
            expect(world.wallPieces(6, 2)).toEqual([WALL_PIECE.SOUTH_WEST_CORNER]);
            expect(world.wallPieces(2, 6)).toEqual([WALL_PIECE.NORTH_EAST_CORNER]);
            expect(world.wallPieces(6, 6)).toEqual([WALL_PIECE.NORTH_WEST_CORNER]);
        });

        it("uses an inside corner piece where floor touches two sides", function () {
            const world = worldWith([[4, 4]], [[3, 4], [4, 5], [3, 5]]);
            expect(world.wallPieces(4, 4)).toEqual([WALL_PIECE.SOUTH_WEST]);
        });

        it("gives nothing for a tile with no wall", function () {
            expect(room().wallPieces(4, 4)).toEqual([]);
        });
    });

    describe("WallCollider", function () {
        it("makes a room's top wall solid down to the bottom of its front face", function () {
            const walls = horizontalWall();
            expect(walls.solidRects(2, 6)).toEqual([{ x: 50, y: FACE_TOP, w: 25, h: 19 }]);
            expect(walls.solidRects(0, 0)).toEqual([]);
        });

        it("scales the solid parts with the tile size", function () {
            const world = worldWith([[2, 2]], [[1, 2]]);
            const walls = new WallCollider(world, 50);
            expect(walls.solidRects(2, 2)).toEqual([{ x: 100, y: 100, w: 16, h: 50 }]);
        });

        it("blocks points on the wall but not the rest of the tile", function () {
            const walls = verticalWall();
            expect(walls.blocksPoint(WALL_LEFT + 4, 100)).toBe(true);
            expect(walls.blocksPoint(WALL_LEFT + 12, 100)).toBe(false);
            expect(walls.blocksPoint(WALL_LEFT + 20, 100)).toBe(false);
        });

        it("does not count a box touching a wall's edge as a hit", function () {
            const walls = verticalWall();
            expect(walls.hits({ x: WALL_LEFT - 10, y: 100, w: 10, h: 10 }).length).toBe(0);
            expect(walls.hits({ x: WALL_LEFT - 9, y: 100, w: 10, h: 10 }).length).toBeGreaterThan(0);
        });

        it("finds how far a ray travels before it reaches a wall", function () {
            const walls = verticalWall();
            const distance = walls.castRay(100, 100, DIRECTION_VECTORS.east, 300);
            expect(distance).toBeGreaterThan(WALL_LEFT - 100 - 3);
            expect(distance).toBeLessThanOrEqual(WALL_LEFT - 100);
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
            expect(feet.x + feet.w).toBe(WALL_LEFT);
            expect(player.vx).toBe(0);
        });

        it("stops the player walking up into a wall with their head overlapping it", function () {
            const walls = horizontalWall();
            const player = new Player(100, 220);
            for (let i = 0; i < 120; i++) player.moveSmooth(0, -1, 1000, 1000, 1, walls);
            expect(player.getHitbox().y).toBe(FACE_BOTTOM);
            // The sprite's top is above the wall's bottom edge.
            expect(player.y).toBeLessThan(FACE_BOTTOM);
        });

        it("slides along a wall when moving diagonally into it", function () {
            const walls = verticalWall();
            const player = new Player(100, 100);
            for (let i = 0; i < 60; i++) player.moveSmooth(1, 1, 1000, 1000, 1, walls);
            const feet = player.getHitbox();
            expect(feet.x + feet.w).toBe(WALL_LEFT);
            expect(player.y).toBeGreaterThan(150);
        });

        it("can walk through a gap in a wall", function () {
            const tiles = [];
            const floor = [];
            for (let row = 0; row < 12; row++) {
                if (row !== 4 && row !== 5) tiles.push([6, row]);
                floor.push([5, row]);
            }
            const walls = new WallCollider(worldWith(tiles, floor), TILE);
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
            expect(bolt.x).toBeGreaterThanOrEqual(WALL_LEFT);
            expect(bolt.x).toBeLessThan(WALL_RIGHT + 4);
        });

        it("does not let a fast bolt skip over a wall between frames", function () {
            const walls = verticalWall();
            // Faster per frame than the wall is thick.
            const bolt = new Projectile(100, 100, DIRECTION_VECTORS.east,
                { sheet: {}, speed: 12, range: 1000, lightRadius: 100, lightColor: [1, 1, 1] });
            for (let i = 0; i < 40 && !bolt.exploding; i++) bolt.update(1, 1000, 1000, walls);
            expect(bolt.exploding).toBe(true);
            expect(bolt.x).toBeGreaterThanOrEqual(WALL_LEFT);
            expect(bolt.x).toBeLessThan(WALL_RIGHT);
        });

        it("ends lightning at the first wall", function () {
            const spells = new SpellCaster(art);
            spells.walls = verticalWall();
            spells.cast("lightning", { x: 84, y: 84, size: 32, direction: "east" });
            const strike = spells.effects[0];
            expect(strike.x2).toBeLessThanOrEqual(WALL_LEFT);
            expect(strike.x2).toBeGreaterThan(WALL_LEFT - 3);
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
            // It never gets above the top of the wall's face.
            expect(bolt.y).toBeGreaterThanOrEqual(FACE_TOP);
        });

        it("never starts a spell on the far side of a wall", function () {
            const spells = new SpellCaster(art);
            spells.walls = verticalWall();
            // Caster center is 10px left of the wall, closer than the usual cast distance.
            const casterX = WALL_LEFT - 10 - 16;
            spells.cast("fire_bolt", { x: casterX, y: 84, size: 32, direction: "east" });
            expect(spells.effects[0].x).toBeLessThan(WALL_LEFT);
        });
    });
});
