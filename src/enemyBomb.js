/** A goblin bomb: two-second fuse, then a short sprite-based explosion. */
export class EnemyBomb {
    constructor(x, y, damage = 1) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.fuse = 120; // Two seconds at 60 FPS.
        this.radius = 50;
        this.exploding = false;
        this.explosionFrames = 0;
        this.done = false;
    }

    /** Apply damage once, at detonation, only with a clear path to the player. */
    hitPlayer(player, walls, world, tileSize) {
        if (!player?.stats?.isAlive() || !walls || !world) return;
        const dx = player.x + player.size / 2 - this.x;
        const dy = player.y + player.size / 2 - this.y;
        const distance = Math.hypot(dx, dy);
        if (distance > this.radius + player.size * 0.35) return;
        // Sample the blast path so solid walls and empty tiles shield the player.
        const steps = Math.max(1, Math.ceil(distance / 2));
        for (let i = 1; i <= steps; i++) {
            const x = this.x + dx * i / steps;
            const y = this.y + dy * i / steps;
            if (!world.isFloor(Math.floor(x / tileSize), Math.floor(y / tileSize)) ||
                walls.blocksPoint(x, y)) return;
        }
        player.takeDamage(this.damage);
    }

    update(frameScale = 1, player = null, walls = null, world = null, tileSize = 25) {
        if (this.done) return;
        const time = Number.isFinite(frameScale) ? Math.max(0, Math.min(frameScale, 3)) : 0;
        if (!time) return;
        if (this.exploding) {
            this.explosionFrames = Math.max(0, this.explosionFrames - time);
            if (!this.explosionFrames) this.done = true;
            return;
        }
        this.fuse = Math.max(0, this.fuse - time);
        if (this.fuse > 0) return;
        this.exploding = true;
        this.explosionFrames = 24;
        this.hitPlayer(player, walls, world, tileSize);
    }

    display(items = {}) {
        const frames = this.exploding ? items.explosion : items.bomb;
        if (this.done || !frames?.length) return;
        const index = this.exploding
            ? Math.min(frames.length - 1, Math.floor((24 - this.explosionFrames) / 6))
            : Math.floor((120 - this.fuse) / 12) % frames.length;
        const size = this.exploding ? 100 : 20;
        push();
        imageMode(CENTER);
        image(frames[index], this.x, this.y, size, size);
        pop();
    }
}
