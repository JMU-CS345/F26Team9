import { Camera } from "../src/camera.js";

/** Jasmine unit tests for the camera that follows the player. */
describe("Camera", function () {
    // An 800 x 600 screen at 2x zoom shows 400 x 300 world pixels.
    function makeCamera() {
        const camera = new Camera(2);
        camera.setView(800, 600);
        camera.setBounds(2000, 1000);
        return camera;
    }

    it("centers on a point when snapped to it", function () {
        const camera = makeCamera();
        camera.snapTo(1000, 500);
        expect(camera.x).toBe(1000);
        expect(camera.y).toBe(500);
        expect(camera.toScreen(1000, 500)).toEqual([400, 300]);
    });

    it("eases toward its target instead of jumping", function () {
        const camera = makeCamera();
        camera.snapTo(1000, 500);
        camera.follow(1100, 500);
        expect(camera.x).toBeGreaterThan(1000);
        expect(camera.x).toBeLessThan(1100);
        for (let i = 0; i < 200; i++) camera.follow(1100, 500);
        expect(camera.x).toBeCloseTo(1100, 3);
    });

    it("eases the same distance at any frame rate", function () {
        const oneStep = makeCamera();
        const halfSteps = makeCamera();
        oneStep.snapTo(1000, 500);
        halfSteps.snapTo(1000, 500);
        oneStep.follow(1100, 500, 1);
        halfSteps.follow(1100, 500, 0.5);
        halfSteps.follow(1100, 500, 0.5);
        expect(halfSteps.x).toBeCloseTo(oneStep.x, 6);
    });

    it("never shows past the world's edges", function () {
        const camera = makeCamera();
        camera.snapTo(0, 0);
        expect(camera.x).toBe(200);
        expect(camera.y).toBe(150);
        camera.snapTo(5000, 5000);
        expect(camera.x).toBe(1800);
        expect(camera.y).toBe(850);
    });

    it("centers a world that is smaller than the view", function () {
        const camera = makeCamera();
        camera.setBounds(300, 200);
        camera.snapTo(0, 0);
        expect(camera.x).toBe(150);
        expect(camera.y).toBe(100);
    });

    it("scales distances by the zoom when converting to the screen", function () {
        const camera = makeCamera();
        camera.snapTo(1000, 500);
        expect(camera.toScreen(1010, 495)).toEqual([420, 290]);
    });

    it("snaps to whole screen pixels so pixel art does not shimmer", function () {
        const camera = makeCamera();
        camera.snapTo(1000.3, 500.2);
        const [x, y] = camera.snapped;
        expect(x * camera.zoom).toBe(Math.round(x * camera.zoom));
        expect(y * camera.zoom).toBe(Math.round(y * camera.zoom));
    });

    it("reports how far the world has scrolled on screen", function () {
        const camera = makeCamera();
        camera.snapTo(1000, 500);
        expect(camera.scroll).toEqual([1600, 700]);
    });
});
