/** Jasmine unit tests for E-key inventory and developer item counts. */
describe("Inventory item counts and hotkeys", function () {
    function storage() {
        const saved = {};
        return {
            getItem: key => Object.prototype.hasOwnProperty.call(saved, key) ? saved[key] : null,
            setItem: (key, value) => { saved[key] = value; }
        };
    }

    it("provides a small set of test items on first play", function () {
        const inv = new Inventory(storage());
        expect(inv.getQuantity("healing_potion")).toBe(2);
        expect(inv.getQuantity("fire_bolt")).toBe(1);
        expect(inv.getQuantity("speed_potion")).toBe(0);
        expect(inv.ownedItems().length).toBe(4);
    });

    it("assigns an owned potion to H", function () {
        const inv = new Inventory(storage());
        expect(inv.assign("healing_potion", "h")).toBe(true);
        expect(inv.getAssigned("h").id).toBe("healing_potion");
    });

    it("assigns a spell to a different hotkey", function () {
        const inv = new Inventory(storage());
        inv.assign("fire_bolt", "l");
        expect(inv.getAssigned("l").name).toBe("Fire Bolt");
    });

    it("rejects hotkeys outside H/J/K/L", function () {
        const inv = new Inventory(storage());
        expect(inv.assign("fire_bolt", "x")).toBe(false);
        expect(inv.getAssigned("x")).toBe(null);
    });

    it("rejects items not owned or not in catalog", function () {
        const inv = new Inventory(storage());
        expect(inv.assign("shield_potion", "h")).toBe(false);
        expect(inv.assign("imaginary_spell", "h")).toBe(false);
    });

    it("moves an item when assigned to another key", function () {
        const inv = new Inventory(storage());
        inv.assign("fire_bolt", "h");
        inv.assign("fire_bolt", "l");
        expect(inv.getAssigned("h")).toBe(null);
        expect(inv.getAssigned("l").id).toBe("fire_bolt");
    });

    it("replaces an existing binding but leaves both items owned", function () {
        const inv = new Inventory(storage());
        inv.assign("fire_bolt", "h");
        inv.assign("ice_shard", "h");
        expect(inv.getAssigned("h").id).toBe("ice_shard");
        expect(inv.getQuantity("fire_bolt")).toBe(1);
    });

    it("unassigns a hotkey without removing the owned item", function () {
        const inv = new Inventory(storage());
        inv.assign("fire_bolt", "h");
        inv.unassign("h");
        expect(inv.getAssigned("h")).toBe(null);
        expect(inv.getQuantity("fire_bolt")).toBe(1);
    });

    it("removes hotkey binding when the last owned copy is removed", function () {
        const inv = new Inventory(storage());
        inv.assign("fire_bolt", "l");
        inv.setQuantity("fire_bolt", 0);
        expect(inv.getAssigned("l")).toBe(null);
        expect(inv.ownedItems().length).toBe(3);
    });

    it("clamps developer item quantities to 0–9", function () {
        const inv = new Inventory(storage());
        inv.setQuantity("lightning", 200);
        expect(inv.getQuantity("lightning")).toBe(9);
        inv.setQuantity("lightning", -3);
        expect(inv.getQuantity("lightning")).toBe(0);
    });

    it("rejects invalid quantity and item values", function () {
        const inv = new Inventory(storage());
        expect(inv.setQuantity("unknown", 3)).toBe(false);
        expect(inv.setQuantity("mana_potion", NaN)).toBe(false);
        expect(inv.getQuantity("mana_potion")).toBe(2);
    });

    it("persists item quantities and bindings after a refresh", function () {
        const disk = storage();
        const first = new Inventory(disk);
        first.setQuantity("lightning", 4);
        first.assign("lightning", "j");
        const second = new Inventory(disk);
        expect(second.getQuantity("lightning")).toBe(4);
        expect(second.getAssigned("j").id).toBe("lightning");
    });

    it("preserves an empty inventory after a refresh", function () {
        const disk = storage();
        const first = new Inventory(disk);
        for (const item of ITEM_CATALOG) first.setQuantity(item.id, 0);
        const second = new Inventory(disk);
        expect(second.ownedItems().length).toBe(0);
    });

    it("ignores malformed and duplicate bindings loaded from storage", function () {
        const disk = storage();
        disk.setItem("mageQuestInventory", JSON.stringify({
            quantities: {fire_bolt: 1, mana_potion: 5},
            bindings: {h: "fire_bolt", j: "fire_bolt", k: "nonexistent", l: "mana_potion"}
        }));
        const inv = new Inventory(disk);
        expect(inv.getAssigned("h").id).toBe("fire_bolt");
        expect(inv.getAssigned("j")).toBe(null);
        expect(inv.getAssigned("k")).toBe(null);
        expect(inv.getAssigned("l").id).toBe("mana_potion");
    });
});

describe("E menu WASD and Space assignment flow", function () {
    function fixture() {
        const data = {};
        const storage = { getItem: key => data[key] || null,
                          setItem: (key, value) => { data[key] = value; } };
        const inventory = new Inventory(storage);
        const menu = new InventoryMenu(inventory, { getTextSize: () => 18 });
        menu.toggle();
        return { inventory, menu, storage };
    }

    it("opens on the inventory row", function () {
        const { menu } = fixture();
        expect(menu.isOpen).toBe(true);
        expect(menu.row).toBe(1);
        expect(menu.inventoryIndex).toBe(0);
    });

    it("selects and deselects an item using Space", function () {
        const { menu } = fixture();
        menu.handleSpace();
        expect(menu.selectedItemId).toBe("healing_potion");
        menu.handleSpace();
        expect(menu.selectedItemId).toBe(null);
    });

    it("assigns an item by selecting, moving up, then pressing Space", function () {
        const { menu, inventory } = fixture();
        menu.handleSpace();
        menu.handleInput("w");
        menu.handleInput("d");
        menu.handleSpace();
        expect(inventory.getAssigned("j").id).toBe("healing_potion");
        expect(menu.selectedItemId).toBe(null);
    });

    it("can clear an assigned hotkey using Space", function () {
        const { menu, inventory } = fixture();
        inventory.assign("healing_potion", "h");
        menu.handleInput("w");
        menu.handleSpace();
        expect(inventory.getAssigned("h")).toBe(null);
        expect(inventory.getQuantity("healing_potion")).toBe(2);
    });

    it("Space on the selected already-matching hotkey toggles it off", function () {
        const { menu, inventory } = fixture();
        inventory.assign("healing_potion", "h");
        menu.handleSpace();
        menu.handleInput("w");
        menu.handleSpace();
        expect(inventory.getAssigned("h")).toBe(null);
    });

    it("moves through four inventory slots using A/D", function () {
        const { menu } = fixture();
        menu.handleInput("d");
        menu.handleInput("d");
        expect(menu.inventoryIndex).toBe(2);
        menu.handleInput("a");
        expect(menu.inventoryIndex).toBe(1);
    });

    it("scrolls to the next page when more than four items are owned", function () {
        const { menu, inventory } = fixture();
        inventory.setQuantity("speed_potion", 1);
        inventory.setQuantity("shield_potion", 1);
        inventory.setQuantity("lightning", 1);
        for (let i = 0; i < 4; i++) menu.handleInput("d");
        expect(menu.inventoryIndex).toBe(4);
        expect(menu.getPageStart()).toBe(4);
    });

    it("does not select an empty inventory slot", function () {
        const { menu, inventory } = fixture();
        for (const item of ITEM_CATALOG) inventory.setQuantity(item.id, 0);
        menu.handleSpace();
        expect(menu.selectedItemId).toBe(null);
    });

    it("discards the pending choice when E closes", function () {
        const { menu } = fixture();
        menu.handleSpace();
        menu.toggle();
        expect(menu.isOpen).toBe(false);
        expect(menu.selectedItemId).toBe(null);
    });

    it("ignores navigation when the E menu is closed", function () {
        const { menu } = fixture();
        menu.toggle();
        menu.handleInput("d");
        menu.handleSpace();
        expect(menu.inventoryIndex).toBe(0);
        expect(menu.selectedItemId).toBe(null);
    });
});

describe("Developer menu inventory testing controls", function () {
    function setupDev() {
        const data = {};
        const storage = { getItem: k => data[k] || null, setItem: (k,v) => { data[k] = v; } };
        const inventory = new Inventory(storage);
        const player = new Player(100,100);
        const menu = new DeveloperMenu(player, { getTextSize: () => 18 }, storage, inventory);
        menu.toggle();
        for (let i = 0; i < 4; i++) menu.handleInput("s");
        return { menu, inventory, storage, player };
    }

    it("shows inventory counts after the four movement controls", function () {
        const { menu } = setupDev();
        expect(menu.selectedSetting).toBe(4);
    });

    it("increases and decreases potion counts with D/A", function () {
        const { menu, inventory } = setupDev();
        menu.handleInput("d");
        expect(inventory.getQuantity("healing_potion")).toBe(3);
        menu.handleInput("a");
        expect(inventory.getQuantity("healing_potion")).toBe(2);
    });

    it("adds a previously unowned spell", function () {
        const { menu, inventory } = setupDev();
        for (let i = 0; i < 6; i++) menu.handleInput("s");
        menu.handleInput("d");
        expect(inventory.getQuantity("lightning")).toBe(1);
    });

    it("removing a spell in dev menu clears its existing hotkey", function () {
        const { menu, inventory } = setupDev();
        inventory.assign("healing_potion", "h");
        menu.handleInput("a");
        menu.handleInput("a");
        expect(inventory.getAssigned("h")).toBe(null);
    });

    it("keeps developer movement settings unchanged when modifying inventory", function () {
        const { menu, player } = setupDev();
        menu.handleInput("d");
        expect(player.speed).toBe(3);
        expect(player.acceleration).toBe(0.75);
    });
});
