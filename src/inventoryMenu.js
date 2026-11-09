/**
 * E-key inventory screen: four hotkeys across the top and four inventory slots
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

    /** Draws a colored square icon without requiring additional artwork. */
    drawItemIcon(item, x, y) {
        fill(...item.color);
        noStroke();
        rect(x, y, 28, 28, 5);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16);
        text(item.symbol, x + 14, y + 14);
    }

    /**
     * Draws a single 94 x 90 slot and its keyboard highlight.
     * @param {number} x - Left edge.
     * @param {number} y - Top edge.
     * @param {Object|null} item - Item shown in the slot.
     * @param {string} label - H/J/K/L or numbered inventory slot.
     * @param {boolean} active - Whether keyboard focus is here.
     * @param {boolean} picked - Whether item is currently held for assignment.
     */
    drawSlot(x, y, item, label, active, picked) {
        fill(...(active ? [70, 90, 130] : [48, 52, 75]));
        stroke(...(picked ? [130, 230, 150] : active ? [110, 175, 255] : [140, 145, 165]));
        strokeWeight(active || picked ? 3 : 1);
        rect(x, y, 94, 90, 6);

        noStroke();
        fill(230);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(label.toUpperCase(), x + 47, y + 12);

        if (item) {
            this.drawItemIcon(item, x + 33, y + 26);
            fill(255);
            textSize(12);
            text(item.shortName, x + 47, y + 67);
            // Owned inventory entries display quantity, but hotkey slots do not.
            if (/^\d+$/.test(label)) {
                fill(230);
                textSize(10);
                text("x" + this.inventory.getQuantity(item.id), x + 83, y + 48);
            }
        } else {
            fill(160);
            textSize(25);
            text("-", x + 47, y + 50);
        }
    }

    /** Draws the layout from the provided sketch, centered on the canvas. */
    display() {
        if (!this.isOpen) return;
        push();
        noStroke();
        fill(0, 0, 0, 160);
        rect(0, 0, width, height);

        fill(43, 45, 64);
        stroke(220);
        strokeWeight(2);
        rect(width / 2 - 280, height / 2 - 248, 560, 496, 10);

        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(Math.min(this.menu.getTextSize() + 7, 30));
        text("Spell & Potion Inventory", width / 2, height / 2 - 213);

        const startX = width / 2 - 215;
        const gap = 18;
        const hotbarY = height / 2 - 157;
        const inventoryY = height / 2 + 23;
        textSize(17);
        text("ASSIGN TO H / J / K / L", width / 2, hotbarY - 17);

        for (let i = 0; i < 4; i++) {
            const key = this.inventory.keys[i];
            const item = this.inventory.getAssigned(key);
            this.drawSlot(startX + i * (94 + gap), hotbarY, item, key,
                          this.row === 0 && this.hotkeyIndex === i, false);
        }

        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(17);
        text("INVENTORY", width / 2, inventoryY - 24);

        const owned = this.inventory.ownedItems();
        const first = this.getPageStart();
        for (let i = 0; i < 4; i++) {
            const item = owned[first + i] || null;
            this.drawSlot(startX + i * (94 + gap), inventoryY, item,
                          String(first + i + 1),
                          this.row === 1 && this.inventoryIndex === first + i,
                          Boolean(item && this.selectedItemId === item.id));
        }

        noStroke();
        fill(210);
        textSize(13);
        const pages = Math.max(1, Math.ceil(owned.length / 4));
        text("Inventory page " + (Math.floor(first / 4) + 1) + " / " + pages,
             width / 2, inventoryY + 107);

        const selected = this.selectedItemId && this.inventory.getItem(this.selectedItemId);
        const focused = this.row === 1 ? owned[this.inventoryIndex]
            : this.inventory.getAssigned(this.inventory.keys[this.hotkeyIndex]);
        fill(255);
        textSize(15);
        text(selected ? "Selected: " + selected.shortName + " (W then A/D, Space to assign)"
                      : focused ? focused.name : "Choose an item below",
             width / 2, inventoryY + 135);
        fill(220);
        textSize(13);
        text("W/S: Switch row    A/D: Move    SPACE: Select / Assign / Clear",
             width / 2, inventoryY + 168);
        text("E: Close    P/Q: Other menus    H/J/K/L: Use during gameplay",
             width / 2, inventoryY + 187);
        pop();
    }
}
