import { createRandom, generateWorld } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";
import { createVaults, Vault } from "../src/vault.js";
import { Player } from "../src/player.js";
import { Inventory } from "../src/inventory.js";

const TILE = 25;

function makeWorld(seed, vaults = 1) {
    return generateWorld(64, 40, createRandom(seed), { maxRooms: 14, vaults });
}

/** Moves the player so their feet are centered on a world point. */
function standAt(player, x, y) {
    const box = player.hitbox;
    player.x = x - box.x - box.w / 2;
    player.y = y - box.y - box.h / 2;
}

/** Flood fill over floor tiles that are not blocked by a closed gate. */
function reachable(world, walls, start) {
    const seen = new Set([start.join(",")]);
    const queue = [start];
    while (queue.length) {
        const [c, r] = queue.pop();
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const key = (c + dc) + "," + (r + dr);
            if (seen.has(key) || !world.isFloor(c + dc, r + dr) || walls.gateBlocks(c + dc, r + dr)) continue;
            seen.add(key);
            queue.push([c + dc, r + dr]);
        }
    }
    return seen;
}

function ownVault(world, lockType) {
    const walls = new WallCollider(world, TILE);
    const vault = new Vault(world.vaults[0], lockType, TILE);
    walls.addGate(vault.gate);
    return { walls, vault };
}

describe("Vault generation", function () {
    it("carves vaults next to a room other than the start room", function () {
        let carved = 0;
        for (let seed = 1; seed <= 30; seed++) {
            const world = makeWorld(seed, 2);
            carved += world.vaults.length;
            for (const vault of world.vaults) {
                expect(vault.roomIndex).toBeGreaterThan(0);
                for (const [c, r] of vault.door) expect(world.isFloor(c, r)).toBe(true);
                for (let r = vault.y; r < vault.y + vault.h; r++) {
                    for (let c = vault.x; c < vault.x + vault.w; c++) expect(world.isFloor(c, r)).toBe(true);
                }
            }
        }
        expect(carved).toBeGreaterThan(40);
    });

    it("leaves world generation unchanged when no vault is asked for", function () {
        const a = generateWorld(64, 40, createRandom(7), { maxRooms: 14 });
        expect(a.vaults).toEqual([]);
    });

    it("can only be entered through its gate", function () {
        for (let seed = 1; seed <= 30; seed++) {
            const world = makeWorld(seed);
            if (!world.vaults.length) continue;
            const { walls, vault } = ownVault(world, "key");
            const inside = [vault.data.x + 1, vault.data.y + 1].join(",");
            expect(reachable(world, walls, world.start).has(inside)).toBe(false);
            vault.openGate();
            expect(reachable(world, walls, world.start).has(inside)).toBe(true);
        }
    });

    it("keeps vault walls solid: no floor within two tiles except the host room", function () {
        for (let seed = 1; seed <= 30; seed++) {
            const world = makeWorld(seed);
            for (const v of world.vaults) {
                for (let r = v.y - 1; r <= v.y + v.h; r++) {
                    for (let c = v.x - 1; c <= v.x + v.w; c++) {
                        const inVault = c >= v.x && c < v.x + v.w && r >= v.y && r < v.y + v.h;
                        const isDoor = v.door.some(([dc, dr]) => dc === c && dr === r);
                        if (!inVault && !isDoor) expect(world.isFloor(c, r)).toBe(false);
                    }
                }
            }
        }
    });
});

describe("Vault gates", function () {
    it("blocks the walls, spells, and enemies while closed", function () {
        const world = makeWorld(3);
        const { walls, vault } = ownVault(world, "key");
        const [gx, gy] = vault.gateCenter;
        expect(walls.blocksPoint(gx, gy)).toBe(true);
        expect(walls.hits({ x: gx - 2, y: gy - 2, w: 4, h: 4 }).length).toBeGreaterThan(0);
        vault.openGate();
        expect(walls.blocksPoint(gx, gy)).toBe(false);
    });

    it("places all locks and registers every gate", function () {
        const world = makeWorld(5, 2);
        const walls = new WallCollider(world, TILE);
        const vaults = createVaults(world, TILE, walls, createRandom(1));
        expect(vaults.length).toBe(world.vaults.length);
        expect(walls.gates.length).toBe(vaults.length);
        expect(new Set(vaults.map(v => v.lockType)).size).toBe(vaults.length);
        for (const vault of vaults) {
            expect(vault.chest.rich).toBe(true);
            if (vault.lockType === "key") expect(vault.key).not.toBe(null);
            if (vault.lockType === "lever") expect(vault.lever).not.toBe(null);
            if (vault.lockType === "plates") expect(vault.plates.length).toBe(3);
        }
    });
});

describe("Vault locks", function () {
    function vaultOfType(type) {
        for (let seed = 1; seed < 200; seed++) {
            const world = makeWorld(seed);
            if (!world.vaults.length) continue;
            const walls = new WallCollider(world, TILE);
            const [vault] = createVaults(world, TILE, walls, createRandom(seed));
            if (vault.lockType === type) return { world, walls, vault };
        }
        throw new Error("no vault with lock " + type);
    }

    it("key: the gate stays locked until the key is found", function () {
        const { vault } = vaultOfType("key");
        const player = new Player(0, 0);
        const [gx, gy] = vault.gateCenter;
        standAt(player, gx, gy + (vault.data.side === "north" ? 20 : vault.data.side === "south" ? -20 : 0));
        if (!vault.horizontal) standAt(player, gx + (vault.data.side === "west" ? 20 : -20), gy);
        expect(vault.interact(player)).toContain("Locked");
        expect(vault.gate.closed).toBe(true);

        const spot = vault.key;
        standAt(player, spot.x, spot.y);
        expect(vault.update(player, 1)).toContain("key");
        expect(vault.hasKey).toBe(true);
        expect(vault.key).toBe(null);

        standAt(player, gx, gy + (vault.data.side === "north" ? 20 : vault.data.side === "south" ? -20 : 0));
        if (!vault.horizontal) standAt(player, gx + (vault.data.side === "west" ? 20 : -20), gy);
        vault.interact(player);
        expect(vault.gate.closed).toBe(false);
        expect(vault.solved).toBe(true);
    });

    it("plates: stepping in the right order opens the gate; a wrong step resets", function () {
        const { vault } = vaultOfType("plates");
        const player = new Player(0, 0);
        const step = index => {
            const plate = vault.plates[index];
            standAt(player, plate.x, plate.y);
            const message = vault.update(player, 1);
            standAt(player, -500, -500); // Step off.
            vault.update(player, 1);
            return message;
        };
        const [first, second, third] = vault.order;
        step(first);
        expect(vault.progress).toBe(1);
        expect(step(third)).toContain("Wrong");
        expect(vault.progress).toBe(0);
        expect(vault.plates.every(p => !p.lit)).toBe(true);

        step(first);
        step(second);
        expect(vault.gate.closed).toBe(true);
        step(third);
        expect(vault.gate.closed).toBe(false);
        expect(vault.solved).toBe(true);
    });

    it("plates: standing still on a plate only counts once", function () {
        const { vault } = vaultOfType("plates");
        const player = new Player(0, 0);
        const plate = vault.plates[vault.order[0]];
        standAt(player, plate.x, plate.y);
        vault.update(player, 1);
        vault.update(player, 1);
        expect(vault.progress).toBe(1);
    });

    it("lever: opens the gate for a while, then closes it again", function () {
        const { vault } = vaultOfType("lever");
        const player = new Player(0, 0);
        standAt(player, vault.lever.x, vault.lever.y);
        expect(vault.interact(player)).toContain("lever");
        expect(vault.gate.closed).toBe(false);
        standAt(player, -500, -500);
        vault.update(player, vault.timerMax + 1);
        expect(vault.gate.closed).toBe(true);
    });

    it("lever: never closes the gate on a player standing in the doorway", function () {
        const { vault } = vaultOfType("lever");
        const player = new Player(0, 0);
        standAt(player, vault.lever.x, vault.lever.y);
        vault.interact(player);
        const [gx, gy] = vault.gateCenter;
        standAt(player, gx, gy);
        vault.update(player, vault.timerMax + 1);
        vault.update(player, 5);
        expect(vault.gate.closed).toBe(false);
        standAt(player, -500, -500);
        vault.update(player, 5);
        expect(vault.gate.closed).toBe(true);
    });

    it("lever: the gate stays open once the vault chest is opened", function () {
        const { vault } = vaultOfType("lever");
        const player = new Player(0, 0);
        standAt(player, vault.lever.x, vault.lever.y);
        vault.interact(player);
        const saved = {};
        vault.chest.open(new Inventory({ getItem: k => saved[k] ?? null, setItem: (k, v) => { saved[k] = v; } }));
        standAt(player, -500, -500);
        vault.update(player, vault.timerMax + 100);
        expect(vault.gate.closed).toBe(false);
        expect(vault.solved).toBe(true);
    });

    it("gives the lever enough time to walk back at base speed", function () {
        const { vault } = vaultOfType("lever");
        const [gx, gy] = vault.gateCenter;
        const walkFrames = (Math.abs(gx - vault.lever.x) + Math.abs(gy - vault.lever.y)) / 2;
        expect(vault.timerMax).toBeGreaterThan(walkFrames * 1.5);
    });
});
