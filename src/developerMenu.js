import { ITEM_CATALOG } from "./inventory.js";

/**
 * Developer-only menu for tuning how the player feels during gameplay.
 * W/S selects a property, A/D changes it, and P opens/closes the menu.
 */
export class DeveloperMenu {
    /**
     * @param {Player} player - Player whose movement settings are adjusted.
     * @param {Menu} menu - Normal menu, used to match its text size.
     * @param {Storage} storage - Optional storage substitute for unit tests.
     */
    constructor(player, menu, storage = localStorage, inventory = null) {
        this.player = player;
        this.menu = menu;
        this.storage = storage;
        this.inventory = inventory;
        this.storageKey = "mageQuestDeveloperSettings";
        this.isOpen = false;
        this.selectedSetting = 0;

        // The values use the same 60 FPS frame units as Entity.moveSmooth().
        this.settings = [
            { key: "friction", label: "Ground Friction", min: 0.05, max: 0.90, step: 0.05, value: 0.25 },
            { key: "speed", label: "Base Speed", min: 0.5, max: 8, step: 0.25, value: 2 },
            { key: "acceleration", label: "Acceleration", min: 0.10, max: 2, step: 0.05, value: 0.75 },
            { key: "animationDelay", label: "Walk Frame Delay", min: 3, max: 16, step: 1, value: 8 }
        ];

        this.loadSettings();
        this.applySettings();
    }

    /** Opens or closes the developer menu. Saves values when closing. */
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.selectedSetting = 0;
        } else {
            this.saveSettings();
        }
    }

    /**
     * Handles the same W/S/A/D navigation as the normal settings menu.
     * @param {string} pressedKey - Lowercase keyboard character.
     */
    handleInput(pressedKey) {
        if (!this.isOpen) return;
        if (pressedKey === "w") {
            this.selectedSetting = Math.max(0, this.selectedSetting - 1);
        } else if (pressedKey === "s") {
            const total = this.settings.length + (this.inventory ? ITEM_CATALOG.length : 0);
            this.selectedSetting = Math.min(total - 1, this.selectedSetting + 1);
        } else if (pressedKey === "a") {
            this.changeSetting(-1);
        } else if (pressedKey === "d") {
            this.changeSetting(1);
        }
    }

    /**
     * Changes the selected property by one step and applies it immediately.
     * @param {number} direction - Negative to decrease, positive to increase.
     */
    changeSetting(direction) {
        if (this.selectedSetting >= this.settings.length) {
            if (!this.inventory) return;
            const item = ITEM_CATALOG[this.selectedSetting - this.settings.length];
            this.inventory.setQuantity(item.id, this.inventory.getQuantity(item.id) + direction);
            return;
        }
        const setting = this.settings[this.selectedSetting];
        const changed = setting.value + direction * setting.step;
        // Rounding avoids accumulated floating-point artifacts (e.g., 0.30000004).
        setting.value = Number(Math.max(setting.min, Math.min(setting.max, changed)).toFixed(2));
        this.applySettings();
        this.saveSettings();
    }

    /** Applies the four tuning values directly to the current player. */
    applySettings() {
        for (const setting of this.settings) {
            this.player[setting.key] = setting.value;
        }
    }

    /** Saves developer settings without modifying the ordinary menu settings. */
    saveSettings() {
        const values = {};
        for (const setting of this.settings) values[setting.key] = setting.value;
        try {
            this.storage.setItem(this.storageKey, JSON.stringify(values));
        } catch (error) {
            console.warn("Could not save developer settings:", error);
        }
    }

    /** Loads and validates previously saved developer settings. */
    loadSettings() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== "object") return;

            for (const setting of this.settings) {
                const value = saved[setting.key];
                if (typeof value !== "number" || !Number.isFinite(value)) continue;
                // Snap persisted values to the valid step grid for this control.
                const bounded = Math.max(setting.min, Math.min(setting.max, value));
                const steps = Math.round((bounded - setting.min) / setting.step);
                setting.value = Number((setting.min + steps * setting.step).toFixed(2));
            }
        } catch (error) {
            console.warn("Could not load developer settings:", error);
        }
    }

    /**
     * Draws a percentage bar and value for the selected property.
     * @param {Object} setting - Developer setting definition.
     * @param {number} x - Bar's left edge.
     * @param {number} y - Bar's vertical center.
     */
    drawSlider(setting, x, y) {
        const sliderWidth = 150;
        const fraction = (setting.value - setting.min) / (setting.max - setting.min);

        noStroke();
        fill(80, 80, 100);
        rect(x, y - 7, sliderWidth, 14, 5);
        fill(100, 150, 255);
        rect(x, y - 7, sliderWidth * fraction, 14, 5);
        fill(255);
        circle(x + sliderWidth * fraction, y, 17);

        let valueText = setting.value.toFixed(2);
        if (setting.key === "friction") valueText = Math.round(setting.value * 100) + "%";
        if (setting.key === "animationDelay") valueText = String(setting.value);

        fill(255);
        textAlign(LEFT, CENTER);
        textSize(this.menu.getTextSize());
        text(valueText, x + sliderWidth + 15, y);
    }

    /**
     * Displays movement controls followed by editable counts for each spell
     * and potion. A scrolling list keeps the menu readable at 800 x 600.
     */
    display() {
        if (!this.isOpen) return;
        push();
        const fontSize = this.menu.getTextSize();
        const rows = this.settings.length + (this.inventory ? ITEM_CATALOG.length : 0);
        const visibleRows = 6;
        const start = Math.min(Math.max(0, this.selectedSetting - visibleRows + 1),
                               Math.max(0, rows - visibleRows));

        noStroke();
        fill(0, 0, 0, 150);
        rect(0, 0, width, height);
        fill(50, 50, 70);
        stroke(255);
        strokeWeight(2);
        rect(width / 2 - 290, height / 2 - 255, 580, 510, 10);

        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(Math.min(fontSize + 8, 28));
        text("Developer Settings", width / 2, height / 2 - 220);
        textSize(14);
        text("Movement + Inventory Test Items", width / 2, height / 2 - 190);

        for (let visible = 0; visible < visibleRows; visible++) {
            const index = start + visible;
            if (index >= rows) break;
            const y = height / 2 - 145 + visible * 57;
            if (index === this.selectedSetting) {
                fill(70, 80, 110);
                stroke(100, 150, 255);
                strokeWeight(2);
                rect(width / 2 - 265, y - 25, 530, 50, 5);
            }
            noStroke();
            fill(255);
            textAlign(LEFT, CENTER);
            textSize(Math.min(fontSize, 18));
            if (index < this.settings.length) {
                const setting = this.settings[index];
                text(setting.label + ":", width / 2 - 240, y);
                this.drawSlider(setting, width / 2 - 30, y);
            } else {
                const item = ITEM_CATALOG[index - this.settings.length];
                text(item.name + " (" + item.type + "):", width / 2 - 240, y);
                fill(...item.color);
                rect(width / 2 + 90, y - 11, 22, 22, 4);
                fill(255);
                textAlign(CENTER, CENTER);
                textSize(18);
                text("" + this.inventory.getQuantity(item.id), width / 2 + 162, y);
                textSize(13);
                text("0–9", width / 2 + 224, y);
            }
        }

        noStroke();
        fill(210);
        textAlign(CENTER, CENTER);
        textSize(13);
        text("Row " + (this.selectedSetting + 1) + "/" + rows +
             "    W/S: Navigate    A/D: Adjust", width / 2, height / 2 + 215);
        text("P: Close    E: Assign hotkeys", width / 2, height / 2 + 238);
        pop();
    }
}
