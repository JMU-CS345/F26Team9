/**
 * Small pixel-art drawing helpers shared by the menus, inventory, and HUD.
 * Everything is drawn with square p5 rectangles, so no external font or
 * UI artwork is needed. The game character sprites are left untouched.
 */

// Each character is a 5 by 7 pixel grid. A space is one empty glyph.
const LETTERS = {
    "A": ["01110","10001","10001","11111","10001","10001","10001"],
    "B": ["11110","10001","10001","11110","10001","10001","11110"],
    "C": ["01111","10000","10000","10000","10000","10000","01111"],
    "D": ["11110","10001","10001","10001","10001","10001","11110"],
    "E": ["11111","10000","10000","11110","10000","10000","11111"],
    "F": ["11111","10000","10000","11110","10000","10000","10000"],
    "G": ["01111","10000","10000","10111","10001","10001","01111"],
    "H": ["10001","10001","10001","11111","10001","10001","10001"],
    "I": ["11111","00100","00100","00100","00100","00100","11111"],
    "J": ["00111","00010","00010","00010","10010","10010","01100"],
    "K": ["10001","10010","10100","11000","10100","10010","10001"],
    "L": ["10000","10000","10000","10000","10000","10000","11111"],
    "M": ["10001","11011","10101","10101","10001","10001","10001"],
    "N": ["10001","11001","10101","10011","10001","10001","10001"],
    "O": ["01110","10001","10001","10001","10001","10001","01110"],
    "P": ["11110","10001","10001","11110","10000","10000","10000"],
    "Q": ["01110","10001","10001","10001","10101","10010","01101"],
    "R": ["11110","10001","10001","11110","10100","10010","10001"],
    "S": ["01111","10000","10000","01110","00001","00001","11110"],
    "T": ["11111","00100","00100","00100","00100","00100","00100"],
    "U": ["10001","10001","10001","10001","10001","10001","01110"],
    "V": ["10001","10001","10001","10001","10001","01010","00100"],
    "W": ["10001","10001","10001","10101","10101","10101","01010"],
    "X": ["10001","10001","01010","00100","01010","10001","10001"],
    "Y": ["10001","10001","01010","00100","00100","00100","00100"],
    "Z": ["11111","00001","00010","00100","01000","10000","11111"],
    "0": ["01110","10001","10011","10101","11001","10001","01110"],
    "1": ["00100","01100","00100","00100","00100","00100","01110"],
    "2": ["01110","10001","00001","00010","00100","01000","11111"],
    "3": ["11110","00001","00001","01110","00001","00001","11110"],
    "4": ["00010","00110","01010","10010","11111","00010","00010"],
    "5": ["11111","10000","10000","11110","00001","00001","11110"],
    "6": ["01111","10000","10000","11110","10001","10001","01110"],
    "7": ["11111","00001","00010","00100","01000","01000","01000"],
    "8": ["01110","10001","10001","01110","10001","10001","01110"],
    "9": ["01110","10001","10001","01111","00001","00001","11110"],
    " ": ["00000","00000","00000","00000","00000","00000","00000"],
    ":": ["00000","00100","00100","00000","00100","00100","00000"],
    ".": ["00000","00000","00000","00000","00000","01100","01100"],
    ",": ["00000","00000","00000","00000","00110","00110","00100"],
    "/": ["00001","00001","00010","00100","01000","10000","10000"],
    "-": ["00000","00000","00000","11111","00000","00000","00000"],
    "+": ["00000","00100","00100","11111","00100","00100","00000"],
    "=": ["00000","11111","00000","11111","00000","00000","00000"],
    "?": ["01110","10001","00001","00010","00100","00000","00100"],
    "!": ["00100","00100","00100","00100","00100","00000","00100"],
    "%": ["11001","11010","00010","00100","01000","01011","10011"],
    "(": ["00010","00100","01000","01000","01000","00100","00010"],
    ")": ["01000","00100","00010","00010","00010","00100","01000"],
    "[": ["01110","01000","01000","01000","01000","01000","01110"],
    "]": ["01110","00010","00010","00010","00010","00010","01110"],
    ">": ["10000","01000","00100","00010","00100","01000","10000"],
    "<": ["00001","00010","00100","01000","00100","00010","00001"],
    "&": ["01100","10010","10100","01000","10101","10010","01101"],
    "'": ["00100","00100","00000","00000","00000","00000","00000"],
    "_": ["00000","00000","00000","00000","00000","00000","11111"],
    "#": ["01010","11111","01010","01010","11111","01010","00000"]
};

/** Draws text in a real bitmap font, not a smoothed browser font. */
export function pixelText(message, x, y, size = 2, align = "left", gray = 245) {
    const value = String(message).toUpperCase();
    const step = Math.max(1, Math.round(size));
    // Five pixels per glyph plus a one-pixel gap between letters.
    const textWidth = (value.length * 6 - 1) * step;
    let startX = x;
    if (align === "center") startX -= textWidth / 2;
    if (align === "right") startX -= textWidth;
    const top = Math.round(y - 3.5 * step);
    startX = Math.round(startX);
    noStroke();
    fill(gray);
    for (let i = 0; i < value.length; i++) {
        const glyph = LETTERS[value[i]] || LETTERS["?"];
        for (let row = 0; row < 7; row++) {
            for (let column = 0; column < 5; column++) {
                if (glyph[row][column] === "1") {
                    rect(startX + (i * 6 + column) * step, top + row * step, step, step);
                }
            }
        }
    }
}

/** Gray overlay behind any open menu. */
export function dimScreen() {
    noStroke();
    fill(0, 170);
    rect(0, 0, width, height);
}

/** A square-edged panel with stepped, pixel-art corners and a beveled frame. */
export function pixelPanel(x, y, w, h) {
    x = Math.round(x); y = Math.round(y);
    noStroke();
    // Two overlapping rectangles make the panel's stepped outer corners.
    fill(10);
    rect(x + 8, y, w - 16, h);
    rect(x, y + 8, w, h - 16);

    // Lighter top/left edges and darker bottom/right edges make a bevel.
    fill(210);
    rect(x + 8, y + 4, w - 16, 4);
    rect(x + 4, y + 8, 4, h - 16);
    fill(92);
    rect(x + 8, y + h - 8, w - 16, 4);
    rect(x + w - 8, y + 8, 4, h - 16);
    fill(48);
    rect(x + 12, y + 12, w - 24, h - 24);
    fill(62);
    rect(x + 16, y + 16, w - 32, 4);
    // Decorative rivets in the four interior corners.
    fill(160);
    rect(x + 18, y + 27, 4, 4);
    rect(x + w - 22, y + 27, 4, 4);
    rect(x + 18, y + h - 30, 4, 4);
    rect(x + w - 22, y + h - 30, 4, 4);
}

/** Blocky selected row with a white outline and a gray fill. */
export function pixelHighlight(x, y, w, h) {
    x = Math.round(x); y = Math.round(y);
    noStroke();
    fill(215);
    rect(x, y, w, h);
    fill(90);
    rect(x + 3, y + 3, w - 6, h - 6);
    fill(112);
    rect(x + 6, y + 6, w - 12, h - 12);
}

/** A slider with square handles and grayscale pixel graphics. */
export function pixelSlider(x, y, w, fraction) {
    const f = Math.max(0, Math.min(1, fraction));
    x = Math.round(x); y = Math.round(y);
    noStroke();
    fill(10);
    rect(x, y - 8, w, 16);
    fill(96);
    rect(x + 3, y - 5, w - 6, 10);
    fill(205);
    rect(x + 3, y - 5, Math.round((w - 6) * f), 10);
    const handleX = x + Math.round((w - 12) * f);
    fill(24);
    rect(handleX - 2, y - 12, 16, 24);
    fill(242);
    rect(handleX, y - 10, 12, 20);
    fill(130);
    rect(handleX + 3, y - 6, 3, 12);
}

/** A square selection button for the text-size options. */
export function pixelButton(x, y, w, h, active) {
    noStroke();
    fill(active ? 245 : 145);
    rect(x, y, w, h);
    fill(active ? 96 : 55);
    rect(x + 3, y + 3, w - 6, h - 6);
}

/** Border/background for inventory and HUD slots. */
export function pixelSlot(x, y, w, h, active = false, picked = false) {
    x = Math.round(x); y = Math.round(y);
    noStroke();
    fill(active || picked ? 244 : 155);
    rect(x + 6, y, w - 12, h);
    rect(x, y + 6, w, h - 12);
    fill(picked ? 110 : active ? 80 : 35);
    rect(x + 6, y + 4, w - 12, h - 8);
    rect(x + 4, y + 6, w - 8, h - 12);
    fill(66);
    rect(x + 10, y + 10, w - 20, h - 20);
    fill(active ? 150 : 93);
    rect(x + 10, y + 10, w - 20, 3);
    if (picked) {
        fill(245);
        rect(x + 6, y + 6, 5, 5);
        rect(x + w - 11, y + 6, 5, 5);
        rect(x + 6, y + h - 11, 5, 5);
        rect(x + w - 11, y + h - 11, 5, 5);
    }
}

// Miniature hand-drawn pixel icons. No color is used in any menu or HUD slot.
const ICONS = {
    healing_potion: ["000111000","001222100","001212100","011111110","012222210","012222210","012222210","001111100","000000000"],
    mana_potion:    ["000111000","001222100","001212100","011111110","012222210","012121210","012222210","001111100","000000000"],
    speed_potion:   ["000111000","001222100","001212100","011111110","012221210","012211210","012221210","001111100","000000000"],
    shield_potion:  ["011111110","122222221","122111221","122111221","122111221","012111210","001212100","000121000","000010000"],
    fire_bolt:      ["000010000","000110000","001210000","001220100","012222100","012222210","001222100","000111000","000000000"],
    ice_shard:      ["000020000","020121020","002121200","001222100","222222222","001222100","002121200","020121020","000020000"],
    lightning:      ["000011100","000122100","001221000","012221000","111222110","000122100","001221000","001210000","011000000"],
    heal_spell:     ["000121000","000121000","000121000","111222111","222222222","111222111","000121000","000121000","000121000"]
};

/** Draws a recognizable grayscale pixel icon for each inventory item. */
export function pixelItemIcon(item, centerX, centerY, unit = 3) {
    if (!item) return;
    const pattern = ICONS[item.id] || ICONS.fire_bolt;
    const startX = Math.round(centerX - 4.5 * unit);
    const startY = Math.round(centerY - 4.5 * unit);
    noStroke();
    fill(24); rect(startX - 3, startY - 3, 9 * unit + 6, 9 * unit + 6);
    for (let row = 0; row < 9; row++) {
        for (let column = 0; column < 9; column++) {
            const shade = pattern[row][column];
            if (shade !== "0") {
                fill(shade === "1" ? 138 : 240);
                rect(startX + column * unit, startY + row * unit, unit, unit);
            }
        }
    }
}
