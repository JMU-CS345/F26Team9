import { LightOrb } from "../src/lightOrb.js";

/** Jasmine unit tests for the floating light orb. */
describe("LightOrb", function () {
    function target(x = 200, y = 200) {
        return { x, y, size: 32 };
    }

    function settle(orb, hero, frames = 200) {
        for (let i = 0; i < frames; i++) orb.update(hero, 1);
    }

    it("floats above the player once it catches up", function () {
        const hero = target();
        const orb = new LightOrb(0, 0);
        settle(orb, hero);
        const centerX = hero.x + hero.size / 2;
        const centerY = hero.y + hero.size / 2;
        expect(Math.abs(orb.x - centerX)).toBeLessThanOrEqual(LightOrb.ORBIT_X + 1);
        expect(orb.y).toBeLessThan(centerY);
    });

    it("trails behind instead of jumping when the player moves", function () {
        const hero = target();
        const orb = new LightOrb(0, 0);
        settle(orb, hero);
        const before = orb.x;
        hero.x += 300;
        orb.update(hero, 1);
        expect(orb.x).toBeGreaterThan(before);
        expect(orb.x).toBeLessThan(before + 300);
    });

    it("moves the same distance at any frame rate", function () {
        const hero = target(500, 500);
        const oneStep = new LightOrb(0, 0);
        const halfSteps = new LightOrb(0, 0);
        oneStep.update(hero, 1);
        halfSteps.update(hero, 0.5);
        halfSteps.update(hero, 0.5);
        expect(halfSteps.x).toBeCloseTo(oneStep.x, 1);
        expect(halfSteps.y).toBeCloseTo(oneStep.y, 1);
    });

    it("gives off one light centered on the orb", function () {
        const orb = new LightOrb(0, 0);
        settle(orb, target());
        const lights = orb.getLights();
        expect(lights.length).toBe(1);
        expect(lights[0].x).toBe(orb.x);
        expect(lights[0].y).toBe(orb.drawY);
        expect(lights[0].radius).toBeGreaterThan(LightOrb.LIGHT_RADIUS * 0.9);
        expect(lights[0].radius).toBeLessThan(LightOrb.LIGHT_RADIUS * 1.1);
    });
});
