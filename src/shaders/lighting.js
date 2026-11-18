/**
 * GLSL source for the lighting and particle shader used by LightingRenderer.
 * Kept as JS strings so the game runs without a build step that loads .glsl files.
 */

// Upper limit on lights per frame. GLSL ES 1.0 needs a constant loop bound.
export const MAX_LIGHTS = 32;

/**
 * Vertex shader: stretches p5's unit rect over the whole layer and passes
 * texture coordinates through, ignoring p5's camera and model transforms.
 */
export const LIGHTING_VERT = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    vec4 position = vec4(aPosition, 1.0);
    position.xy = position.xy * 2.0 - 1.0;
    gl_Position = position;
}
`;

/**
 * Fragment shader with two passes:
 *   uPass 0: light map, drawn with MULTIPLY to darken everything outside lights.
 *   uPass 1: floating motes and a soft glow, drawn with ADD on top.
 */
export const LIGHTING_FRAG = `
precision mediump float;

#define MAX_LIGHTS ${MAX_LIGHTS}

varying vec2 vTexCoord;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uScroll;     // camera offset, so motes stay put in the world
uniform vec3 uAmbient;   // color where no light reaches
uniform vec3 uLightTint; // multiplied into every light
uniform int uPass;
uniform int uLightCount;
uniform vec3 uLights[MAX_LIGHTS];      // x, y, radius in canvas pixels
uniform vec3 uLightColors[MAX_LIGHTS]; // r, g, b from 0 to 1

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Dithering: smooth light falloffs only have 256 steps per channel, which shows as
// rings (banding). Nudging each pixel by up to half a step in a fine, even noise
// pattern (interleaved gradient noise) hides the rings without visible grain.
vec3 dither(vec3 color) {
    float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    return color + (noise - 0.5) / 255.0;
}

// Sum of every light's color at a canvas position, with a smooth falloff to its radius.
vec3 lightAt(vec2 pos) {
    vec3 total = vec3(0.0);
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uLightCount) break;
        float d = distance(pos, uLights[i].xy);
        float falloff = clamp(1.0 - d / uLights[i].z, 0.0, 1.0);
        total += uLightColors[i] * uLightTint * falloff * falloff;
    }
    return total;
}

// Procedural motes: the screen is split into cells, and some cells hold one mote
// that drifts upward, sways side to side, and twinkles. Two layers add depth.
float motes(vec2 pos) {
    float sum = 0.0;
    for (int layer = 0; layer < 2; layer++) {
        float depth = float(layer);
        float cellSize = 56.0 + depth * 40.0;

        // Sliding the lookup down over time makes the motes rise.
        vec2 p = pos + vec2(0.0, uTime * (10.0 + depth * 8.0));
        vec2 id = floor(p / cellSize);
        vec2 local = fract(p / cellSize);

        float seed = hash(id + depth * 17.0);
        if (seed > 0.4) continue;

        // Keep the mote inside its cell so it never gets cut off at a cell edge.
        vec2 center = 0.25 + 0.5 * vec2(hash(id + 1.3), hash(id + 7.1));
        center.x += 0.12 * sin(uTime * (0.6 + seed * 1.5) + seed * 6.28);

        float radius = (1.5 + 2.0 * hash(id + 3.7) + depth) / cellSize;
        float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + seed * 3.0) + seed * 40.0);
        sum += smoothstep(radius, 0.0, length(local - center)) * twinkle;
    }
    return sum;
}

void main() {
    // vTexCoord.y is 0 at the bottom; canvas y grows downward.
    vec2 pos = vec2(vTexCoord.x, 1.0 - vTexCoord.y) * uResolution;
    vec3 light = lightAt(pos);

    if (uPass == 0) {
        gl_FragColor = vec4(dither(clamp(uAmbient + light, 0.0, 1.0)), 1.0);
    } else {
        // Motes are faint in the dark and bright near a light.
        vec3 lit = uAmbient + light;
        float brightness = clamp(max(lit.r, max(lit.g, lit.b)), 0.0, 1.0);
        vec3 moteColor = vec3(1.0, 0.9, 0.65) * motes(pos + uScroll) * (0.2 + 0.8 * brightness);
        vec3 glow = light * 0.12;
        gl_FragColor = vec4(dither(moteColor + glow), 1.0);
    }
}
`;
