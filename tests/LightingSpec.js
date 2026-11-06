import { LightingRenderer } from "../src/lightingRenderer.js";
import { MAX_LIGHTS } from "../src/shaders/lighting.js";

/** Jasmine unit tests for packing lights into shader uniforms. */
describe("LightingRenderer.packLights", function () {
    it("flattens positions, radii, and colors", function () {
        const packed = LightingRenderer.packLights([
            { x: 10, y: 20, radius: 30, color: [1, 0.5, 0.25] },
            { x: 40, y: 50, radius: 60, color: [0, 0, 1] }
        ]);
        expect(packed.count).toBe(2);
        expect(packed.positions.slice(0, 6)).toEqual([10, 20, 30, 40, 50, 60]);
        expect(packed.colors.slice(0, 6)).toEqual([1, 0.5, 0.25, 0, 0, 1]);
    });

    it("always returns arrays sized for the shader", function () {
        const packed = LightingRenderer.packLights([]);
        expect(packed.count).toBe(0);
        expect(packed.positions.length).toBe(MAX_LIGHTS * 3);
        expect(packed.colors.length).toBe(MAX_LIGHTS * 3);
        expect(packed.positions.every(v => v === 0)).toBe(true);
    });

    it("drops lights beyond the shader's limit", function () {
        const lights = [];
        for (let i = 0; i < MAX_LIGHTS + 5; i++) {
            lights.push({ x: i, y: i, radius: 10, color: [1, 1, 1] });
        }
        const packed = LightingRenderer.packLights(lights);
        expect(packed.count).toBe(MAX_LIGHTS);
        expect(packed.positions.length).toBe(MAX_LIGHTS * 3);
    });

    it("keeps the radius above zero so the shader never divides by zero", function () {
        const packed = LightingRenderer.packLights([{ x: 0, y: 0, radius: 0, color: [1, 1, 1] }]);
        expect(packed.positions[2]).toBe(1);
    });
});
