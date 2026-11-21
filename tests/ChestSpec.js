import { Chest, rollChestLoot, spawnChests, LOOT_TABLE, MIN_CHESTS, MAX_CHESTS, VAULT_BONUS_GOLD } from "../src/chest.js";
import { Inventory, ITEM_CATALOG } from "../src/inventory.js";
import { Player } from "../src/player.js";
import { createRandom, generateWorld } from "../src/worldGenerator.js";

function memoryStorage() {
    const saved = {};
    return { getItem: k => saved[k] ?? null, setItem: (k, v) => { saved[k] = v; } };
}

/** A random source that returns the given values in turn, then repeats the last. */
function sequence(...values) {
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
}

describe("Chests", function () {
    it("spawns 2-3 chests per level in rooms other than the start room", function () {
        for (let seed = 1; seed <= 20; seed++) {
            const world = generateWorld(64, 40, createRandom(seed), { maxRooms: 14 });
            const chests = spawnChests(world, 25, createRandom(seed + 100));
            expect(chests.length).toBeGreaterThanOrEqual(MIN_CHESTS);
            expect(chests.length).toBeLessThanOrEqual(MAX_CHESTS);
            for (const chest of chests) {
                const col = Math.floor(chest.x / 25);
                const row = Math.floor(chest.y / 25);
                expect(world.isFloor(col, row)).toBe(true);
                const roomIndex = world.rooms.findIndex(r => col >= r.x && col < r.x + r.w
                    && row >= r.y && row < r.y + r.h);
                expect(roomIndex).toBeGreaterThan(0);
            }
        }
    });

    it("never puts a chest on a tile another object already uses", function () {
        const world = generateWorld(64, 40, createRandom(4), { maxRooms: 14 });
        const used = new Set();
        const first = spawnChests(world, 25, createRandom(1), 3, used);
        const second = spawnChests(world, 25, createRandom(1), 3, used);
        const spots = [...first, ...second].map(c => c.x + "," + c.y);
        expect(new Set(spots).size).toBe(spots.length);
    });

    it("grants gold, a potion, or gear and adds it to the inventory", function () {
        const inventory = new Inventory(memoryStorage());
        const chest = new Chest(0, 0);
        const reward = chest.open(inventory, createRandom(9));
        expect(["gold", "item"]).toContain(reward.type);
        if (reward.type === "gold") expect(inventory.gold).toBe(reward.amount);
        else expect(inventory.getQuantity(reward.id)).toBeGreaterThan(0);
    });

    it("cannot be reopened", function () {
        const inventory = new Inventory(memoryStorage());
        const chest = new Chest(0, 0);
        expect(chest.open(inventory, sequence(0))).not.toBe(null);
        const goldAfterFirst = inventory.gold;
        expect(chest.opened).toBe(true);
        expect(chest.open(inventory, sequence(0))).toBe(null);
        expect(inventory.gold).toBe(goldAfterFirst);
    });

    it("rolls gold on a low roll", function () {
        const inventory = new Inventory(memoryStorage());
        const reward = rollChestLoot(sequence(0, 0), inventory);
        expect(reward.type).toBe("gold");
        expect(reward.amount).toBe(15);
    });

    it("can roll a healing potion, which is no longer a starting item", function () {
        const inventory = new Inventory(memoryStorage());
        const total = LOOT_TABLE.reduce((sum, e) => sum + e.weight, 0);
        const reward = rollChestLoot(sequence(30 / total, 0), inventory);
        expect(reward).toEqual({ type: "item", id: "healing_potion" });
    });

    it("turns gear the player already owns into gold", function () {
        const inventory = new Inventory(memoryStorage());
        inventory.setQuantity("arcane_staff", 1);
        inventory.setQuantity("swift_boots", 1);
        const total = LOOT_TABLE.reduce((sum, e) => sum + e.weight, 0);
        const gearRoll = (25 + 20 + 20 + 15 + 1) / total;
        expect(rollChestLoot(sequence(gearRoll, 0), inventory).type).toBe("gold");
    });

    it("gives an unowned gear item from the gear roll", function () {
        const inventory = new Inventory(memoryStorage());
        inventory.setQuantity("arcane_staff", 1);
        const total = LOOT_TABLE.reduce((sum, e) => sum + e.weight, 0);
        const reward = rollChestLoot(sequence((25 + 20 + 20 + 15 + 1) / total, 0), inventory);
        expect(reward).toEqual({ type: "item", id: "swift_boots" });
    });

    it("vault chests always hold an item plus bonus gold", function () {
        for (let seed = 1; seed <= 30; seed++) {
            const inventory = new Inventory(memoryStorage());
            const reward = new Chest(0, 0, true).open(inventory, createRandom(seed));
            expect(reward.type).toBe("item");
            expect(inventory.gold).toBe(VAULT_BONUS_GOLD);
        }
    });

    it("only opens when the player stands next to it", function () {
        const player = new Player(0, 0);
        const chest = new Chest(200, 200);
        expect(chest.isNear(player)).toBe(false);
        player.x = 200 - player.size / 2;
        player.y = 200 - player.size * 0.8;
        expect(chest.isNear(player)).toBe(true);
    });

    it("only rolls items that exist in the catalog", function () {
        const ids = ITEM_CATALOG.map(item => item.id);
        for (const entry of LOOT_TABLE) {
            for (const id of entry.ids || []) expect(ids).toContain(id);
        }
    });
});

describe("Inventory gold and item helpers", function () {
    it("adds, consumes, and caps items", function () {
        const inventory = new Inventory(memoryStorage());
        expect(inventory.add("fire_bomb")).toBe(true);
        expect(inventory.getQuantity("fire_bomb")).toBe(1);
        expect(inventory.consume("fire_bomb")).toBe(true);
        expect(inventory.consume("fire_bomb")).toBe(false);
        inventory.setQuantity("fire_bomb", 9);
        expect(inventory.add("fire_bomb")).toBe(false);
    });

    it("saves gold between sessions", function () {
        const disk = memoryStorage();
        new Inventory(disk).addGold(42);
        expect(new Inventory(disk).gold).toBe(42);
    });
});
