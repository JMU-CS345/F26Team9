import { dimScreen, pixelPanel, pixelSlot, pixelItemIcon, pixelText } from "./pixelUI.js";

/**
 * Tab-key inventory screen: four hotkeys across the top and four inventory slots
 * per page below. WASD navigates; Space picks, cancels or assigns an item.
 */
export class InventoryMenu {
    /**
     * @param {Inventory} inventory - The player's owned items and hotkeys.
     * @param {Menu} menu - Main settings menu (for matching font-size setting).
     */
    constructor(inventory, menu) {
        this.inventory = inventory;
        this.menu = menu;
        this.isOpen = false;
        this.row = 1;             // 0: H/J/K/L hotkeys; 1: inventory.
        this.hotkeyIndex = 0;
        this.inventoryIndex = 0;
        this.selectedItemId = null;
    }

    /** Opens/closes the menu without losing assignments. */
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.row = 1;
            this.inventoryIndex = 0;
            this.hotkeyIndex = 0;
        }
        this.selectedItemId = null;
    }

    /** Returns the first inventory index for the current four-slot page. */
    getPageStart() {
        return Math.floor(this.inventoryIndex / 4) * 4;
    }

    /**
     * Changes the keyboard highlight between hotkeys and inventory entries.
     * @param {string} key - W, A, S or D (lowercase).
     */
    handleInput(key) {
        if (!this.isOpen) return;
        if (key === "w") this.row = 0;
        if (key === "s") this.row = 1;
        if (key !== "a" && key !== "d") return;

        const amount = key === "d" ? 1 : -1;
        if (this.row === 0) {
            this.hotkeyIndex = Math.max(0, Math.min(3, this.hotkeyIndex + amount));
        } else {
            const lastIndex = Math.max(3, this.inventory.ownedItems().length - 1);
            this.inventoryIndex = Math.max(0, Math.min(lastIndex, this.inventoryIndex + amount));
        }
    }

    /**
     * Space toggles selection or places it in a chosen hotkey.
     * Space on an assigned hotkey with nothing selected clears that hotkey.
     */
    handleSpace() {
        if (!this.isOpen) return;
        if (this.row === 1) {
            const item = this.inventory.ownedItems()[this.inventoryIndex];
            if (!item) {
                this.selectedItemId = null;
            } else {
                this.selectedItemId = this.selectedItemId === item.id ? null : item.id;
            }
        } else {
            const key = this.inventory.keys[this.hotkeyIndex];
            if (this.selectedItemId && this.inventory.getQuantity(this.selectedItemId) > 0) {
                // Space on an already-matching slot toggles that binding off.
                const already = this.inventory.getAssigned(key);
                if (already && already.id === this.selectedItemId) {
                    this.inventory.unassign(key);
                } else {
                    this.inventory.assign(this.selectedItemId, key);
                }
                this.selectedItemId = null;
            } else {
                this.inventory.unassign(key);
                this.selectedItemId = null;
            }
        }
    }

    /** Draws a grayscale pixel-art inventory slot. */
    drawSlot(x, y, item, label, active, picked) {
        pixelSlot(x, y, 94, 90, active, picked);
        pixelText(label, x + 47, y + 13, 2, "center", 250);
        if (item) {
            pixelItemIcon(item, x + 47, y + 45, 2);
            pixelText(item.shortName, x + 47, y + 73, 1, "center", 245);
            // Numbered inventory slots show quantities; lettered hotkeys do not.
            if (/^\d+$/.test(label)) {
                pixelText("X" + this.inventory.getQuantity(item.id), x + 83, y + 49, 1, "right", 210);
            }
        } else {
            pixelText("-", x + 47, y + 47, 3, "center", 150);
        }
    }

    /** Displays hotkey assignments and the scrollable four-slot inventory. */
    display() {
        if (!this.isOpen) return;
        push();
        dimScreen();
        pixelPanel(width / 2 - 280, height / 2 - 248, 560, 496);
        pixelText("SPELL & POTION INVENTORY", width / 2, height / 2 - 212,
                  this.menu.getTextSize() >= 24 ? 3 : 2, "center");

        const startX = width / 2 - 215;
        const gap = 18;
        const hotbarY = height / 2 - 157;
        const inventoryY = height / 2 + 23;
        pixelText("HOTKEYS H / J / K / L", width / 2, hotbarY - 18, 2, "center", 220);

        for (let i = 0; i < 4; i++) {
            const key = this.inventory.keys[i];
            this.drawSlot(startX + i * (94 + gap), hotbarY,
                          this.inventory.getAssigned(key), key,
                          this.row === 0 && this.hotkeyIndex === i, false);
        }

        pixelText("INVENTORY", width / 2, inventoryY - 24, 2, "center");
        const owned = this.inventory.ownedItems();
        const first = this.getPageStart();
        for (let i = 0; i < 4; i++) {
            const item = owned[first + i] || null;
            this.drawSlot(startX + i * (94 + gap), inventoryY, item,
                          String(first + i + 1),
                          this.row === 1 && this.inventoryIndex === first + i,
                          Boolean(item && this.selectedItemId === item.id));
        }

        const pages = Math.max(1, Math.ceil(owned.length / 4));
        pixelText("PAGE " + (Math.floor(first / 4) + 1) + "/" + pages,
                  width / 2, inventoryY + 108, 2, "center", 210);

        const selected = this.selectedItemId && this.inventory.getItem(this.selectedItemId);
        const focused = this.row === 1 ? owned[this.inventoryIndex]
            : this.inventory.getAssigned(this.inventory.keys[this.hotkeyIndex]);
        pixelText(selected ? "PICKED: " + selected.shortName + " - SPACE TO ASSIGN"
                           : focused ? focused.name : "CHOOSE AN ITEM BELOW",
                  width / 2, inventoryY + 135, 1, "center");
        pixelText("W/S: ROW   A/D: SLOT   SPACE: PICK / ASSIGN / CLEAR",
                  width / 2, inventoryY + 165, 1, "center", 220);
        pixelText("TAB: CLOSE   ESC: SETTINGS   P: DEV",
                  width / 2, inventoryY + 184, 1, "center", 220);
        pop();
    }
}
