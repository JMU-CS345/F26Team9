/**
 * Treasure chests: 2-3 per level. Some sit out in rooms away from the start; the
 * rest are "rich" chests locked inside vaults (see vault.js).
 * Walking up to one and pressing Space opens it once and adds its reward to the inventory.
 */

// Chests per level.
export const MIN_CHESTS = 2;
export const MAX_CHESTS = 3;

// How close (world pixels, center to center) the player must be to open a chest.
export const OPEN_RANGE = 24;

// Gold given when a chest rolls gold, or when its item cannot be carried.
export const GOLD_MIN = 15;
export const GOLD_MAX = 40;

// Extra gold in a vault chest, on top of its item.
export const VAULT_BONUS_GOLD = 25;

const POTIONS = ["healing_potion", "mana_potion", "speed_potion", "shield_potion"];
const GEAR = ["arcane_staff", "swift_boots"];
const WEAPON_SPELLS = ["fire_bolt", "ice_shard", "lightning", "heal_spell"];

/**
 * Loot table. Healing potions are listed on their own, on top of the general
 * potion roll, because they no longer come in the starting kit.
 * Rolls that would give something the player cannot use (a second copy of
 * gear or a spell they already know, or a 10th potion) turn into gold instead.
 */
export const LOOT_TABLE = [
    { kind: "gold", weight: 25 },
    { kind: "item", ids: ["healing_potion"], weight: 20 },
    { kind: "item", ids: POTIONS, weight: 20 },
    { kind: "item", ids: ["fire_bomb"], weight: 15 },
    { kind: "gear", ids: GEAR, weight: 10 },
    { kind: "gear", ids: WEAPON_SPELLS, weight: 10 }
];

/**
 * Picks a chest's reward.
 * @param {function(): number} random - Random number source in [0, 1).
 * @param {Inventory} inventory - Used to skip gear and spells already owned.
 * @param {boolean} rich - Vault chests never roll plain gold; they always hold an item.
 * @returns {Object} {type: "gold", amount} or {type: "item", id}.
 */
export function rollChestLoot(random, inventory, rich = false) {
    const gold = () => ({ type: "gold", amount: GOLD_MIN + Math.floor(random() * (GOLD_MAX - GOLD_MIN + 1)) });
    const pick = list => list[Math.min(list.length - 1, Math.floor(random() * list.length))];

    const table = rich ? LOOT_TABLE.filter(entry => entry.kind !== "gold") : LOOT_TABLE;
    const total = table.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = random() * total;
    let entry = table[table.length - 1];
    for (const candidate of table) {
        if (roll < candidate.weight) { entry = candidate; break; }
        roll -= candidate.weight;
    }

    if (entry.kind === "gold") return gold();
    if (entry.kind === "gear") {
        const missing = entry.ids.filter(id => !inventory.has(id));
        return missing.length ? { type: "item", id: pick(missing) } : gold();
    }
    const id = pick(entry.ids);
    return inventory.getQuantity(id) < 9 ? { type: "item", id } : gold();
}

/** A chest on the dungeon floor. Model plus drawing; it holds no p5 state. */
export class Chest {
    /**
     * @param {number} x - Center x in world pixels.
     * @param {number} y - Center y in world pixels.
     * @param {boolean} rich - True for a vault chest: always an item, plus bonus gold.
     */
    constructor(x, y, rich = false) {
        this.x = x;
        this.y = y;
        this.rich = rich;
        this.opened = false;
        this.reward = null;
        this.openAge = 0; // Frames since opening, for the lid and reward animation.
    }

    /**
     * @param {Player} player - The player.
     * @returns {boolean} True if the player is close enough to open the chest.
     */
    isNear(player) {
        const cx = player.x + player.size / 2;
        // Use the player's feet, which is where they stand on the floor.
        const cy = player.y + player.size * 0.8;
        return Math.hypot(this.x - cx, this.y - cy) <= OPEN_RANGE;
    }

    /**
     * Opens the chest and gives its reward. A chest can only be opened once.
     * @param {Inventory} inventory - Receives the reward.
     * @param {function(): number} random - Random number source.
     * @returns {Object|null} The reward ({type, id} or {type, amount}, plus a
     *   name for display), or null if the chest was already open.
     */
    open(inventory, random = Math.random) {
        if (this.opened) return null;
        this.opened = true;
        const reward = rollChestLoot(random, inventory, this.rich);
        if (reward.type === "item" && inventory.add(reward.id)) {
            reward.name = inventory.getItem(reward.id).name;
            reward.item = inventory.getItem(reward.id);
        } else {
            if (reward.type !== "gold") {
                reward.type = "gold";
                reward.amount = GOLD_MIN;
            }
            inventory.addGold(reward.amount);
            reward.name = reward.amount + " gold";
        }
        if (this.rich) {
            inventory.addGold(VAULT_BONUS_GOLD);
            reward.bonusGold = VAULT_BONUS_GOLD;
            reward.name += " + " + VAULT_BONUS_GOLD + " gold";
        }
        this.reward = reward;
        return reward;
    }

    /** @param {number} frameScale - Elapsed time in 60 FPS frames. */
    update(frameScale) {
        if (this.opened) this.openAge += frameScale;
    }

    /** Draws a 16 x 12 pixel-art chest; open chests show an empty, dark inside. */
    display() {
        const left = Math.round(this.x - 8);
        const top = Math.round(this.y - 6);
        push();
        noStroke();
        // Shadow.
        fill(0, 0, 0, 90);
        rect(left, top + 11, 16, 2);
        // Body.
        fill(110, 66, 34);
        rect(left, top + 4, 16, 8);
        fill(142, 88, 46);
        rect(left + 1, top + 5, 14, 2);
        // Metal bands.
        fill(196, 162, 70);
        rect(left + 2, top + 4, 2, 8);
        rect(left + 12, top + 4, 2, 8);
        if (this.opened) {
            // Lid tipped back and a dark, empty inside.
            fill(62, 34, 18);
            rect(left + 1, top + 2, 14, 3);
            fill(110, 66, 34);
            rect(left, top - 2, 16, 4);
            fill(196, 162, 70);
            rect(left + 2, top - 2, 2, 4);
            rect(left + 12, top - 2, 2, 4);
        } else {
            // Closed lid and lock.
            fill(128, 78, 40);
            rect(left, top, 16, 5);
            fill(160, 102, 56);
            rect(left + 1, top + 1, 14, 1);
            fill(196, 162, 70);
            rect(left + 2, top, 2, 5);
            rect(left + 12, top, 2, 5);
            fill(240, 214, 110);
            rect(left + 7, top + 4, 2, 3);
        }
        pop();
    }

    /**
     * Drawn after the lighting pass so it stays visible in the dark: a twinkle on
     * closed chests, and the reward's icon floating up from a chest just opened.
     */
    displayOverlay() {
        push();
        noStroke();
        if (!this.opened) {
            const t = (typeof millis === "function" ? millis() : 0) / 1000 + this.x * 0.01;
            const glint = (Math.sin(t * 3) + 1) / 2;
            fill(255, 240, 170, 60 + 160 * glint);
            rect(Math.round(this.x + 4), Math.round(this.y - 6), 1, 1);
            fill(255, 240, 170, 200 * glint);
            rect(Math.round(this.x + 3), Math.round(this.y - 7), 3, 1);
            rect(Math.round(this.x + 4), Math.round(this.y - 8), 1, 3);
        } else if (this.reward && this.openAge < 70) {
            const rise = Math.min(1, this.openAge / 30);
            const alpha = 255 * Math.min(1, (70 - this.openAge) / 20);
            const y = this.y - 10 - rise * 12;
            const color = this.reward.item ? this.reward.item.color : [235, 190, 60];
            fill(...color, alpha);
            rect(this.x - 4, y - 4, 8, 8, 1);
            fill(255, alpha);
            textAlign(CENTER, CENTER);
            textSize(6);
            text(this.reward.item ? this.reward.item.symbol : "$", this.x, y);
        }
        pop();
    }
}

/**
 * Places chests in rooms other than the starting room, each in a different room
 * where possible, on a random floor tile away from the room's edge.
 * @param {World} world - Generated level.
 * @param {number} tileSize - World pixels per tile.
 * @param {function(): number} random - Random number source.
 * @param {number|null} count - How many; null picks 2-3 at random.
 * @param {Set<string>} used - "col,row" tiles already holding plates, keys, or levers.
 * @returns {Chest[]} The chests, at tile centers.
 */
export function spawnChests(world, tileSize, random = Math.random, count = null, used = new Set()) {
    const randomInt = (min, max) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
    // Prefer rooms the player has to explore; fall back to the start room in tiny levels.
    let rooms = world.rooms.slice(1);
    if (rooms.length === 0) rooms = world.rooms.slice();

    // Shuffle so the chosen rooms differ every run.
    for (let i = rooms.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
    }

    const target = count ?? randomInt(MIN_CHESTS, MAX_CHESTS);
    const chests = [];
    const taken = used;
    for (let i = 0; chests.length < target && rooms.length > 0; i++) {
        // With fewer rooms than chests, rooms are reused.
        const room = rooms[i % rooms.length];
        const tiles = [];
        for (let row = room.y + 1; row < room.y + room.h - 1; row++) {
            for (let col = room.x + 1; col < room.x + room.w - 1; col++) {
                const key = col + "," + row;
                const isStart = world.start && world.start[0] === col && world.start[1] === row;
                if (world.isFloor(col, row) && !taken.has(key) && !isStart) tiles.push([col, row]);
            }
        }
        if (tiles.length === 0) {
            if (i >= rooms.length * 2) break; // No room has space left.
            continue;
        }
        const [col, row] = tiles[randomInt(0, tiles.length - 1)];
        taken.add(col + "," + row);
        // Keep the tiles next to a chest free too, so nothing else crowds it.
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) taken.add((col + dc) + "," + (row + dr));
        chests.push(new Chest((col + 0.5) * tileSize, (row + 0.5) * tileSize));
    }
    return chests;
}
