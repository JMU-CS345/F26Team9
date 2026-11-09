/**
 * Scales the game world around the player without changing movement or
 * collision sizes. Menus and the HUD are drawn after end(), at normal size.
 */
export class Camera {
    constructor() {
        this.zoom = 1;
    }

    /** Starts drawing the world, zoomed around the player's center. */
    begin(player) {
        const centerX = player.x + player.size / 2;
        const centerY = player.y + player.size / 2;

        push();
        // At 1x, draw at precisely the same coordinates as the original game.
        if (this.zoom !== 1) {
            translate(centerX, centerY);
            scale(this.zoom);
            translate(-centerX, -centerY);
        }
    }

    /** Screen position of a world point after zooming around the player. */
    toScreen(x, y, player) {
        const centerX = player.x + player.size / 2;
        const centerY = player.y + player.size / 2;
        return {
            x: centerX + (x - centerX) * this.zoom,
            y: centerY + (y - centerY) * this.zoom
        };
    }

    /** Restores normal canvas coordinates for the HUD and menus. */
    end() {
        pop();
    }
}
