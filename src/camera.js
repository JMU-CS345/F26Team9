/**
 * A zoomed view that follows a target around the world.
 * Positions are in world pixels; the camera's x and y are the world point shown
 * at the center of the screen. It eases toward its target and never shows past
 * the edges of the world.
 */
export class Camera {
    // Fraction of the remaining distance closed each 60 FPS frame; lower lags further.
    static FOLLOW = 0.12;

    /**
     * @param {number} zoom - Screen pixels per world pixel. Whole numbers keep pixel art crisp.
     */
    constructor(zoom = 2) {
        this.zoom = zoom;
        this.x = 0;
        this.y = 0;
        this.viewWidth = 0;
        this.viewHeight = 0;
        this.worldWidth = Infinity;
        this.worldHeight = Infinity;
    }

    /**
     * Sets the size of the screen area the camera draws into.
     * @param {number} w - View width in screen pixels.
     * @param {number} h - View height in screen pixels.
     */
    setView(w, h) {
        this.viewWidth = w;
        this.viewHeight = h;
        this.clamp();
    }

    /**
     * Sets the size of the world the camera must stay inside.
     * @param {number} w - World width in world pixels.
     * @param {number} h - World height in world pixels.
     */
    setBounds(w, h) {
        this.worldWidth = w;
        this.worldHeight = h;
        this.clamp();
    }

    /**
     * Centers the camera on a point immediately, without easing.
     * @param {number} x - World x-coordinate.
     * @param {number} y - World y-coordinate.
     */
    snapTo(x, y) {
        this.x = x;
        this.y = y;
        this.clamp();
    }

    /**
     * Eases the camera toward a point.
     * @param {number} x - World x-coordinate to follow.
     * @param {number} y - World y-coordinate to follow.
     * @param {number} frameScale - Elapsed time in 60 FPS frames.
     */
    follow(x, y, frameScale = 1) {
        // Same easing at any frame rate: close FOLLOW of the gap per 60 FPS frame.
        const blend = 1 - Math.pow(1 - Camera.FOLLOW, frameScale);
        this.x += (x - this.x) * blend;
        this.y += (y - this.y) * blend;
        this.clamp();
    }

    /**
     * Keeps the view inside the world. A world smaller than the view is centered.
     */
    clamp() {
        const halfWidth = this.viewWidth / (2 * this.zoom);
        const halfHeight = this.viewHeight / (2 * this.zoom);
        this.x = Camera.clampAxis(this.x, halfWidth, this.worldWidth);
        this.y = Camera.clampAxis(this.y, halfHeight, this.worldHeight);
    }

    /**
     * @param {number} value - Camera position on one axis.
     * @param {number} half - Half the view's size on that axis, in world pixels.
     * @param {number} size - World size on that axis.
     * @returns {number} Position that keeps the view inside the world.
     */
    static clampAxis(value, half, size) {
        if (!Number.isFinite(size)) return value;
        if (size <= half * 2) return size / 2;
        return Math.max(half, Math.min(value, size - half));
    }

    /**
     * Camera position snapped to whole screen pixels. Drawing from a fractional
     * position makes pixel art shimmer as the camera moves.
     * @returns {number[]} [x, y] in world pixels.
     */
    get snapped() {
        const zoom = this.zoom;
        return [Math.round(this.x * zoom) / zoom, Math.round(this.y * zoom) / zoom];
    }

    /**
     * Converts a world position to a screen position.
     * @param {number} x - World x-coordinate.
     * @param {number} y - World y-coordinate.
     * @returns {number[]} [x, y] in screen pixels.
     */
    toScreen(x, y) {
        const [cx, cy] = this.snapped;
        return [
            (x - cx) * this.zoom + this.viewWidth / 2,
            (y - cy) * this.zoom + this.viewHeight / 2
        ];
    }

    /**
     * Screen position of the world's origin, used to make screen effects move with the world.
     * @returns {number[]} [x, y] in screen pixels.
     */
    get scroll() {
        const [cx, cy] = this.snapped;
        return [cx * this.zoom - this.viewWidth / 2, cy * this.zoom - this.viewHeight / 2];
    }

    /** Applies the camera to p5's drawing transform. Wrap in push() and pop(). */
    apply() {
        const [cx, cy] = this.snapped;
        translate(this.viewWidth / 2, this.viewHeight / 2);
        scale(this.zoom);
        translate(-cx, -cy);
    }
}
