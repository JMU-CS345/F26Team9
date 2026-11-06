function setup() {
  createCanvas(400, 400);
  const tileSize = 30;
  tileGrid = new TileGrid(Math.ceil(width / tileSize), Math.ceil(height / tileSize), tileSize);
}

class Tile {
	constructor(x, y, size, color = 230) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
		this.image = null;
	}

	loadImage(path) {
		loadImage(path, (loadedImage) => {
			this.image = loadedImage;
		});
	}

	setImage(image) {
		this.image = image;
	}

	draw() {
		if (this.image) {
			image(this.image, this.x, this.y, this.size, this.size);
		} else {
			fill(this.color);
			rect(this.x, this.y, this.size, this.size);
		}

		noFill();
		stroke(100);
		strokeWeight(1);
		rect(this.x, this.y, this.size, this.size);
	}
}

class TileGrid {
	constructor(cols, rows, tileSize, tileColors = []) {
		this.cols = cols;
		this.rows = rows;
		this.tileSize = tileSize;
		this.tiles = Array.from({ length: rows }, (_, row) =>
			Array.from({ length: cols }, (_, col) =>
				new Tile(col * tileSize, row * tileSize, tileSize, tileColors[row]?.[col] ?? 230)
			)
		);
	}

	draw() {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				this.tiles[row][col].draw();
			}
		}
	}
}

let tileGrid;

function draw() {
  background(220);
  tileGrid.draw();
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
