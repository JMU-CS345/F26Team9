import { TileLayer } from "../src/tileLayer.js";
import {
    FLOOR, FLOOR_VARIANTS, WALL, World, createRandom, generateWorld, roomsOverlap, roomCenter,
    Chest, CHEST_GOLD, rollChestReward
} from "../src/worldGenerator.js";
import { ITEM_CATALOG } from "../src/inventory.js";

/** Jasmine unit tests for tile layers and world generation. */
describe("TileLayer", function () {
    it("stores and returns values by column and row", function () {
        const layer = new TileLayer(4, 3, 0);
        layer.set(2, 1, 7);
        expect(layer.get(2, 1)).toBe(7);
        expect(layer.get(1, 2)).toBe(0);
    });

    it("returns the fill value outside the grid and ignores writes there", function () {
        const layer = new TileLayer(2, 2, -1);
        layer.set(5, 5, 3);
        expect(layer.get(5, 5)).toBe(-1);
        expect(layer.get(-1, 0)).toBe(-1);
    });
});

describe("World generation", function () {
    const COLS = 48;
    const ROWS = 30;

    function generate(seed) {
        return generateWorld(COLS, ROWS, createRandom(seed));
    }

    function eachTile(world, fn) {
        for (let row = 0; row < world.rows; row++) {
            for (let col = 0; col < world.cols; col++) fn(col, row);
        }
    }

    it("builds the same world from the same seed", function () {
        expect(generate(42).floor.cells).toEqual(generate(42).floor.cells);
        expect(generate(42).walls.cells).toEqual(generate(42).walls.cells);
    });

    it("builds different worlds from different seeds", function () {
        expect(generate(1).floor.cells).not.toEqual(generate(2).floor.cells);
    });

    for (const seed of [1, 7, 99, 2026]) {
        describe("with seed " + seed, function () {
            const world = generate(seed);

            it("places several rooms that do not overlap and stay off the border", function () {
                expect(world.rooms.length).toBeGreaterThan(1);
                world.rooms.forEach((room, i) => {
                    expect(room.x).toBeGreaterThanOrEqual(1);
                    expect(room.y).toBeGreaterThanOrEqual(1);
                    expect(room.x + room.w).toBeLessThanOrEqual(COLS - 1);
                    expect(room.y + room.h).toBeLessThanOrEqual(ROWS - 1);
                    for (const other of world.rooms.slice(i + 1)) {
                        expect(roomsOverlap(room, other, 2)).toBe(false);
                    }
                });
            });

            it("connects every room to the first by floor", function () {
                // Flood fill from the start across floor tiles.
                const seen = new Set();
                const queue = [world.start];
                while (queue.length > 0) {
                    const [col, row] = queue.pop();
                    const id = row * COLS + col;
                    if (seen.has(id) || !world.isFloor(col, row)) continue;
                    seen.add(id);
                    queue.push([col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]);
                }
                for (const room of world.rooms) {
                    const [col, row] = roomCenter(room);
                    expect(seen.has(row * COLS + col)).toBe(true);
                }
            });

            it("closes every floor tile in with walls", function () {
                eachTile(world, (col, row) => {
                    if (!world.isFloor(col, row)) return;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const c = col + dc;
                            const r = row + dr;
                            expect(world.isFloor(c, r) || world.isWall(c, r)).toBe(true);
                        }
                    }
                });
            });

            it("only puts walls next to floor, never on it", function () {
                eachTile(world, (col, row) => {
                    if (!world.isWall(col, row)) return;
                    expect(world.isFloor(col, row)).toBe(false);
                    expect(world.findFloorNeighbor(col, row)).not.toBeNull();
                });
            });

            it("starts the player on the floor of the first room", function () {
                const [col, row] = world.start;
                const room = world.rooms[0];
                expect(world.isFloor(col, row)).toBe(true);
                expect(col).toBeGreaterThanOrEqual(room.x);
                expect(col).toBeLessThan(room.x + room.w);
                expect(row).toBeGreaterThanOrEqual(room.y);
                expect(row).toBeLessThan(room.y + room.h);
            });

            it("only uses floor values the floor sheet has", function () {
                eachTile(world, (col, row) => {
                    const value = world.floor.get(col, row);
                    if (value === FLOOR.EMPTY) return;
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThan(4 * FLOOR_VARIANTS);
                });
            });
        });
    }

    it("returns an empty world when no room fits", function () {
        const world = generateWorld(4, 4, createRandom(1));
        expect(world.rooms.length).toBe(0);
        expect(world.start).toBeNull();
    });
});

describe("World walls and floor display", function () {
    // A 3 x 3 floor with walls around it, built by hand.
    function smallRoom() {
        const world = new World(5, 5);
        for (let row = 1; row <= 3; row++) {
            for (let col = 1; col <= 3; col++) {
                world.floor.set(col, row, FLOOR.WOOD * FLOOR_VARIANTS);
            }
        }
        for (let i = 0; i < 5; i++) {
            for (const [col, row] of [[i, 0], [i, 4], [0, i], [4, i]]) {
                world.walls.set(col, row, WALL.STONE);
            }
        }
        return world;
    }

    it("picks wall tiles by which sides have neighboring walls", function () {
        const world = smallRoom();
        expect(world.wallMask(0, 0)).toBe(2 + 4);     // top-left corner: east and south
        expect(world.wallMask(2, 0)).toBe(2 + 8);     // top edge: east and west
        expect(world.wallMask(4, 2)).toBe(1 + 4);     // right edge: north and south
        expect(world.wallMask(4, 4)).toBe(1 + 8);     // bottom-right corner: north and west
        expect(world.wallMask(2, 2)).toBe(0);         // floor with no walls beside it
    });
});

describe("Chests", function () {
    const seeds = [1, 2, 3, 42, 99, 2024];

    it("places at least one chest, each inside a room on a floor tile", function () {
        for (const seed of seeds) {
            const world = generateWorld(64, 40, createRandom(seed), { maxRooms: 14 });
            expect(world.chests.length).toBeGreaterThan(0);
            for (const chest of world.chests) {
                expect(world.isFloor(chest.col, chest.row)).toBe(true);
                const room = world.rooms.find(r => chest.col >= r.x && chest.col < r.x + r.w
                    && chest.row >= r.y && chest.row < r.y + r.h);
                expect(room).toBeDefined();
            }
        }
    });

    it("never puts two chests in one room or a chest on the starting tile", function () {
        for (const seed of seeds) {
            const world = generateWorld(64, 40, createRandom(seed), { maxRooms: 14 });
            const keys = world.chests.map(c => c.col + "," + c.row);
            expect(new Set(keys).size).toBe(keys.length);
            expect(world.chests.length).toBeLessThanOrEqual(world.rooms.length);
            expect(keys).not.toContain(world.start[0] + "," + world.start[1]);
        }
    });

    it("places the same chests with the same rewards for the same seed", function () {
        const a = generateWorld(64, 40, createRandom(7), { maxRooms: 14 });
        const b = generateWorld(64, 40, createRandom(7), { maxRooms: 14 });
        expect(a.chests.map(c => [c.col, c.row, c.reward]))
            .toEqual(b.chests.map(c => [c.col, c.row, c.reward]));
    });

    it("holds gold, a potion, or gear", function () {
        const random = createRandom(5);
        const randomInt = (min, max) => min + Math.floor(random() * (max - min + 1));
        const kinds = new Set();
        for (let i = 0; i < 300; i++) {
            const reward = rollChestReward(random, randomInt);
            if (reward.kind === "gold") {
                expect(reward.amount).toBeGreaterThanOrEqual(CHEST_GOLD.min);
                expect(reward.amount).toBeLessThanOrEqual(CHEST_GOLD.max);
                kinds.add("gold");
            } else {
                const item = ITEM_CATALOG.find(entry => entry.id === reward.id);
                expect(["potion", "gear"]).toContain(item.type);
                kinds.add(item.type);
            }
        }
        expect([...kinds].sort()).toEqual(["gear", "gold", "potion"]);
    });

    it("gives its reward once and cannot be reopened", function () {
        const chest = new Chest(3, 4, { kind: "gold", amount: 20 });
        expect(chest.open()).toEqual({ kind: "gold", amount: 20 });
        expect(chest.opened).toBe(true);
        expect(chest.open()).toBeNull();
    });

    it("can only be reached from close by", function () {
        const chest = new Chest(2, 2, { kind: "gold", amount: 10 });
        expect(chest.inReach(62, 70, 25)).toBe(true);
        expect(chest.inReach(62, 120, 25)).toBe(false);
    });

    it("has open and closed sprites with rows of equal width", function () {
        for (const art of [Chest.CLOSED, Chest.OPEN]) {
            for (const row of art) expect(row.length).toBe(art[0].length);
        }
    });
});
