import { Torch } from "../src/torch.js";
import { createRandom, generateWorld } from "../src/worldGenerator.js";

/** Jasmine unit tests for torch placement and torch flicker. */
describe("Torch placement", function () {
    for (const seed of [1, 7, 99, 2026]) {
        describe("with seed " + seed, function () {
            const world = generateWorld(64, 40, createRandom(seed), { maxRooms: 14 });

            it("places at least one torch", function () {
                expect(world.torches.length).toBeGreaterThan(0);
            });

            it("puts each torch on a straight wall with floor below it", function () {
                for (const { col, row } of world.torches) {
                    expect(world.isWall(col, row)).toBe(true);
                    expect(world.isFloor(col, row + 1)).toBe(true);
                    expect(world.wallMask(col, row)).toBe(2 + 8);
                }
            });

            it("puts torches only on a room's top wall, at most two per room", function () {
                for (const room of world.rooms) {
                    const inRoom = world.torches.filter(t =>
                        t.row === room.y - 1 && t.col >= room.x && t.col < room.x + room.w);
                    expect(inRoom.length).toBeLessThanOrEqual(2);
                }
                for (const torch of world.torches) {
                    const owner = world.rooms.find(room => torch.row === room.y - 1
                        && torch.col >= room.x && torch.col < room.x + room.w);
                    expect(owner).toBeDefined();
                }
            });

            it("never puts two torches on the same tile", function () {
                const keys = world.torches.map(t => t.col + "," + t.row);
                expect(new Set(keys).size).toBe(keys.length);
            });
        });
    }

    it("places the same torches for the same seed", function () {
        const a = generateWorld(64, 40, createRandom(5), { maxRooms: 14 });
        const b = generateWorld(64, 40, createRandom(5), { maxRooms: 14 });
        expect(a.torches).toEqual(b.torches);
    });
});

describe("Torch", function () {
    it("gives off one warm light from its flame", function () {
        const torch = new Torch(100, 200);
        const [light] = torch.getLights();
        expect(light.x).toBe(100);
        expect(light.y).toBeLessThan(200);
        expect(light.color).toEqual(Torch.LIGHT_COLOR);
    });

    it("flickers gently around its light radius", function () {
        const torch = new Torch(0, 0);
        for (let i = 0; i < 300; i++) {
            torch.update(1);
            const radius = torch.getLights()[0].radius;
            expect(radius).toBeGreaterThan(Torch.LIGHT_RADIUS * 0.88);
            expect(radius).toBeLessThan(Torch.LIGHT_RADIUS * 1.12);
        }
    });

    it("cycles through every flame frame", function () {
        const torch = new Torch(0, 0);
        const seen = new Set();
        for (let i = 0; i < Torch.FRAME_TIME * Torch.FLAMES.length; i++) {
            seen.add(torch.frame);
            torch.update(1);
        }
        expect(seen.size).toBe(Torch.FLAMES.length);
    });

    it("lets torches with different phases flicker out of sync", function () {
        const a = new Torch(0, 0, 0);
        const b = new Torch(0, 0, 37);
        expect(a.getLights()[0].radius).not.toBe(b.getLights()[0].radius);
    });

    it("only uses colors from its palette in every sprite row", function () {
        for (const line of [...Torch.FLAMES.flat(), ...Torch.HANDLE]) {
            expect(line.length).toBe(5);
            for (const ch of line) {
                expect(ch === "." || ch in Torch.PALETTE).toBe(true);
            }
        }
    });
});
