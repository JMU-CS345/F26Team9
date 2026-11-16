/**
 * A wall torch: a small pixel-art flame on a bracket that flickers and lights
 * the area around it. It is emissive: draw it after the lighting pass.
 */
export class Torch {
    static LIGHT_RADIUS = 110;
    static LIGHT_COLOR = [1.0, 0.6, 0.25];

    // 60 FPS frames each flame frame stays on screen.
    static FRAME_TIME = 7;

    // Pixel colors used by the sprites below; "." is transparent.
    static PALETTE = {
        d: [62, 54, 50],    // iron bracket
        b: [112, 72, 40],   // wooden handle
        r: [200, 70, 30],   // flame edge
        o: [245, 140, 40],  // flame
        y: [255, 210, 80],  // flame core
        w: [255, 250, 220]  // hottest point
    };

    // Flame frames, each 5 pixels wide, drawn above the handle.
    static FLAMES = [
        ["..o..", ".oyo.", ".oyo.", "royyr", ".rwr.", "..r.."],
        [".o...", "..oy.", ".oyo.", "royor", ".ryr.", "..r.."],
        ["...o.", ".yo..", ".oyo.", "rywor", ".rwr.", "..r.."]
    ];

    // Bracket and handle, drawn below the flame.
    static HANDLE = [".ddd.", "..b..", "..b.."];

    /**
     * @param {number} x - World x-coordinate of the torch's base (center of its wall tile).
     * @param {number} y - World y-coordinate of the torch's base.
     * @param {number} phase - Starting time offset, so torches do not flicker in sync.
     */
    constructor(x, y, phase = 0) {
        this.x = x;
        this.y = y;
        this.age = phase;
    }

    /**
     * Advances the flicker and flame animation.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    update(frameScale) {
        this.age += frameScale;
    }

    /** @returns {number} Index of the flame frame to show now. */
    get frame() {
        return Math.floor(this.age / Torch.FRAME_TIME) % Torch.FLAMES.length;
    }

    /** @returns {number[]} World position of the flame's center, where the light comes from. */
    get flameCenter() {
        const height = Torch.FLAMES[0].length + Torch.HANDLE.length;
        return [this.x, this.y - height + Torch.FLAMES[0].length / 2];
    }

    /**
     * A warm light that wavers slowly, like a real flame.
     * @returns {Object[]} Lights as {x, y, radius, color}.
     */
    getLights() {
        const flicker = 1 + 0.07 * Math.sin(this.age * 0.11) + 0.04 * Math.sin(this.age * 0.29);
        const [x, y] = this.flameCenter;
        return [{ x, y, radius: Torch.LIGHT_RADIUS * flicker, color: Torch.LIGHT_COLOR }];
    }

    /** Draws the flame and handle as one-world-pixel squares, so they scale like the tiles. */
    display() {
        const rows = [...Torch.FLAMES[this.frame], ...Torch.HANDLE];
        const left = Math.round(this.x - rows[0].length / 2);
        const top = Math.round(this.y - rows.length);

        push();
        noStroke();
        rows.forEach((line, row) => {
            for (let col = 0; col < line.length; col++) {
                const color = Torch.PALETTE[line[col]];
                if (!color) continue;
                fill(...color);
                rect(left + col, top + row, 1, 1);
            }
        });
        pop();
    }
}
