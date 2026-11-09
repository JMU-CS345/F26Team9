import { dimScreen, pixelPanel, pixelHighlight, pixelSlider, pixelButton, pixelText } from "./pixelUI.js";

/**
 * Represents the settings menu in MageQuest.
 * Handles navigation, text size, sound, brightness, and saving settings.
 */
export class Menu {
    /** Creates the menu with defaults, then restores saved preferences. */
    constructor() {
        this.isOpen = false;
        this.settings = ["Sound", "Brightness", "Text Size"];
        this.selectedSetting = 0;
        this.textSizes = ["Small", "Medium", "Large"];

        this.textSizeIndex = 1;
        this.sound = 50;
        this.brightness = 100;

        this.loadSettings();
        this.applySettings();
    }

    /** Opens the menu at Sound, or closes it and saves preferences. */
    toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.selectedSetting = 0;
        } else {
            this.saveSettings();
        }
    }

    /** Handles W/S navigation and A/D adjustments. */
    handleInput(pressedKey) {
        if (!this.isOpen) return;
        if (pressedKey === "w") {
            this.selectedSetting = Math.max(0, this.selectedSetting - 1);
        } else if (pressedKey === "s") {
            this.selectedSetting = Math.min(this.settings.length - 1, this.selectedSetting + 1);
        } else if (pressedKey === "a") {
            this.changeSetting(-1);
        } else if (pressedKey === "d") {
            this.changeSetting(1);
        }
    }

    /**
     * Changes the currently selected setting.
     * Updates and saves the value immediately.
     *
     * @param {number} direction - -1 to decrease, 1 to increase.
     */
    changeSetting(direction) {
        if (this.selectedSetting === 0) {
            this.sound = Math.max(0, Math.min(100, this.sound + direction * 5));
        } else if (this.selectedSetting === 1) {
            this.brightness = Math.max(0, Math.min(100, this.brightness + direction * 5));
        } else if (this.selectedSetting === 2) {
            this.textSizeIndex = Math.max(0, Math.min(2, this.textSizeIndex + direction));
        }

        // Changes take effect immediately and persist after a refresh.
        this.applySettings();
        this.saveSettings();
    }

    /**
     * Returns the selected font size in pixels.
     *
     * @returns {number} Font size.
     */
    getTextSize() {
        const sizes = [14, 18, 24];
        return sizes[this.textSizeIndex];
    }

    /**
     * Applies settings to the game.
     * Updates the volume of existing HTML audio elements.
     */
    applySettings() {
        // HTML audio uses a volume from 0 to 1 instead of a percentage.
        const volume = this.sound / 100;

        document.querySelectorAll("audio").forEach(audio => {
            audio.volume = volume;
        });
    }

    /**
     * Darkens the game screen based on the brightness setting.
     */
    displayBrightness() {
        // The overlay becomes more opaque as brightness decreases.
        const darkness = 255 * (1 - this.brightness / 100);

        push();
        noStroke();
        fill(0, 0, 0, darkness);
        rect(0, 0, width, height);

        pop();
    }

    /**
     * Saves the current settings to browser localStorage.
     */
    saveSettings() {
        const data = {
            textSizeIndex: this.textSizeIndex,
            sound: this.sound,
            brightness: this.brightness
        };

        try {
            localStorage.setItem(
                "mageQuestSettings",
                JSON.stringify(data)
            );
        } catch (error) {
            console.warn("Could not save settings:", error);
        }
    }

    /**
     * Loads previously saved settings from browser localStorage.
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem("mageQuestSettings");

            // Keep defaults if no settings have been saved.
            if (!saved) {
                return;
            }

            const data = JSON.parse(saved);
            if (!data || typeof data !== "object") return;

            // Restore text size if valid.
            if (Number.isInteger(data.textSizeIndex)) {
                this.textSizeIndex = Math.max(
                    0, Math.min(2, data.textSizeIndex)
                );
            }

            // Restore sound if valid.
            if (typeof data.sound === "number" &&
                Number.isFinite(data.sound)) {
                this.sound = Math.max(0, Math.min(100, data.sound));
            }

            // Restore brightness if valid.
            if (typeof data.brightness === "number" &&
                Number.isFinite(data.brightness)) {
                this.brightness = Math.max(
                    0, Math.min(100, data.brightness)
                );
            }
        } catch (error) {
            console.warn("Could not load settings:", error);
        }
    }

    /** Draws the selected value with a square-edged pixel-art slider. */
    drawSlider(x, y, value) {
        pixelSlider(x, y, 180, value / 100);
        pixelText(value + "%", x + 195, y, this.textSizeIndex + 1);
    }

    /** Draws the grayscale pixel-art settings screen. */
    display() {
        if (!this.isOpen) return;
        push();
        dimScreen();
        pixelPanel(width / 2 - 290, height / 2 - 180, 580, 360);
        const fontUnit = this.textSizeIndex + 1;
        pixelText("SETTINGS", width / 2, height / 2 - 132, fontUnit + 1, "center");

        for (let i = 0; i < this.settings.length; i++) {
            const y = height / 2 - 61 + i * 77;
            if (i === this.selectedSetting) {
                pixelHighlight(width / 2 - 260, y - 28, 520, 56);
            }
            pixelText(this.settings[i] + ":", width / 2 - 235, y, fontUnit);
            if (i === 0) this.drawSlider(width / 2 - 50, y, this.sound);
            if (i === 1) this.drawSlider(width / 2 - 50, y, this.brightness);
            if (i === 2) {
                for (let j = 0; j < this.textSizes.length; j++) {
                    const buttonX = width / 2 - 30 + j * 90;
                    pixelButton(buttonX, y - 18, 84, 36, j === this.textSizeIndex);
                    pixelText(this.textSizes[j], buttonX + 42, y, Math.min(fontUnit, 2), "center");
                }
            }
        }
        pixelText("W/S: MOVE   HOLD A/D: ADJUST   ESC: CLOSE",
                  width / 2, height / 2 + 158, 1, "center", 220);
        pop();
    }
}
