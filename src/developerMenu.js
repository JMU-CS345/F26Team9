import { ITEM_CATALOG } from "./inventory.js";
import { dimScreen, pixelPanel, pixelHighlight, pixelSlider, pixelText, pixelItemIcon } from "./pixelUI.js";

/**
 * Developer-only menu for tuning how the player feels during gameplay.
 * W/S selects a property, A/D changes it, and P opens/closes the menu.
 */
export class DeveloperMenu {
    /**
     * @param {Player} player - Player whose movement settings are adjusted.
     * @param {Menu} menu - Normal menu, used to match its text size.
     * @param {Storage} storage - Browser storage or test substitute.
     * @param {Inventory|null} inventory - Items to add or remove for testing.
     * @param {Camera|null} camera - Camera whose zoom can be adjusted.
     */
    constructor(player, menu, storage = localStorage, inventory = null, camera = null) {
        this.player = player;
        this.camera = camera;
        this.menu = menu;
        this.storage = storage;
        this.inventory = inventory;
        this.storageKey = "mageQuestDeveloperSettings";
        this.isOpen = false;
        this.selectedSetting = 0;

        // The values use the same 60 FPS frame units as Entity.moveSmooth().
        this.settings = [
            { key: "friction", label: "Ground Friction", min: 0.05, max: 0.90, step: 0.05, value: 0.25 },
            { key: "speed", label: "Base Speed", min: 1, max: 8, step: 0.25, value: 3 },
            { key: "acceleration", label: "Acceleration", min: 0.10, max: 2, step: 0.05, value: 0.75 },
            { key: "animationDelay", label: "Walk Frame Delay", min: 3, max: 16, step: 1, value: 8 },
            { key: "zoom", label: "Camera Zoom", min: 0.5, max: 3, step: 0.25, value: 1 }
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
            // Rows after the sliders change the corresponding item quantity.
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

    /** Applies movement tuning to the player and zoom to the camera. */
    applySettings() {
        for (const setting of this.settings) {
            if (setting.key === "zoom") {
                if (this.camera) this.camera.zoom = setting.value;
            } else {
                this.player[setting.key] = setting.value;
            }
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

    /** Draws a square-edged gray slider with a pixel-font value. */
    drawSlider(setting, x, y) {
        const fraction = (setting.value - setting.min) / (setting.max - setting.min);
        pixelSlider(x, y, 150, fraction);
        let valueText = setting.value.toFixed(2);
        if (setting.key === "friction") valueText = Math.round(setting.value * 100) + "%";
        if (setting.key === "animationDelay") valueText = String(setting.value);
        if (setting.key === "zoom") valueText = setting.value.toFixed(2) + "X";
        pixelText(valueText, x + 162, y, 2);
    }

    /** Draws the scrollable grayscale pixel-art developer screen. */
    display() {
        if (!this.isOpen) return;
        push();
        const rows = this.settings.length + (this.inventory ? ITEM_CATALOG.length : 0);
        const visibleRows = 6;
        const start = Math.min(Math.max(0, this.selectedSetting - visibleRows + 1),
                               Math.max(0, rows - visibleRows));

        dimScreen();
        pixelPanel(width / 2 - 290, height / 2 - 255, 580, 510);
        const rowUnit = Math.min(2, this.menu.textSizeIndex + 1 || 2);
        pixelText("DEVELOPER SETTINGS", width / 2, height / 2 - 220,
                  this.menu.getTextSize() >= 24 ? 3 : 2, "center");
        pixelText("MOVEMENT / CAMERA / TEST ITEMS", width / 2, height / 2 - 188, 1, "center", 190);

        for (let visible = 0; visible < visibleRows; visible++) {
            const index = start + visible;
            if (index >= rows) break;
            const y = height / 2 - 145 + visible * 57;
            if (index === this.selectedSetting) {
                pixelHighlight(width / 2 - 265, y - 25, 530, 50);
            }
            if (index < this.settings.length) {
                const setting = this.settings[index];
                pixelText(setting.label + ":", width / 2 - 240, y, rowUnit);
                this.drawSlider(setting, width / 2 - 25, y);
            } else {
                const item = ITEM_CATALOG[index - this.settings.length];
                pixelText(item.shortName + " (" + item.type + "):", width / 2 - 240, y, rowUnit);
                pixelItemIcon(item, width / 2 + 100, y, 2);
                pixelText("X" + this.inventory.getQuantity(item.id), width / 2 + 150, y, 2);
            }
        }

        pixelText("ROW " + (this.selectedSetting + 1) + "/" + rows +
                  "   W/S: MOVE   HOLD A/D: ADJUST",
                  width / 2, height / 2 + 215, 1, "center", 225);
        pixelText("P: CLOSE   TAB: INVENTORY   ESC: SETTINGS",
                  width / 2, height / 2 + 238, 1, "center", 225);
        pop();
    }
}
