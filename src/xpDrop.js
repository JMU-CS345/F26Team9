/** A small pickup left where a defeated enemy stood. */
export class XpDrop {
    constructor(x, y, amount = 20) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.collected = false;
    }

    /** Collect once when the player's body touches the pickup. */
    collect(player) {
        if (this.collected) return false;
        const centerX = player.x + player.size / 2;
        const centerY = player.y + player.size / 2;
        if (Math.hypot(this.x - centerX, this.y - centerY) > player.size / 2 + 7) return false;
        player.stats.gainExperience(this.amount);
        this.collected = true;
        return true;
    }

    /** Two pixel-art squares make a visible gold XP pickup. */
    display() {
        push();
        noStroke();
        fill(235, 179, 55);
        rect(this.x - 5, this.y - 5, 10, 10);
        fill(255, 244, 161);
        rect(this.x - 2, this.y - 2, 4, 4);
        pop();
    }
}
