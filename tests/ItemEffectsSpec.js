import { useItem, applyGear, HEAL_POTION_AMOUNT, BOMB_DAMAGE } from "../src/itemEffects.js";
import { Inventory } from "../src/inventory.js";
import { Player } from "../src/player.js";
import { Enemy } from "../src/enemy.js";

function setup() {
    const saved = {};
    const inventory = new Inventory({ getItem: k => saved[k] ?? null, setItem: (k, v) => { saved[k] = v; } });
    const player = new Player(100, 100);
    return { inventory, player };
}

describe("Using items", function () {
    it("a healing potion heals and is used up", function () {
        const { inventory, player } = setup();
        inventory.setQuantity("healing_potion", 2);
        player.takeDamage(60);
        const result = useItem("healing_potion", { player, inventory });
        expect(result.used).toBe(true);
        expect(player.stats.health).toBe(40 + HEAL_POTION_AMOUNT);
        expect(inventory.getQuantity("healing_potion")).toBe(1);
    });

    it("keeps a healing potion when health is already full", function () {
        const { inventory, player } = setup();
        inventory.setQuantity("healing_potion", 1);
        expect(useItem("healing_potion", { player, inventory }).used).toBe(false);
        expect(inventory.getQuantity("healing_potion")).toBe(1);
    });

    it("a mana potion restores mana", function () {
        const { inventory, player } = setup();
        player.stats.spendMana(40);
        useItem("mana_potion", { player, inventory });
        expect(player.stats.mana).toBe(40);
        expect(inventory.getQuantity("mana_potion")).toBe(1);
    });

    it("a shield potion blocks damage until it wears off", function () {
        const { inventory, player } = setup();
        inventory.setQuantity("shield_potion", 1);
        useItem("shield_potion", { player, inventory });
        player.takeDamage(30);
        expect(player.stats.health).toBe(100);
        player.updateBuffs(10000);
        player.takeDamage(30);
        expect(player.stats.health).toBe(70);
    });

    it("a speed potion raises the speed multiplier for a while", function () {
        const { inventory, player } = setup();
        inventory.setQuantity("speed_potion", 1);
        expect(player.speedMultiplier()).toBe(1);
        useItem("speed_potion", { player, inventory });
        expect(player.speedMultiplier()).toBeGreaterThan(1);
        player.updateBuffs(10000);
        expect(player.speedMultiplier()).toBe(1);
    });

    it("a fire bomb damages only nearby enemies and reports kills", function () {
        const { inventory, player } = setup();
        inventory.setQuantity("fire_bomb", 1);
        const near = new Enemy(100, 100, {}, { health: BOMB_DAMAGE });
        const far = new Enemy(400, 400, {}, { health: 5 });
        const effects = [];
        const defeated = [];
        const result = useItem("fire_bomb", { player, inventory, enemies: [near, far], effects,
            onDefeat: e => defeated.push(e) });
        expect(result.used).toBe(true);
        expect(near.isAlive()).toBe(false);
        expect(far.health).toBe(5);
        expect(defeated).toEqual([near]);
        expect(effects.length).toBe(1);
        expect(inventory.getQuantity("fire_bomb")).toBe(0);
    });

    it("gear is passive: it is never used up and its bonus follows the inventory", function () {
        const { inventory, player } = setup();
        applyGear(player, inventory);
        expect(player.spellPower).toBe(0);
        inventory.setQuantity("arcane_staff", 1);
        inventory.setQuantity("swift_boots", 1);
        applyGear(player, inventory);
        expect(player.spellPower).toBe(1);
        expect(player.speedMultiplier()).toBeCloseTo(1.2);
        expect(useItem("arcane_staff", { player, inventory }).used).toBe(false);
        expect(inventory.getQuantity("arcane_staff")).toBe(1);
    });

    it("does nothing for items the player does not own", function () {
        const { inventory, player } = setup();
        expect(useItem("fire_bomb", { player, inventory }).used).toBe(false);
    });
});
