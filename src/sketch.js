import { Player } from "./player.js";
import { Menu } from "./menu.js";
import { Inventory } from "./inventory.js";
import { InventoryMenu } from "./inventoryMenu.js";
import { DeveloperMenu } from "./developerMenu.js";

// Objects used throughout the game.
let player;
let menu;
let developerMenu;
let inventory;
let inventoryMenu;
let playerSpriteSheet;
let hotkeyMessage = "";
let hotkeyMessageFrames = 0;

// The PNG is 512 x 128: eight 64 x 64 columns, two animation rows.
const SPRITE_SIZE = 64;

const PLAYER_DIRECTIONS = [
    "south", "southeast", "east", "northeast",
    "north", "northwest", "west", "southwest"
];

/** Loads character artwork before setup(). */
function preload() {
    playerSpriteSheet = loadImage("src/assets/player/mage-walk-8dir.png");
}

/**
 * Cuts two animation frames per facing direction out of the PNG.
 * @param {p5.Image} sheet - Loaded character sprite sheet.
 * @returns {Object} Direction-to-animation-frame mapping.
 */
export function createPlayerSprites(sheet) {
    const sprites = {};
    for (let column = 0; column < PLAYER_DIRECTIONS.length; column++) {
        sprites[PLAYER_DIRECTIONS[column]] = [
            sheet.get(column * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE),
            sheet.get(column * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE)
        ];
    }
    return sprites;
}

/** Initializes the canvas, player, all menus, and saved settings. */
function setup() {
    // Fill the browser window; windowResized() keeps it in sync.
    createCanvas(windowWidth, windowHeight);
    noSmooth();

    player = new Player(width / 2, height / 2, createPlayerSprites(playerSpriteSheet));
    menu = new Menu();
    inventory = new Inventory();
    developerMenu = new DeveloperMenu(player, menu, localStorage, inventory);
    inventoryMenu = new InventoryMenu(inventory, menu);
}

/** Draws the four assigned hotkeys during gameplay. */
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
        fill(48, 50, 70, 220);
        stroke(170);
        strokeWeight(1);
        rect(x, y, slotWidth, 56, 5);
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(11);
        text(key.toUpperCase(), x + slotWidth / 2, y + 11);
        if (item) {
            fill(...item.color);
            rect(x + 26, y + 20, 18, 18, 3);
            fill(255);
            textSize(10);
            text(item.symbol, x + 35, y + 29);
            textSize(10);
            text(item.shortName, x + slotWidth / 2, y + 47);
        } else {
            fill(155);
            textSize(15);
            text("-", x + slotWidth / 2, y + 37);
        }
    }
    pop();
}

/** Main game loop; all menus freeze movement and momentum. */
function draw() {
    background(220);
    const paused = menu.isOpen || developerMenu.isOpen || inventoryMenu.isOpen;
    if (!paused) {
        player.handleInput(width, height);
    } else {
        player.stop();
    }
    player.display();

    push();
    fill(0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(menu.getTextSize());
    text("MageQuest", 20, 20);
    textSize(13);
    text("Q: Settings    P: Dev    E: Inventory", 20, 55);
    pop();

    drawHotbar();
    if (hotkeyMessageFrames > 0) {
        push();
        fill(25);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(14);
        text(hotkeyMessage, width / 2, height - 88);
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
 * Toggles one menu and closes the others, preserving their saved values.
 * @param {string} which - "q", "p", or "e".
 */
function toggleGameMenu(which) {
    const targets = { q: menu, p: developerMenu, e: inventoryMenu };
    const target = targets[which];
    const shouldOpen = !target.isOpen;
    for (const other of Object.values(targets)) {
        if (other.isOpen) other.toggle();
    }
    if (shouldOpen) target.toggle();
    player.stop();
}

/**
 * Handles global menu keys and assigns H/J/K/L during gameplay.
 * No spell effects are implemented yet; key activation is acknowledged in
 * the HUD so future gameplay effects can be added without changing menus.
 * @param {KeyboardEvent} event - p5 keyboard event.
 */
function keyPressed(event) {
    const pressedKey = key.toLowerCase();
    if (["q", "p", "e"].includes(pressedKey)) {
        if (!event || !event.repeat) toggleGameMenu(pressedKey);
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
        // Keep W/S navigation one row per key press, just like the Q menu.
        if (event && event.repeat && (pressedKey === "w" || pressedKey === "s")) {
            return false;
        }
        activeMenu.handleInput(pressedKey);
        return false;
    }

    if (inventory.keys.includes(pressedKey)) {
        if (!event || !event.repeat) {
            const item = inventory.getAssigned(pressedKey);
            hotkeyMessage = item
                ? pressedKey.toUpperCase() + ": " + item.name + " (effect coming later)"
                : pressedKey.toUpperCase() + ": No item assigned (press E)";
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
}

// p5.js global mode finds these callbacks on window. Functions in a module are
// not global, so expose them explicitly.
Object.assign(window, { preload, setup, draw, keyPressed, windowResized });
