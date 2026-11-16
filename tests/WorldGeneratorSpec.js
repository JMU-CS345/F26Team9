import { TileLayer } from "../src/tileLayer.js";
import {
    FLOOR, FLOOR_VARIANTS, WALL, World, createRandom, generateWorld, roomsOverlap, roomCenter
} from "../src/worldGenerator.js";

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

    it("draws floor under walls using the neighboring floor's material", function () {
        const world = smallRoom();
        const value = world.displayFloor(0, 2);
        expect(Math.floor(value / FLOOR_VARIANTS)).toBe(FLOOR.WOOD);
        expect(world.displayFloor(2, 2)).toBe(world.floor.get(2, 2));
    });

    it("draws nothing where there is neither floor nor wall", function () {
        const world = new World(3, 3);
        expect(world.displayFloor(1, 1)).toBe(FLOOR.EMPTY);
    });
});
