/** A stationary goblin bomb. PR #10 will add the explosion and area damage. */
export class EnemyBomb {
    constructor(x, y, damage = 1) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.fuse = 120; // Two seconds at 60 FPS.
        this.done = false;
    }

    update(frameScale = 1) {
        if (this.done) return;
        const time = Number.isFinite(frameScale) ? Math.max(0, Math.min(frameScale, 3)) : 0;
        this.fuse = Math.max(0, this.fuse - time);
        if (this.fuse === 0) this.done = true;
    }

    display(items = {}) {
        const frames = items.bomb;
        if (this.done || !frames?.length) return;
        push();
        imageMode(CENTER);
        image(frames[Math.floor((120 - this.fuse) / 12) % frames.length],
            this.x, this.y, 20, 20);
        pop();
    }
}
