/**
 * Items that can be placed on H/J/K/L.
 * - potion: used up when pressed (see itemEffects.js).
 * - spell: cast with mana; never used up (see spellCaster.js).
 * - tool: used up when pressed, like the Fire Bomb.
 * - gear: works passively while owned; pressing its hotkey describes it.
 * New items go at the end so developer-menu rows keep their order.
 */
export const ITEM_CATALOG = [
    { id: "healing_potion", name: "Healing Potion", shortName: "Heal", type: "potion", symbol: "+", color: [205, 72, 89] },
    { id: "mana_potion", name: "Mana Potion", shortName: "Mana", type: "potion", symbol: "M", color: [70, 115, 230] },
    { id: "speed_potion", name: "Speed Potion", shortName: "Speed", type: "potion", symbol: ">", color: [230, 167, 58] },
    { id: "shield_potion", name: "Shield Potion", shortName: "Shield", type: "potion", symbol: "O", color: [88, 184, 204] },
    { id: "fire_bolt", name: "Fire Bolt", shortName: "Fire", type: "spell", symbol: "F", color: [227, 112, 60] },
    { id: "ice_shard", name: "Ice Shard", shortName: "Ice", type: "spell", symbol: "I", color: [98, 182, 241] },
    { id: "lightning", name: "Lightning", shortName: "Bolt", type: "spell", symbol: "L", color: [233, 215, 83] },
    { id: "heal_spell", name: "Heal Spell", shortName: "Cure", type: "spell", symbol: "H", color: [98, 202, 132] },
    { id: "fire_bomb", name: "Fire Bomb", shortName: "Bomb", type: "tool", symbol: "*", color: [196, 66, 44] },
    { id: "arcane_staff", name: "Arcane Staff", shortName: "Staff", type: "gear", symbol: "/", color: [150, 98, 214] },
    { id: "swift_boots", name: "Swift Boots", shortName: "Boots", type: "gear", symbol: "B", color: [139, 104, 70] }
];

/** Most gold the player can carry. */
export const MAX_GOLD = 9999;

/** Stores owned items and assignments independently of p5 drawing code. */
export class Inventory {
    /**
     * @param {Storage} storage - Browser storage or test substitute.
     */
    constructor(storage = localStorage) {
        this.storage = storage;
        // v2: healing potions are no longer a starting item, so older saves are ignored.
        this.storageKey = "mageQuestInventory_v2";
        this.keys = ["h", "j", "k", "l"];
        this.quantities = {};
        this.bindings = { h: null, j: null, k: null, l: null };
        this.gold = 0;

        // A starting kit; healing potions and everything else come from chests.
        for (const item of ITEM_CATALOG) this.quantities[item.id] = 0;
        this.quantities.mana_potion = 2;
        this.quantities.fire_bolt = 1;
        this.quantities.ice_shard = 1;
        this.load();
    }

    /** @returns {Object|undefined} Catalog entry for a known item ID. */
    getItem(id) {
        return ITEM_CATALOG.find(item => item.id === id);
    }

    /** @returns {number} Number of owned copies of an item. */
    getQuantity(id) {
        return this.getItem(id) ? this.quantities[id] : 0;
    }

    /** @returns {Object[]} Catalog entries for items owned by the player. */
    ownedItems() {
        return ITEM_CATALOG.filter(item => this.quantities[item.id] > 0);
    }

    /**
     * Adds or removes copies through the developer menu.
     * Removing the last copy also removes its H/J/K/L assignment.
     * @param {string} id - Catalog item ID.
     * @param {number} quantity - New whole-number quantity (0 through 9).
     * @returns {boolean} True when the item ID is recognized.
     */
    setQuantity(id, quantity) {
        if (!this.getItem(id) || !Number.isFinite(quantity)) return false;
        this.quantities[id] = Math.max(0, Math.min(9, Math.round(quantity)));
        if (this.quantities[id] === 0) {
            for (const key of this.keys) {
                if (this.bindings[key] === id) this.bindings[key] = null;
            }
        }
        this.save();
        return true;
    }

    /**
     * Adds copies of an item, up to the limit of 9.
     * @param {string} id - Catalog item ID.
     * @param {number} amount - Copies to add.
     * @returns {boolean} False if the item is unknown or already at the limit.
     */
    add(id, amount = 1) {
        if (!this.getItem(id) || this.quantities[id] >= 9) return false;
        return this.setQuantity(id, this.quantities[id] + amount);
    }

    /**
     * Removes one copy of an item, such as a potion that was just drunk.
     * @param {string} id - Catalog item ID.
     * @returns {boolean} False if none are owned.
     */
    consume(id) {
        if (this.getQuantity(id) <= 0) return false;
        return this.setQuantity(id, this.quantities[id] - 1);
    }

    /** @returns {boolean} True if at least one copy of the item is owned. */
    has(id) {
        return this.getQuantity(id) > 0;
    }

    /**
     * Adds gold, never above MAX_GOLD.
     * @param {number} amount - Gold to add; zero or negative does nothing.
     */
    addGold(amount) {
        if (!(amount > 0)) return;
        this.gold = Math.min(MAX_GOLD, this.gold + Math.round(amount));
        this.save();
    }

    /** @returns {Object|null} The item assigned to the given hotkey. */
    getAssigned(key) {
        const id = this.bindings[String(key).toLowerCase()];
        return id && this.getQuantity(id) > 0 ? this.getItem(id) : null;
    }

    /**
     * Binds one owned item to a hotkey; each item can occupy only one hotkey.
     * @param {string} id - Catalog item ID.
     * @param {string} key - One of h, j, k, or l.
     * @returns {boolean} Whether an assignment was made.
     */
    assign(id, key) {
        key = String(key).toLowerCase();
        if (!this.keys.includes(key) || this.getQuantity(id) === 0) return false;
        for (const otherKey of this.keys) {
            if (this.bindings[otherKey] === id) this.bindings[otherKey] = null;
        }
        this.bindings[key] = id;
        this.save();
        return true;
    }

    /** Removes the item assigned to a hotkey without deleting it from inventory. */
    unassign(key) {
        key = String(key).toLowerCase();
        if (!this.keys.includes(key)) return false;
        this.bindings[key] = null;
        this.save();
        return true;
    }

    /** Persists item counts and hotkeys without affecting either settings menu. */
    save() {
        try {
            this.storage.setItem(this.storageKey, JSON.stringify({
                quantities: this.quantities,
                bindings: this.bindings,
                gold: this.gold
            }));
        } catch (error) {
            console.warn("Could not save inventory:", error);
        }
    }

    /** Restores valid data only; old saves and unknown item IDs are ignored. */
    load() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data || typeof data !== "object") return;

            if (data.quantities && typeof data.quantities === "object") {
                for (const item of ITEM_CATALOG) {
                    const count = data.quantities[item.id];
                    this.quantities[item.id] = Number.isInteger(count)
                        ? Math.max(0, Math.min(9, count)) : 0;
                }
            }
            if (Number.isInteger(data.gold)) {
                this.gold = Math.max(0, Math.min(MAX_GOLD, data.gold));
            }
            if (data.bindings && typeof data.bindings === "object") {
                const alreadyAssigned = new Set();
                for (const key of this.keys) {
                    const id = data.bindings[key];
                    if (typeof id === "string" && this.getQuantity(id) > 0 &&
                        !alreadyAssigned.has(id)) {
                        this.bindings[key] = id;
                        alreadyAssigned.add(id);
                    }
                }
            }
        } catch (error) {
            console.warn("Could not load inventory:", error);
        }
    }
}
