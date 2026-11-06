import { MAX_LIGHTS, LIGHTING_VERT, LIGHTING_FRAG } from "./shaders/lighting.js";

/**
 * Draws dynamic lighting and floating particles over the game world with a GLSL shader.
 * Renders into its own WEBGL layer so the main canvas can stay 2D.
 */
export class LightingRenderer {
    /**
     * Creates the WEBGL layer and compiles the shader.
     * @param {number} w - Width of the canvas in pixels.
     * @param {number} h - Height of the canvas in pixels.
     * @param {number} ambient - Brightness where no light reaches, from 0 to 1.
     */
    constructor(w, h, ambient = 0.3) {
        this.ambient = ambient;
        this.layer = createGraphics(w, h, WEBGL);

        // Lighting is smooth, so full retina resolution is not worth the cost.
        this.layer.pixelDensity(1);
        this.layer.noStroke();
        this.shader = this.layer.createShader(LIGHTING_VERT, LIGHTING_FRAG);
    }

    /**
     * Resizes the layer to match the canvas.
     * @param {number} w - New width in pixels.
     * @param {number} h - New height in pixels.
     */
    resize(w, h) {
        this.layer.resizeCanvas(w, h);
    }

    /**
     * Darkens the canvas outside the given lights, then adds glow and particles.
     * Call after drawing the world and before drawing the HUD.
     * @param {Object[]} lights - Lights as {x, y, radius, color: [r, g, b]} (0 to 1).
     * @param {number} time - Time in seconds, used to animate particles.
     */
    display(lights, time) {
        const packed = LightingRenderer.packLights(lights);

        this.layer.shader(this.shader);
        this.shader.setUniform("uResolution", [this.layer.width, this.layer.height]);
        this.shader.setUniform("uTime", time);
        this.shader.setUniform("uAmbient", this.ambient);
        this.shader.setUniform("uLightCount", packed.count);
        this.shader.setUniform("uLights", packed.positions);
        this.shader.setUniform("uLightColors", packed.colors);

        push();
        imageMode(CORNER);

        // Pass 0: multiply by the light map to darken unlit areas.
        this.renderPass(0);
        blendMode(MULTIPLY);
        image(this.layer, 0, 0, width, height);

        // Pass 1: add particles and glow on top.
        this.renderPass(1);
        blendMode(ADD);
        image(this.layer, 0, 0, width, height);

        blendMode(BLEND);
        pop();
    }

    /**
     * Runs the shader over the whole layer for one pass.
     * @param {number} pass - 0 for the light map, 1 for particles and glow.
     */
    renderPass(pass) {
        this.shader.setUniform("uPass", pass);
        this.layer.rect(0, 0, this.layer.width, this.layer.height);
    }

    /**
     * Flattens lights into the arrays the shader expects.
     * Extra lights beyond MAX_LIGHTS are dropped.
     * @param {Object[]} lights - Lights as {x, y, radius, color: [r, g, b]}.
     * @returns {{count: number, positions: number[], colors: number[]}} Uniform data.
     */
    static packLights(lights) {
        const count = Math.min(lights.length, MAX_LIGHTS);

        // Unused slots are zero-filled so the arrays always match the shader's size.
        const positions = new Array(MAX_LIGHTS * 3).fill(0);
        const colors = new Array(MAX_LIGHTS * 3).fill(0);

        for (let i = 0; i < count; i++) {
            const light = lights[i];
            positions[i * 3] = light.x;
            positions[i * 3 + 1] = light.y;
            positions[i * 3 + 2] = Math.max(light.radius, 1);
            colors.splice(i * 3, 3, ...light.color);
        }
        return { count, positions, colors };
    }
}
