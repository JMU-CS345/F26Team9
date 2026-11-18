/** Shared movement and sprite drawing for thrown enemy attacks. */
export class EnemyProjectile {
    constructor(x, y, dx, dy, kind = "sword", damage = 1) {
        const length = Math.hypot(dx, dy);
        if (!length) throw new Error("Projectile needs a direction");
        this.x = x;
        this.y = y;
        this.dx = dx / length;
        this.dy = dy / length;
        this.kind = kind;
        this.damage = damage;
        this.speed = kind === "slime" ? 2.6 : 4;
        this.radius = kind === "slime" ? 4 : 3;
        this.bounces = 0;
        this.distance = 0;
        this.life = kind === "slime" ? 200 : 80;
        this.frame = 0;
        this.done = false;
    }

    /** A hit counts if any corner leaves the floor or touches a solid wall. */
    blocked(x, y, walls, world, tileSize) {
        const r = this.radius;
        for (const ox of [-r, r]) {
            for (const oy of [-r, r]) {
                if (!world.isFloor(Math.floor((x + ox) / tileSize),
                    Math.floor((y + oy) / tileSize))) return true;
            }
        }
        return walls.hits({ x: x - r, y: y - r, w: 2 * r, h: 2 * r }).length > 0;
    }

    /** Aim at the character's body, not the feet-only wall hitbox. */
    hitsPlayer(player) {
        if (!player || !player.stats.isAlive()) return false;
        const centerX = player.x + player.size / 2;
        const centerY = player.y + player.size / 2;
        return Math.hypot(this.x - centerX, this.y - centerY)
            <= this.radius + player.size * 0.35;
    }

    /** Small substeps prevent fast throws from passing through thin walls. */
    update(frameScale, walls, world, tileSize, player = null) {
        if (this.done) return;
        const time = Number.isFinite(frameScale) ? Math.max(0, Math.min(frameScale, 3)) : 1;
        if (!time) return;
        this.frame += time;
        this.life -= time;
        if (this.life <= 0) { this.done = true; return; }
        const travel = this.speed * time;
        const steps = Math.ceil(travel / 2);
        const step = travel / steps;
        for (let i = 0; i < steps && !this.done; i++) {
            const nextX = this.x + this.dx * step;
            const nextY = this.y + this.dy * step;
            const hitX = this.blocked(nextX, this.y, walls, world, tileSize);
            const hitY = this.blocked(this.x, nextY, walls, world, tileSize);
            const corner = !hitX && !hitY && this.blocked(nextX, nextY, walls, world, tileSize);
            if (hitX || hitY || corner) {
                if (this.kind !== "slime" || ++this.bounces > 2) {
                    this.done = true;
                } else {
                    if (hitX || corner) this.dx *= -1;
                    if (hitY || corner) this.dy *= -1;
                }
            } else {
                this.x = nextX;
                this.y = nextY;
                if (this.hitsPlayer(player)) {
                    player.takeDamage(this.damage);
                    this.done = true; // Only one hit per projectile.
                }
            }
            this.distance += step;
            if (this.kind !== "slime" && this.distance >= 220) this.done = true;
        }
    }

    /** Draw an animated frame from enemy_items.png in world coordinates. */
    display(sprites) {
        const frames = sprites[this.kind];
        if (!frames || !frames.length || this.done) return;
        const sprite = frames[Math.floor(this.frame / 6) % frames.length];
        push();
        translate(this.x, this.y);
        if (this.kind === "sword" || this.kind === "knife") {
            rotate(Math.atan2(this.dy, this.dx) + Math.PI / 2);
        }
        imageMode(CENTER);
        image(sprite, 0, 0, 16, 16);
        pop();
    }
}
