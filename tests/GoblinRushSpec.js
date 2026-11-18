import { Enemy, createEnemyItemSprites } from "../src/enemy.js";
import { EnemyBomb } from "../src/enemyBomb.js";
import { World, FLOOR, WALL } from "../src/worldGenerator.js";
import { WallCollider } from "../src/wallCollider.js";
function arena(wall = false) {
    const world = new World(14, 7);
    for (let y = 1; y < 6; y++) for (let x = 1; x < 13; x++) world.floor.set(x, y, FLOOR.BRICK);
    if (wall) { world.floor.set(4, 3, FLOOR.EMPTY); world.walls.set(4, 3, WALL.STONE); }
    return { world, walls: new WallCollider(world, 25) };
}
const player = { x: 175, y: 75, size: 25, stats: { isAlive: () => true } };
const goblin = () => new Enemy(50, 75, {}, { type: "goblin", damage: 3, random: () => 0 });
describe("Goblin rush and timed bombs", function () {
    it("waits for its cooldown and locks a faster rush direction", function () {
        const { world, walls } = arena();
        const enemy = goblin(), bombs = [];
        enemy.updateGoblinRush(player, world, 25, walls, [], bombs, 0);
        expect(enemy.rushCooldown).toBe(180);
        for (let i = 0; i < 179; i++) enemy.updateGoblinRush(player, world, 25, walls, [], bombs);
        expect(enemy.x).toBe(50);
        enemy.updateGoblinRush(player, world, 25, walls, [], bombs);
        expect(Math.abs(enemy.x - 55) < 0.001).toBe(true);
        expect(enemy.rushCooldown).toBe(300);
    });
    it("drops one bomb near the player after rushing", function () {
        const { world, walls } = arena();
        const enemy = goblin(), bombs = [];
        enemy.rushCooldown = 1;
        for (let i = 0; i < 30; i++) enemy.updateGoblinRush(player, world, 25, walls, [], bombs);
        expect(bombs.length).toBe(1);
        expect(bombs[0] instanceof EnemyBomb).toBe(true);
        expect(bombs[0].damage).toBe(3);
        expect(Math.abs(bombs[0].x - (player.x + 12.5)) < 60).toBe(true);
    });
    it("stops at walls and other enemies without passing through", function () {
        for (const blocked of [false, true]) {
            const { world, walls } = arena(blocked);
            const enemy = goblin(), bombs = [];
            const others = blocked ? [] : [new Enemy(100, 75)];
            enemy.rushCooldown = 1;
            for (let i = 0; i < 30; i++) enemy.updateGoblinRush(player, world, 25, walls, others, bombs);
            expect(enemy.x + enemy.size <= 100).toBe(true);
            expect(bombs.length).toBe(1);
        }
    });
    it("counts down for two seconds and uses existing bomb frames", function () {
        const bomb = new EnemyBomb(100, 80, 3);
        bomb.update(0);
        expect(bomb.fuse).toBe(120);
        for (let i = 0; i < 119; i++) bomb.update(1);
        expect(bomb.done).toBe(false);
        const sprites = createEnemyItemSprites({ get: (x, y) => ({ x, y }) });
        expect(sprites.bomb[0]).toEqual({ x: 0, y: 175 });
        bomb.update(1);
        expect(bomb.done).toBe(true);
    });
});
