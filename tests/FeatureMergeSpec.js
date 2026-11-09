import { Camera } from "../src/camera.js";
import { Player } from "../src/player.js";
import { Entity } from "../src/entity.js";
import { DeveloperMenu } from "../src/developerMenu.js";
import { createPlayerSprites, createPlayerIdleSprites } from "../src/playerSprites.js";
import { pixelText, pixelSlider } from "../src/pixelUI.js";

/** Regression tests for features merged from the earlier player/UI branch. */
describe("Merged player and interface features", function () {
    it("loads four idle frames for each of the eight directions", function () {
        const requests = [];
        const sheet = { get(x, y, width, height) {
            requests.push([x, y, width, height]);
            return { x, y, width, height };
        }};
        const idle = createPlayerIdleSprites(sheet);
        expect(Object.keys(idle).length).toBe(8);
        expect(idle.north.length).toBe(4);
        expect(idle.north[3].y).toBe(192);
        expect(requests.length).toBe(32);
    });

    it("keeps the two-frame walking sprite layout unchanged", function () {
        const sprites = createPlayerSprites({ get(x, y, w, h) {
            return { x, y, width: w, height: h };
        }});
        expect(sprites.south.length).toBe(2);
        expect(sprites.south[0].x).toBe(0);
        expect(sprites.south[1].y).toBe(64);
    });

    it("falls back safely if the idle sheet is missing", function () {
        expect(createPlayerIdleSprites(null)).toEqual({});
        expect(createPlayerSprites(null)).toEqual({});
        const player = new Player(10, 20);
        expect(player.getCurrentSprite()).toBeUndefined();
    });

    it("cycles the idle animation, retains facing and walks on input", function () {
        const sprite = { width: 64, height: 64 };
        const idle = { north: [sprite, sprite, sprite, sprite] };
        const walking = { north: [sprite, sprite] };
        const player = new Player(100, 100, walking, idle);
        player.updateDirection(0, -1);
        player.updateAnimation(false, player.idleAnimationDelay);
        expect(player.idleFrame).toBe(1);
        expect(player.getCurrentSprite()).toBe(idle.north[1]);
        player.moveSmooth(0, -1, 800, 600);
        expect(player.isWalking).toBe(true);
        expect(player.walkFrame).toBe(1);
        player.stop();
        expect(player.direction).toBe("north");
        expect(player.isWalking).toBe(false);
        expect(player.getCurrentSprite()).toBe(idle.north[0]);
    });

    it("leaves the original eight-tick walk cycle intact for other entities", function () {
        const entity = new Entity(100, 100);
        for (let i = 0; i < 7; i++) entity.move(1, 0, 500, 500);
        expect(entity.walkFrame).toBe(0);
        entity.move(1, 0, 500, 500);
        expect(entity.walkFrame).toBe(1);
    });

    it("zooms around the player without changing the player's coordinates", function () {
        const player = new Player(100, 200);
        const camera = new Camera();
        camera.zoom = 2;
        const atCenter = camera.toScreen(116, 216, player);
        const toRight = camera.toScreen(146, 216, player);
        expect(atCenter).toEqual({ x: 116, y: 216 });
        expect(toRight).toEqual({ x: 176, y: 216 });
        expect(player.x).toBe(100);
        expect(player.y).toBe(200);
    });

    it("updates zoom without changing movement or saved inventory quantities", function () {
        const values = {};
        const storage = {
            getItem: key => values[key] || null,
            setItem: (key, value) => { values[key] = value; }
        };
        const player = new Player(100, 100);
        const camera = new Camera();
        const menu = new DeveloperMenu(player, { getTextSize: () => 18 }, storage, null, camera);
        menu.toggle();
        menu.selectedSetting = 4;
        menu.handleInput("d");
        expect(camera.zoom).toBe(1.25);
        expect(player.speed).toBe(3);
        expect(player.acceleration).toBe(0.75);
        const restored = new DeveloperMenu(player, { getTextSize: () => 18 }, storage, null, new Camera());
        expect(restored.settings[4].value).toBe(1.25);
    });

    it("draws interface text and sliders using rectangular pixel-art commands", function () {
        const previous = {};
        const calls = [];
        for (const name of ["fill", "noStroke", "rect"]) {
            previous[name] = window[name];
        }
        window.fill = () => {};
        window.noStroke = () => {};
        window.rect = (...values) => calls.push(values);
        try {
            pixelText("MAGEQUEST", 25, 20, 2);
            pixelSlider(100, 100, 150, 0.5);
            expect(calls.length > 25).toBe(true);
            expect(calls.every(args => args.length === 4)).toBe(true);
        } finally {
            for (const name of ["fill", "noStroke", "rect"]) {
                if (previous[name] === undefined) delete window[name];
                else window[name] = previous[name];
            }
        }
    });
});
