/**
 * Represents the settings menu in MageQuest.
 * Handles navigation, text size, sound, brightness, and saving settings.
 */
class Menu {
    /**
     * Creates a new settings menu and loads saved settings.
     */
    constructor() {
        this.isOpen = false;

        // Settings displayed from top to bottom.
        this.settings = ["Sound", "Brightness", "Text Size"];

        // First setting is highlighted when the menu opens.
        this.selectedSetting = 0;

        // Available text sizes.
        this.textSizes = ["Small", "Medium", "Large"];

        // Default settings.
        this.textSizeIndex = 1;
        this.sound = 50;
        this.brightness = 100;

        // Restore previously saved settings.
        this.loadSettings();

        // Apply the current settings.
        this.applySettings();
    }

    /**
     * Opens or closes the settings menu.
     * Saves current settings when closing.
     */
    toggle() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            // Highlight Sound when opening the menu.
            this.selectedSetting = 0;
        } else {
            // Save settings when closing the menu.
            this.saveSettings();
        }
    }

    /**
     * Handles keyboard navigation within the menu.
     *
     * @param {string} pressedKey - Key pressed by the user.
     */
    handleInput(pressedKey) {
        if (!this.isOpen) {
            return;
        }

        // W moves up one setting.
        if (pressedKey === "w") {
            this.selectedSetting = Math.max(
                0, this.selectedSetting - 1
            );
        }

        // S moves down one setting.
        if (pressedKey === "s") {
            this.selectedSetting = Math.min(
                this.settings.length - 1,
                this.selectedSetting + 1
            );
        }

        // A decreases the selected setting.
        if (pressedKey === "a") {
            this.changeSetting(-1);
        }

        // D increases the selected setting.
        if (pressedKey === "d") {
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
        // Sound: Adjust by 5%.
        if (this.selectedSetting === 0) {
            this.sound = Math.max(
                0, Math.min(100, this.sound + direction * 5)
            );
        }

        // Brightness: Adjust by 5%.
        if (this.selectedSetting === 1) {
            this.brightness = Math.max(
                0, Math.min(100, this.brightness + direction * 5)
            );
        }

        // Text Size: Small, Medium, or Large.
        if (this.selectedSetting === 2) {
            this.textSizeIndex = Math.max(
                0, Math.min(2, this.textSizeIndex + direction)
            );
        }

        // Apply changes immediately.
        this.applySettings();

        // Save the new values.
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
        // Convert sound percentage to a value from 0 to 1.
        const volume = this.sound / 100;

        // Update the volume of each HTML audio element.
        document.querySelectorAll("audio").forEach(audio => {
            audio.volume = volume;
        });
    }

    /**
     * Darkens the game screen based on the brightness setting.
     */
    displayBrightness() {
        // Calculate the darkness of the overlay.
        const darkness = 255 * (1 - this.brightness / 100);

        push();

        // Draw a black overlay across the entire canvas.
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

    /**
     * Draws a slider with its current percentage.
     * Percentage text changes with the text size setting.
     *
     * @param {number} x - Starting x-coordinate.
     * @param {number} y - Vertical center of the slider.
     * @param {number} value - Current percentage from 0 to 100.
     */
    drawSlider(x, y, value) {
        const sliderWidth = 220;
        const sliderHeight = 14;

        // Draw the slider background.
        noStroke();
        fill(80, 80, 100);
        rect(x, y - sliderHeight / 2,
             sliderWidth, sliderHeight, 5);

        // Draw the filled portion.
        fill(100, 150, 255);
        rect(x, y - sliderHeight / 2,
             sliderWidth * value / 100, sliderHeight, 5);

        // Draw the slider handle.
        fill(255);
        circle(x + sliderWidth * value / 100, y, 18);

        // Display the current percentage.
        fill(255);
        noStroke();
        textAlign(LEFT, CENTER);
        textSize(this.getTextSize());
        text(value + "%", x + sliderWidth + 20, y);
    }

    /**
     * Draws the settings menu.
     * All menu text uses the currently selected font size.
     */
    display() {
        // Do not draw the menu when it is closed.
        if (!this.isOpen) {
            return;
        }

        push();

        // Get the current font size.
        const fontSize = this.getTextSize();

        // Draw a dark transparent overlay.
        noStroke();
        fill(0, 0, 0, 150);
        rect(0, 0, width, height);

        // Draw the menu background.
        fill(50, 50, 70);
        stroke(255);
        strokeWeight(2);
        rect(width / 2 - 290, height / 2 - 180,
             580, 360, 10);

        // Draw the title.
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(fontSize + 8);
        text("Settings", width / 2, height / 2 - 135);

        // Draw each setting.
        for (let i = 0; i < this.settings.length; i++) {
            const rowY = height / 2 - 65 + i * 80;

            // Highlight the selected setting row.
            if (i === this.selectedSetting) {
                fill(70, 80, 110);
                stroke(100, 150, 255);
                strokeWeight(2);
                rect(width / 2 - 265, rowY - 30,
                     530, 60, 5);
            }

            // Draw the setting label.
            noStroke();
            fill(255);
            textAlign(LEFT, CENTER);
            textSize(fontSize);
            text(this.settings[i] + ":",
                 width / 2 - 240, rowY);

            // Draw the Sound slider.
            if (i === 0) {
                this.drawSlider(
                    width / 2 - 65, rowY, this.sound
                );
            }

            // Draw the Brightness slider.
            if (i === 1) {
                this.drawSlider(
                    width / 2 - 65, rowY, this.brightness
                );
            }

            // Draw the Text Size buttons.
            if (i === 2) {
                for (let j = 0; j < this.textSizes.length; j++) {
                    const buttonX = width / 2 - 65 + j * 100;
                    const buttonY = rowY - 20;

                    // Highlight the active text size.
                    if (j === this.textSizeIndex) {
                        fill(100, 150, 255);
                    } else {
                        fill(80, 80, 100);
                    }

                    stroke(150);
                    strokeWeight(1);
                    rect(buttonX, buttonY, 90, 40, 5);

                    // Draw the button label using the selected font size.
                    noStroke();
                    fill(255);
                    textAlign(CENTER, CENTER);
                    textSize(fontSize);
                    text(this.textSizes[j],
                         buttonX + 45, buttonY + 20);
                }
            }
        }

        // Draw menu instructions.
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(fontSize);
        text(
            "W/S: Navigate    A/D: Adjust    Q: Close",
            width / 2, height / 2 + 155
        );

        pop();
    }
}
