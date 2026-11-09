import { Player } from "./player.js";
import { Menu } from "./menu.js";
import { Inventory } from "./inventory.js";
import { InventoryMenu } from "./inventoryMenu.js";
import { DeveloperMenu } from "./developerMenu.js";
import { LightingRenderer } from "./lightingRenderer.js";
import { SpellCaster } from "./spellCaster.js";
import { SpriteSheet } from "./spellEffects.js";
import { LightOrb } from "./lightOrb.js";
import { Camera } from "./camera.js";
import { pixelText, pixelSlot, pixelItemIcon } from "./pixelUI.js";
import { createPlayerSprites, createPlayerIdleSprites } from "./playerSprites.js";

// Keep this public export: the existing movement tests import it from sketch.js.
export { createPlayerSprites } from "./playerSprites.js";

// Objects used throughout the game.
let player;
let menu;
let developerMenu;
let inventory;
let inventoryMenu;
let playerSpriteSheet;
let playerIdleSheet;
let camera;
let heldDirection = 0;
let heldFrames = 0;
let lighting;
let spellImages;
let spellCaster;
let lightOrb;
let hotkeyMessage = "";
let hotkeyMessageFrames = 0;

// Warm light carried by the player.
const PLAYER_LIGHT_RADIUS = 260;
const PLAYER_LIGHT_COLOR = [1.0, 0.82, 0.55];

/** Loads character artwork before setup(). */
function preload() {
    playerSpriteSheet = loadImage(new URL("./assets/player/mage-walk-8dir.png", import.meta.url).href);
    playerIdleSheet = loadImage(new URL("./assets/player/mage-idle-8dir.png", import.meta.url).href);
    spellImages = {
        fireball: loadImage(new URL("./assets/player/fireball.png", import.meta.url).href),
        iceball: loadImage(new URL("./assets/player/fireball_blue.png", import.meta.url).href),
        sparkle: loadImage(new URL("./assets/player/flash01.png", import.meta.url).href)
    };
}

/** Initializes the canvas, player, all menus, and saved settings. */
function setup() {
    // Fill the browser window; windowResized() keeps it in sync.
    createCanvas(windowWidth, windowHeight);
    noSmooth();

    player = new Player(width / 2, height / 2,
                        createPlayerSprites(playerSpriteSheet),
                        createPlayerIdleSprites(playerIdleSheet));
    camera = new Camera();
    lightOrb = new LightOrb(player.x, player.y);
    menu = new Menu();
    inventory = new Inventory();
    developerMenu = new DeveloperMenu(player, menu, localStorage, inventory, camera);
    inventoryMenu = new InventoryMenu(inventory, menu);
    lighting = new LightingRenderer(width, height);
    spellCaster = new SpellCaster({
        fireball: new SpriteSheet(spellImages.fireball, 4, 10),
        iceball: new SpriteSheet(spellImages.iceball, 4, 10),
        sparkle: new SpriteSheet(spellImages.sparkle, 5, 2)
    });
}

/** Draws the four assigned hotkeys in the updated pixel-art style. */
function drawHotbar() {
    push();
    const slotWidth = 70;
    const gap = 7;
    const startX = width / 2 - (4 * slotWidth + 3 * gap) / 2;
    const y = height - 66;
    for (let i = 0; i < 4; i++) {
        const key = inventory.keys[i];
        const item = inventory.getAssigned(key);
        const x = startX + i * (slotWidth + gap);
        pixelSlot(x, y, slotWidth, 56);
        pixelText(key, x + slotWidth / 2, y + 10, 1, "center");
        if (item) {
            pixelItemIcon(item, x + slotWidth / 2, y + 31, 2);
            pixelText(item.shortName, x + slotWidth / 2, y + 49, 1, "center");
        } else {
            pixelText("-", x + slotWidth / 2, y + 34, 2, "center", 150);
        }
    }
    pop();
}

/** Repeats held A/D adjustments after a short pause, without repeating W/S. */
function updateHeldSlider() {
    if (inventoryMenu.isOpen) {
        heldDirection = 0;
        heldFrames = 0;
        return;
    }
    const activeMenu = developerMenu.isOpen ? developerMenu : menu.isOpen ? menu : null;
    if (!activeMenu) {
        heldDirection = 0;
        heldFrames = 0;
        return;
    }
    const left = keyIsDown(65);
    const right = keyIsDown(68);
    const direction = left === right ? 0 : left ? -1 : 1;
    if (direction !== heldDirection) {
        heldDirection = direction;
        heldFrames = 0;
    }
    if (!direction) return;

    heldFrames++;
    // A tap changes a value immediately in keyPressed(); holding repeats it.
    if (heldFrames >= 16 && (heldFrames - 16) % 6 === 0) {
        activeMenu.changeSetting(direction);
    }
}

/** Main game loop; all menus freeze movement and momentum. */
function draw() {
    background(220);
    const paused = menu.isOpen || developerMenu.isOpen || inventoryMenu.isOpen;
    if (!paused) {
        player.handleInput(width, height);

        // Same 60 FPS frame units the player uses, so spells keep pace with movement.
        const frameScale = deltaTime > 0 ? Math.min(deltaTime / (1000 / 60), 3) : 1;
        spellCaster.update(frameScale, width, height);
        lightOrb.update(player, frameScale);
    } else {
        player.stop();
        updateHeldSlider();
    }

    // The player, spells and orb occupy world space, but lighting is a
    // full-screen shader. Transform its light positions separately below.
    camera.begin(player);
    player.display();
    camera.end();
    lighting.display(getLights(), millis() / 1000);

    // Emissive effects are above the darkening pass, as in the team's game.
    camera.begin(player);
    spellCaster.display();
    lightOrb.display();
    camera.end();

    // UI is not zoomed; preserve its readability and keyboard interactions.
    push();
    const titleUnit = menu.getTextSize() >= 24 ? 4
        : menu.getTextSize() <= 14 ? 2 : 3;
    pixelText("MAGEQUEST", 20, 29, titleUnit, "left", 235);
    pixelText("ESC/Q: SETTINGS   P: DEV   TAB/E: INVENTORY", 20, 62, 2, "left", 235);
    pop();

    drawHotbar();
    if (hotkeyMessageFrames > 0) {
        push();
        pixelText(hotkeyMessage, width / 2, height - 89, 1, "center", 235);
        pop();
        hotkeyMessageFrames--;
    }

    // Render only the currently open overlay; brightness affects them all.
    menu.display();
    developerMenu.display();
    inventoryMenu.display();
    menu.displayBrightness();
}

/**
 * Collects player, orb, and spell lights for the shader each frame.
 * @returns {Object[]} Lights as {x, y, radius, color: [r, g, b]}.
 */
function getLights() {
    // Perlin noise gives the player a gentle, uneven flame-like flicker.
    const flicker = 1 + 0.1 * (noise(millis() * 0.002) - 0.5);
    const worldLights = [{
        x: player.x + player.size / 2,
        y: player.y + player.size / 2,
        radius: PLAYER_LIGHT_RADIUS * flicker,
        color: PLAYER_LIGHT_COLOR
    }, ...lightOrb.getLights(), ...spellCaster.getLights()];

    // LightingRenderer uses screen-space pixels and cannot inherit camera.begin().
    return worldLights.map(light => {
        const position = camera.toScreen(light.x, light.y, player);
        return { ...light, x: position.x, y: position.y,
                 radius: light.radius * camera.zoom };
    });
}

/**
 * Toggles one menu and closes the others, preserving their saved values.
 * @param {string} which - "escape", "p", or "tab".
 */
function toggleGameMenu(which) {
    const targets = { escape: menu, p: developerMenu, tab: inventoryMenu };
    const target = targets[which];
    const shouldOpen = !target.isOpen;
    for (const other of Object.values(targets)) {
        if (other.isOpen) other.toggle();
    }
    if (shouldOpen) target.toggle();
    heldDirection = 0;
    heldFrames = 0;
    player.stop();
}

/**
 * Handles menu shortcuts, inventory selection, and the team's spell casting.
 * ESC/TAB are the updated controls; Q/E remain as backwards-compatible aliases.
 * @param {KeyboardEvent} event - p5 keyboard event.
 */
function keyPressed(event) {
    let pressedKey = String(key || (event && event.key) || "").toLowerCase();
    if (pressedKey === "esc") pressedKey = "escape";
    if (pressedKey === "q") pressedKey = "settings";
    if (pressedKey === "e") pressedKey = "inventory";

    // Tab would otherwise move keyboard focus out of the game canvas.
    if (pressedKey === "tab" && event && event.preventDefault) {
        event.preventDefault();
    }

    if (["escape", "settings", "p", "tab", "inventory"].includes(pressedKey)) {
        if (event && event.repeat) return false;
        if (pressedKey === "escape") {
            // ESC closes an open menu; with no menu open, it opens Settings.
            const open = menu.isOpen ? "escape" : developerMenu.isOpen ? "p"
                : inventoryMenu.isOpen ? "tab" : "escape";
            toggleGameMenu(open);
        } else {
            const target = pressedKey === "settings" ? "escape"
                : pressedKey === "inventory" ? "tab" : pressedKey;
            toggleGameMenu(target);
        }
        return false;
    }

    const activeMenu = inventoryMenu.isOpen ? inventoryMenu
        : developerMenu.isOpen ? developerMenu
        : menu.isOpen ? menu : null;

    if (activeMenu) {
        if (inventoryMenu.isOpen && (pressedKey === " " || (event && event.code === "Space"))) {
            if (!event || !event.repeat) inventoryMenu.handleSpace();
            return false;
        }
        // A/D hold repeats in draw(), not through operating-system key repeat.
        // W/S menu navigation and inventory operations remain one press at a time.
        if (event && event.repeat) return false;
        activeMenu.handleInput(pressedKey);
        return false;
    }

    if (inventory.keys.includes(pressedKey)) {
        if (!event || !event.repeat) {
            const item = inventory.getAssigned(pressedKey);
            if (item && spellCaster.knows(item.id)) {
                if (!spellCaster.cast(item.id, player)) {
                    hotkeyMessage = item.name + " is recharging";
                    hotkeyMessageFrames = 40;
                }
                return false;
            }
            hotkeyMessage = item
                ? pressedKey.toUpperCase() + ": " + item.name + " (effect coming later)"
                : pressedKey.toUpperCase() + ": No item assigned (press TAB)";
            hotkeyMessageFrames = 100;
        }
        return false;
    }
}

/**
 * Resizes the canvas to match the browser window.
 * Called automatically whenever the window is resized.
 */
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    lighting.resize(width, height);
}

// p5.js global mode finds these callbacks on window. Functions in a module are
// not global, so expose them explicitly.
Object.assign(window, { preload, setup, draw, keyPressed, windowResized });
