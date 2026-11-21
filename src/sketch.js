import { Player, StatBars } from "./player.js";
import { ENEMY_SPRITE_PATH, ENEMY_ITEM_PATH, createEnemySprites, createEnemyItemSprites, spawnEnemies } from "./enemy.js";
import { Menu } from "./menu.js";
import { Inventory } from "./inventory.js";
import { InventoryMenu } from "./inventoryMenu.js";
import { DeveloperMenu } from "./developerMenu.js";
import { LightingRenderer } from "./lightingRenderer.js";
import { SpellCaster } from "./spellCaster.js";
import { SpriteSheet } from "./spellEffects.js";
import { LightOrb } from "./lightOrb.js";
import { XpDrop } from "./xpDrop.js";
import { createRandom, generateWorld } from "./worldGenerator.js";
import { WorldRenderer } from "./worldRenderer.js";
import { Camera } from "./camera.js";
import { Torch } from "./torch.js";
import { WallCollider } from "./wallCollider.js";

// Objects used throughout the game.
let player;
let menu;
let developerMenu;
let inventory;
let inventoryMenu;
let playerSpriteSheet;
let enemySpriteSheet;
let enemyItemSprites = {};
let enemyProjectiles = [];
let enemyBombs = [];
let xpDrops = [];
let enemySprites;
let enemies = [];
let lighting;
let spellImages;
let spellCaster;
let lightOrb;
let tileSheets;
let world;
let worldRenderer;
let camera;
let torches = [];
let walls;
let statBars;
let hotkeyMessage = "";
let hotkeyMessageFrames = 0;
let heldSliderDirection = 0;
let heldSliderFrames = 0;
let selectedClass = null;


// The PNG is 512 x 128: eight 64 x 64 columns, two animation rows.
const SPRITE_SIZE = 64;

// Size of one world tile in world pixels; the tile art is 25 x 25.
const TILE_SIZE = 25;

// World size in tiles. Larger than the screen; the camera follows the player.
const WORLD_COLS = 64;
const WORLD_ROWS = 40;

// Screen pixels per world pixel. A whole number keeps the pixel art crisp.
const CAMERA_ZOOM = 3;

// Shown behind the world where there are no tiles.
const VOID_COLOR = [16, 14, 18];

const PLAYER_DIRECTIONS = [
    "south", "southeast", "east", "northeast",
    "north", "northwest", "west", "southwest"
];



/** Loads character artwork before setup(). */
function preload() {
    playerSpriteSheet = loadImage("src/assets/player/mage-walk-8dir.png");
    enemySpriteSheet = loadImage(ENEMY_SPRITE_PATH);
    spellImages = {
        fireball: loadImage("src/assets/player/fireball.png"),
        iceball: loadImage("src/assets/player/fireball_blue.png"),
        sparkle: loadImage("src/assets/player/flash01.png")
    };
    tileSheets = {
        floor: loadImage("src/assets/tiles/floor-tiles.png"),
        wall: loadImage("src/assets/tiles/wall_tiles_final.png")
    };
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

    player = new Player(0, 0, createPlayerSprites(playerSpriteSheet));
    // Optional attack art must not hold up the initial class-selection screen.
    loadImage(ENEMY_ITEM_PATH, sheet => {
        enemyItemSprites = createEnemyItemSprites(sheet);
    }, error => console.warn("Enemy attack sprites unavailable:", error));
    enemySprites = {};
    for (const type of ["skeleton", "goblin", "slime", "bat"]) {
        enemySprites[type] = createEnemySprites(enemySpriteSheet, type);
    }
    camera = new Camera(CAMERA_ZOOM);
    camera.setView(width, height);
    worldRenderer = new WorldRenderer(tileSheets.floor, tileSheets.wall, TILE_SIZE);
    createWorld();
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
    spellCaster.walls = walls;
    statBars = new StatBars(player.stats);
}

/**
 * Generates a new world, moves the player to the middle of the starting room,
 * and points the camera at them.
 */
function createWorld() {
    // A new seed every time, so each run gets a different layout.
    world = generateWorld(WORLD_COLS, WORLD_ROWS, createRandom(Date.now()), { maxRooms: 14 });
    worldRenderer.build(world, 0, 0);
    walls = new WallCollider(world, TILE_SIZE);
    enemies = spawnEnemies(world, TILE_SIZE, enemySprites);
    enemyProjectiles = [];
    enemyBombs = [];
    xpDrops = [];

    // Each torch hangs just below the wall line of its tile, flickering out of sync.
    torches = world.torches.map(({ col, row }, i) =>
        new Torch((col + 0.5) * TILE_SIZE, (row + 0.5) * TILE_SIZE + 10, i * 37));

    if (world.start) {
        const [col, row] = world.start;
        player.x = (col + 0.5) * TILE_SIZE - player.size / 2;
        player.y = (row + 0.5) * TILE_SIZE - player.size / 2;
        player.stop();
    }

    camera.setBounds(worldWidth(), worldHeight());
    camera.snapTo(player.x + player.size / 2, player.y + player.size / 2);
}

/** @returns {number} World width in world pixels. */
function worldWidth() {
    return world.cols * TILE_SIZE;
}

/** @returns {number} World height in world pixels. */
function worldHeight() {
    return world.rows * TILE_SIZE;
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

/** Displays the player's live stats, the same values the stat bars show. */
function drawWizardStats() {
    if (selectedClass === null) return;
    const stats = player.stats;
    push();
    const x = 1050;
    const y = 25;
    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(14);
    text(selectedClass + " Mage  (Lv " + stats.level + ")", x + 10, y + 8);
    textSize(12);
    text("HP: " + Math.ceil(stats.health) + " / " + stats.maxHealth, x + 10, y + 28);
    text("MP: " + Math.floor(stats.mana) + " / " + stats.maxMana, x + 10, y + 48);
    text("ATK: " + stats.attack, x + 10, y + 68);
    text("DEF: " + stats.defense, x + 10, y + 88);
    pop();
}

/** Draws a popup for choosing the player's class. */
function drawClassSelectionPopup() {
    const classes = ["Fire", "Mind", "Earth"];
    const popupWidth = 340;
    const popupHeight = 190;
    const popupX = (width - popupWidth) / 2;
    const popupY = (height - popupHeight) / 2;
    const buttonWidth = 88;
    const buttonGap = 12;
    const buttonsWidth = classes.length * buttonWidth + (classes.length - 1) * buttonGap;
    const buttonStartX = (width - buttonsWidth) / 2;

    push();
    noStroke();
    fill(0, 0, 0, 175);
    rect(0, 0, width, height);
    fill(38, 34, 48);
    stroke(190, 160, 110);
    strokeWeight(2);
    rect(popupX, popupY, popupWidth, popupHeight, 10);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(22);
    text("Choose Your Class", width / 2, popupY + 45);

    textSize(15);
    for (let i = 0; i < classes.length; i++) {
        const x = buttonStartX + i * (buttonWidth + buttonGap);
        const y = popupY + 105;
        fill(78, 70, 92);
        stroke(210);
        strokeWeight(1);
        rect(x, y, buttonWidth, 42, 5);
        noStroke();
        fill(255);
        text(classes[i], x + buttonWidth / 2, y + 21);
    }
    pop();
}

/** Saves the class selected from the popup. */
function mousePressed() {
    if (selectedClass !== null) return;

    const classes = ["Fire", "Mind", "Earth"];
    const buttonWidth = 88;
    const buttonGap = 12;
    const buttonsWidth = classes.length * buttonWidth + (classes.length - 1) * buttonGap;
    const buttonStartX = (width - buttonsWidth) / 2;
    const buttonY = (height - 190) / 2 + 105;
    const index = Math.floor((mouseX - buttonStartX) / (buttonWidth + buttonGap));
    if (index >= 0 && index < classes.length
        && mouseX <= buttonStartX + index * (buttonWidth + buttonGap) + buttonWidth
        && mouseY >= buttonY && mouseY <= buttonY + 42) {
        selectedClass = classes[index];
        player.stats.applyClass(selectedClass);
        // Fresh bars, so the new maximums don't read as damage or a level-up.
        statBars = new StatBars(player.stats);
    }
}

/** Repeat held slider keys after an initial delay; never auto-repeat test stats. */
function updateHeldSlider() {
    const active = developerMenu.isOpen ? developerMenu : menu.isOpen ? menu : null;
    const adjustable = active && (active === menu || active.selectedSetting < active.settings.length);
    const left = keyIsDown(65);
    const right = keyIsDown(68);
    const direction = adjustable && left !== right ? (left ? -1 : 1) : 0;
    if (direction !== heldSliderDirection) {
        heldSliderDirection = direction;
        heldSliderFrames = 0;
    }
    if (!direction) return;
    heldSliderFrames++;
    // The first step already happens in keyPressed; avoid repeating a quick tap.
    if (heldSliderFrames >= 16 && (heldSliderFrames - 16) % 6 === 0) {
        active.changeSetting(direction);
    }
}

/** Main game loop; all menus freeze movement and momentum. */
function draw() {
    const paused = selectedClass === null || menu.isOpen || developerMenu.isOpen || inventoryMenu.isOpen;
    if (!paused) {
        // Movement and spells are limited to the world, not the screen.
        player.handleInput(worldWidth(), worldHeight(), walls);

        // Same 60 FPS frame units the player uses, so spells keep pace with movement.
        const frameScale = deltaTime > 0 ? Math.min(deltaTime / (1000 / 60), 3) : 1;
        for (const enemy of enemies) {
            enemy.hitFlash = Math.max(0, enemy.hitFlash - frameScale);
            const swooping = enemy.updateBatSwoop(player, world, TILE_SIZE, walls, enemies, frameScale);
            const rushing = enemy.updateGoblinRush(player, world, TILE_SIZE,
                walls, enemies, enemyBombs, frameScale);
            const landed = swooping || rushing ? false : enemy.updateWander(world, TILE_SIZE, walls, enemies, frameScale);
            enemy.updateSlimeAttack(player, enemyProjectiles, landed);
            enemy.updateSkeletonAttack(player, enemyProjectiles, frameScale);
            enemy.updateGoblinAttack(player, enemyProjectiles, frameScale);
        }
        for (const shot of enemyProjectiles) shot.update(frameScale, walls, world, TILE_SIZE, player);
        enemyProjectiles = enemyProjectiles.filter(shot => !shot.done);
        for (const bomb of enemyBombs) bomb.update(frameScale, player, walls, world, TILE_SIZE);
        enemyBombs = enemyBombs.filter(bomb => !bomb.done);
        spellCaster.update(frameScale, worldWidth(), worldHeight(), enemies, dead => {
            xpDrops.push(new XpDrop(dead.x + dead.size / 2, dead.y + dead.size / 2));
        });
        for (const drop of xpDrops) drop.collect(player);
        xpDrops = xpDrops.filter(drop => !drop.collected);
        lightOrb.update(player, frameScale);
        for (const torch of torches) torch.update(frameScale);
        player.stats.update(frameScale);
        statBars.update(frameScale);
        camera.follow(player.x + player.size / 2, player.y + player.size / 2, frameScale);
    } else {
        player.stop();
    }

    updateHeldSlider();

    background(...VOID_COLOR);

    // The world and player are drawn through the camera, in world pixels.
    push();
    camera.apply();
    worldRenderer.display();
    for (const enemy of enemies) if (enemy.isAlive()) enemy.display(enemyItemSprites);
    for (const shot of enemyProjectiles) shot.display(enemyItemSprites);
    for (const bomb of enemyBombs) bomb.display(enemyItemSprites);
    player.display();
    pop();

    lighting.display(getLights(), millis() / 1000, camera.scroll);

    // Spells and the orb glow, so draw them after lighting where darkness cannot dim them.
    push();
    camera.apply();
    for (const torch of torches) torch.display();
    for (const drop of xpDrops) drop.display();
    spellCaster.display();
    lightOrb.display();
    pop();

    // The HUD and menus below are drawn in screen pixels, outside the camera.

    // Light text so the HUD stays readable over the dark ambient lighting.
    push();
    fill(235);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(menu.getTextSize());
    text("MageQuest", 20, 20);
    textSize(13);
    text("Q: Settings    P: Dev    E: Inventory", 20, 55);
    if (selectedClass === null) drawClassSelectionPopup();
    drawWizardStats();
    pop();

    statBars.display(20, 80);
    statBars.displayHurtFlash();

    drawHotbar();
    if (hotkeyMessageFrames > 0) {
        push();
        fill(235);
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
 * Lists the lights for the current frame: the light orb, every active spell, and
 * the torches that light up part of the screen. The shader takes a limited number
 * of lights, so torches come last and the closest ones are listed first.
 * Lights are kept in world pixels and converted to the screen for the lighting pass.
 * @returns {Object[]} Lights as {x, y, radius, color: [r, g, b]} in screen pixels.
 */
function getLights() {
    const toScreen = light => {
        const [x, y] = camera.toScreen(light.x, light.y);
        return { x, y, radius: light.radius * camera.zoom, color: light.color };
    };
    const onScreen = light => light.x + light.radius > 0 && light.x - light.radius < width
        && light.y + light.radius > 0 && light.y - light.radius < height;
    const distanceToCenter = light => Math.hypot(light.x - width / 2, light.y - height / 2);

    const torchLights = torches.flatMap(torch => torch.getLights())
        .map(toScreen)
        .filter(onScreen)
        .sort((a, b) => distanceToCenter(a) - distanceToCenter(b));

    return [...lightOrb.getLights(), ...spellCaster.getLights()].map(toScreen)
        .concat(torchLights);
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
    heldSliderDirection = 0;
    heldSliderFrames = 0;
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
        // OS key repeat must not compete with our controlled A/D hold logic.
        if (event && event.repeat && ["w", "s", "a", "d"].includes(pressedKey)) {
            return false;
        }
        if (["w", "s"].includes(pressedKey)) heldSliderFrames = 0;
        activeMenu.handleInput(pressedKey);
        return false;
    }

    if (inventory.keys.includes(pressedKey)) {
        if (!event || !event.repeat) {
            const item = inventory.getAssigned(pressedKey);
            if (item && spellCaster.knows(item.id)) {
                if (!spellCaster.cast(item.id, player)) {
                    hotkeyMessage = spellCaster.cooldownRemaining(item.id) > 0
                        ? item.name + " is recharging"
                        : "Not enough mana for " + item.name;
                    hotkeyMessageFrames = 40;
                }
                return false;
            }
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
    camera.setView(width, height);
    lighting.resize(width, height);
}

// p5.js global mode finds these callbacks on window. Functions in a module are
// not global, so expose them explicitly.
Object.assign(window, { preload, setup, draw, keyPressed, mousePressed, windowResized });
