/**
 * Jasmine tests for MageQuest's shared movement and facing logic.
 * These do not require a p5.js canvas or character artwork.
 */
describe("Entity movement and facing", function () {
    const directions = [
        { dx:  0, dy: -1, name: "north" },
        { dx:  1, dy: -1, name: "northeast" },
        { dx:  1, dy:  0, name: "east" },
        { dx:  1, dy:  1, name: "southeast" },
        { dx:  0, dy:  1, name: "south" },
        { dx: -1, dy:  1, name: "southwest" },
        { dx: -1, dy:  0, name: "west" },
        { dx: -1, dy: -1, name: "northwest" }
    ];

    for (const testCase of directions) {
        it("faces " + testCase.name + " for its movement vector", function () {
            const entity = new Entity(50, 50);
            entity.move(testCase.dx, testCase.dy, 200, 200);
            expect(entity.direction).toBe(testCase.name);
        });
    }

    it("moves the correct distance horizontally", function () {
        const entity = new Entity(50, 50, 32, 3);
        entity.move(1, 0, 200, 200);
        expect(entity.x).toBe(53);
        expect(entity.y).toBe(50);
    });

    it("normalizes diagonal movement", function () {
        const entity = new Entity(50, 50, 32, 3);
        entity.move(1, 1, 200, 200);
        const distance = Math.hypot(entity.x - 50, entity.y - 50);
        expect(distance).toBeCloseTo(3, 10);
        expect(entity.x - 50).toBeCloseTo(3 / Math.sqrt(2), 10);
        expect(entity.y - 50).toBeCloseTo(3 / Math.sqrt(2), 10);
    });

    it("normalizes arbitrary enemy movement vectors", function () {
        const entity = new Entity(50, 50, 32, 5);
        entity.move(3, 4, 200, 200);
        expect(entity.x).toBeCloseTo(53, 10);
        expect(entity.y).toBeCloseTo(54, 10);
    });

    it("chooses the nearest of eight directions for arbitrary vectors", function () {
        const entity = new Entity(50, 50);
        entity.move(10, 1, 200, 200);
        expect(entity.direction).toBe("east");
        entity.move(-1, -10, 200, 200);
        expect(entity.direction).toBe("north");
    });

    it("keeps its last facing direction when stationary", function () {
        const entity = new Entity(50, 50);
        entity.move(-1, -1, 200, 200);
        const previousX = entity.x;
        const previousY = entity.y;
        entity.move(0, 0, 200, 200);
        expect(entity.direction).toBe("northwest");
        expect(entity.x).toBe(previousX);
        expect(entity.y).toBe(previousY);
    });

    it("stays within all four canvas boundaries", function () {
        const entity = new Entity(0, 0, 32, 10);

        entity.move(-1, -1, 100, 80);
        expect(entity.x).toBe(0);
        expect(entity.y).toBe(0);
        expect(entity.direction).toBe("northwest");

        entity.x = 68;
        entity.y = 48;
        entity.move(1, 1, 100, 80);
        expect(entity.x).toBe(68);
        expect(entity.y).toBe(48);
        expect(entity.direction).toBe("southeast");
    });

    it("does not produce negative positions on a small canvas", function () {
        const entity = new Entity(0, 0, 32, 3);
        entity.move(1, 1, 20, 20);
        expect(entity.x).toBe(0);
        expect(entity.y).toBe(0);
    });

    it("allows an entity without sprites", function () {
        const entity = new Entity(50, 50);
        expect(entity.sprites).toEqual({});
        entity.move(0, -1, 200, 200);
        expect(entity.direction).toBe("north");
        expect(entity.sprites[entity.direction]).toBeUndefined();
    });

    it("selects a directional sprite through the facing property", function () {
        const northSprite = { width: 16, height: 24 };
        const entity = new Entity(50, 50, 32, 3, {
            north: northSprite
        });
        entity.move(0, -1, 200, 200);
        expect(entity.sprites[entity.direction]).toBe(northSprite);
    });
});

describe("Player keyboard input and Entity inheritance", function () {
    const codes = { a: 65, d: 68, w: 87, s: 83 };
    let pressedKeys;
    let previousKeyIsDown;

    beforeEach(function () {
        pressedKeys = new Set();
        previousKeyIsDown = window.keyIsDown;
        window.keyIsDown = code => pressedKeys.has(code);
    });

    afterEach(function () {
        if (previousKeyIsDown === undefined) {
            delete window.keyIsDown;
        } else {
            window.keyIsDown = previousKeyIsDown;
        }
    });

    function holdKeys(...names) {
        pressedKeys.clear();
        for (const name of names) {
            pressedKeys.add(codes[name]);
        }
    }

    const inputs = [
        { keys: ["w"],      name: "north" },
        { keys: ["w", "d"], name: "northeast" },
        { keys: ["d"],      name: "east" },
        { keys: ["s", "d"], name: "southeast" },
        { keys: ["s"],      name: "south" },
        { keys: ["s", "a"], name: "southwest" },
        { keys: ["a"],      name: "west" },
        { keys: ["w", "a"], name: "northwest" }
    ];

    for (const testCase of inputs) {
        it("faces " + testCase.name + " for WASD keys", function () {
            const player = new Player(50, 50);
            holdKeys(...testCase.keys);
            player.handleInput(200, 200);
            expect(player.direction).toBe(testCase.name);
        });
    }

    it("inherits Entity movement and facing", function () {
        const player = new Player(50, 50);
        expect(player instanceof Entity).toBe(true);
        expect(player.speed).toBe(3);

        holdKeys("w");
        player.handleInput(200, 200);
        expect(player.y).toBeCloseTo(49.25, 8);
        expect(player.direction).toBe("north");
    });

    it("cancels A and D without movement", function () {
        const player = new Player(50, 50);
        holdKeys("a", "d");
        player.handleInput(200, 200);
        expect(player.x).toBe(50);
        expect(player.y).toBe(50);
        expect(player.direction).toBe("south");
    });

    it("cancels W and S without movement", function () {
        const player = new Player(50, 50);
        holdKeys("w", "s");
        player.handleInput(200, 200);
        expect(player.x).toBe(50);
        expect(player.y).toBe(50);
        expect(player.direction).toBe("south");
    });

    it("allows unopposed movement when one pair cancels", function () {
        const player = new Player(50, 50);
        holdKeys("a", "d", "w");
        player.handleInput(200, 200);
        expect(player.direction).toBe("north");
        expect(player.x).toBe(50);
        expect(player.y).toBeCloseTo(49.25, 8);
    });

    it("retains the previous direction when every key cancels", function () {
        const player = new Player(50, 50);
        holdKeys("d");
        player.handleInput(200, 200);
        const previousX = player.x;
        const previousY = player.y;

        holdKeys("w", "s", "a", "d");
        player.handleInput(200, 200);
        // Opposing keys cancel input, but existing velocity slows by friction.
        expect(player.x > previousX).toBe(true);
        expect(player.y).toBe(previousY);
        expect(player.direction).toBe("east");
    });

    it("normalizes diagonal player movement", function () {
        const player = new Player(50, 50);
        holdKeys("w", "d");
        player.handleInput(200, 200);
        // First update accelerates by 0.75 pixels/frame in total.
        expect(Math.hypot(player.x - 50, player.y - 50))
            .toBeCloseTo(0.75, 10);
    });

    it("allows future enemies to reuse Entity movement", function () {
        class Enemy extends Entity {
            chase(targetX, targetY, canvasWidth, canvasHeight) {
                this.move(targetX - this.x, targetY - this.y,
                          canvasWidth, canvasHeight);
            }
        }

        const enemy = new Enemy(50, 50, 32, 2);
        enemy.chase(50, 0, 200, 200);
        expect(enemy.direction).toBe("north");
        expect(enemy.y).toBe(48);
    });
});

describe("Two-frame walking animation", function () {
    it("begins on the standing frame", function () {
        const entity = new Entity(50, 50);
        expect(entity.walkFrame).toBe(0);
        expect(entity.isMoving).toBe(false);
    });

    it("switches to walking frame 1 after eight movement updates", function () {
        const entity = new Entity(50, 50);
        for (let i = 0; i < 7; i++) {
            entity.move(1, 0, 500, 500);
        }
        expect(entity.walkFrame).toBe(0);
        entity.move(1, 0, 500, 500);
        expect(entity.walkFrame).toBe(1);
        expect(entity.isMoving).toBe(true);
    });

    it("alternates back to frame 0 after another eight updates", function () {
        const entity = new Entity(50, 50);
        for (let i = 0; i < 16; i++) entity.move(1, 0, 500, 500);
        expect(entity.walkFrame).toBe(0);
    });

    it("resets to standing when no movement is requested", function () {
        const entity = new Entity(50, 50);
        for (let i = 0; i < 8; i++) entity.move(0, -1, 500, 500);
        expect(entity.walkFrame).toBe(1);
        entity.move(0, 0, 500, 500);
        expect(entity.walkFrame).toBe(0);
        expect(entity.isMoving).toBe(false);
        expect(entity.direction).toBe("north");
    });

    it("stops the animation when pushing against a wall", function () {
        const entity = new Entity(68, 50, 32, 3);
        entity.move(1, 0, 100, 100);
        expect(entity.isMoving).toBe(false);
        expect(entity.walkFrame).toBe(0);
        expect(entity.direction).toBe("east");
    });

    it("stop() freezes the entity without losing its facing direction", function () {
        const entity = new Entity(50, 50);
        for (let i = 0; i < 8; i++) entity.move(1, -1, 500, 500);
        const previousX = entity.x;
        const previousY = entity.y;
        entity.stop();
        expect(entity.x).toBe(previousX);
        expect(entity.y).toBe(previousY);
        expect(entity.direction).toBe("northeast");
        expect(entity.walkFrame).toBe(0);
    });

    it("chooses the two correct image objects for the active direction", function () {
        const standing = { width: 64, height: 64 };
        const walking = { width: 64, height: 64 };
        const entity = new Entity(50, 50, 32, 3, {
            north: [standing, walking]
        });
        entity.move(0, -1, 500, 500);
        expect(entity.getCurrentSprite()).toBe(standing);
        for (let i = 1; i < 8; i++) entity.move(0, -1, 500, 500);
        expect(entity.getCurrentSprite()).toBe(walking);
    });

    it("still supports a single image for entities without animation", function () {
        const image = { width: 16, height: 16 };
        const entity = new Entity(50, 50, 32, 3, { west: image });
        entity.move(-1, 0, 500, 500);
        expect(entity.getCurrentSprite()).toBe(image);
    });

    it("uses the first sprite if only one animation frame is available", function () {
        const first = { width: 16, height: 16 };
        const entity = new Entity(50, 50, 32, 3, { east: [first] });
        for (let i = 0; i < 8; i++) entity.move(1, 0, 500, 500);
        expect(entity.getCurrentSprite()).toBe(first);
    });
});


describe("Sprite sheet frame mapping", function () {
    it("extracts exactly two frames for all eight directions", function () {
        const calls = [];
        const sheet = {
            get: function (x, y, w, h) {
                calls.push([x, y, w, h]);
                return { x: x, y: y, width: w, height: h };
            }
        };
        const sprites = createPlayerSprites(sheet);
        const names = [
            "south", "southeast", "east", "northeast",
            "north", "northwest", "west", "southwest"
        ];
        expect(Object.keys(sprites).length).toBe(8);
        expect(calls.length).toBe(16);

        for (let col = 0; col < names.length; col++) {
            expect(sprites[names[col]].length).toBe(2);
            expect(sprites[names[col]][0].x).toBe(col * 64);
            expect(sprites[names[col]][0].y).toBe(0);
            expect(sprites[names[col]][1].x).toBe(col * 64);
            expect(sprites[names[col]][1].y).toBe(64);
            expect(sprites[names[col]][0].width).toBe(64);
            expect(sprites[names[col]][1].height).toBe(64);
        }
    });
});


describe("Smooth player movement", function () {
    it("begins slower than the maximum speed", function () {
        const player = new Player(100, 100);
        player.moveSmooth(1, 0, 500, 500);
        expect(player.vx).toBeCloseTo(0.75, 10);
        expect(player.x).toBeCloseTo(100.75, 10);
    });

    it("accelerates smoothly and reaches the base speed", function () {
        const player = new Player(100, 100);
        for (let i = 0; i < 8; i++) player.moveSmooth(1, 0, 500, 500);
        expect(player.vx).toBe(3);
        expect(player.vy).toBe(0);
    });

    it("never exceeds the base speed", function () {
        const player = new Player(100, 100);
        for (let i = 0; i < 40; i++) player.moveSmooth(1, 1, 600, 600);
        expect(Math.hypot(player.vx, player.vy)).toBeCloseTo(3, 10);
    });

    it("uses equal diagonal and straight-line acceleration", function () {
        const straight = new Player(100, 100);
        const diagonal = new Player(100, 100);
        straight.moveSmooth(1, 0, 500, 500);
        diagonal.moveSmooth(1, 1, 500, 500);
        expect(Math.hypot(diagonal.vx, diagonal.vy))
            .toBeCloseTo(straight.vx, 10);
    });

    it("applies friction and eventually comes to a complete stop", function () {
        const player = new Player(100, 100);
        for (let i = 0; i < 8; i++) player.moveSmooth(1, 0, 500, 500);
        const beforeRelease = player.x;
        player.moveSmooth(0, 0, 500, 500);
        expect(player.vx).toBeCloseTo(2.25, 10);
        expect(player.x > beforeRelease).toBe(true);
        for (let i = 0; i < 100; i++) player.moveSmooth(0, 0, 500, 500);
        expect(player.vx).toBe(0);
        expect(player.vy).toBe(0);
        expect(player.isMoving).toBe(false);
        expect(player.walkFrame).toBe(0);
    });

    it("keeps its facing direction while coasting", function () {
        const player = new Player(100, 100);
        for (let i = 0; i < 4; i++) player.moveSmooth(-1, -1, 500, 500);
        player.moveSmooth(0, 0, 500, 500);
        expect(player.direction).toBe("northwest");
    });

    it("cancels opposite keys while allowing existing momentum to slow", function () {
        const player = new Player(100, 100);
        player.moveSmooth(1, 0, 500, 500);
        const before = player.x;
        player.moveSmooth(0, 0, 500, 500);
        expect(player.x > before).toBe(true);
        expect(player.vx).toBeCloseTo(0.5625, 10);
    });

    it("takes time to reverse direction", function () {
        const player = new Player(100, 100);
        for (let i = 0; i < 5; i++) player.moveSmooth(1, 0, 500, 500);
        const initialVX = player.vx;
        player.moveSmooth(-1, 0, 500, 500);
        expect(player.vx < initialVX && player.vx > 0).toBe(true);
        for (let i = 0; i < 5; i++) player.moveSmooth(-1, 0, 500, 500);
        expect(player.vx < 0).toBe(true);
        expect(player.direction).toBe("west");
    });

    it("stops horizontal velocity against the right boundary", function () {
        const player = new Player(67, 40);
        player.moveSmooth(1, 0, 100, 100);
        expect(player.x).toBe(67.75);
        player.moveSmooth(1, 0, 100, 100);
        expect(player.x).toBe(68);
        expect(player.vx).toBe(0);
    });

    it("can still move vertically when horizontal motion is blocked", function () {
        const player = new Player(68, 40);
        player.moveSmooth(1, -1, 100, 100);
        expect(player.x).toBe(68);
        expect(player.vx).toBe(0);
        expect(player.y < 40).toBe(true);
    });

    it("respects a small canvas's boundaries", function () {
        const player = new Player(0, 0);
        player.moveSmooth(-1, -1, 20, 20);
        expect(player.x).toBe(0);
        expect(player.y).toBe(0);
        expect(player.vx).toBe(0);
        expect(player.vy).toBe(0);
    });

    it("updates speed and acceleration immediately", function () {
        const player = new Player(100, 100);
        player.speed = 5;
        player.acceleration = 1.5;
        player.moveSmooth(1, 0, 500, 500);
        expect(player.vx).toBeCloseTo(1.5, 10);
        for (let i = 0; i < 10; i++) player.moveSmooth(1, 0, 500, 500);
        expect(player.vx).toBe(5);
    });

    it("changing friction changes the coasting distance", function () {
        const grippy = new Player(100, 100);
        const slippery = new Player(100, 100);
        grippy.friction = 0.75;
        slippery.friction = 0.05;
        grippy.vx = 3;
        slippery.vx = 3;
        grippy.moveSmooth(0, 0, 500, 500);
        slippery.moveSmooth(0, 0, 500, 500);
        expect(grippy.vx < slippery.vx).toBe(true);
    });

    it("uses frame scale to keep acceleration time-based", function () {
        const oneFrame = new Player(100, 100);
        const halfFrames = new Player(100, 100);
        oneFrame.moveSmooth(1, 0, 500, 500, 1);
        halfFrames.moveSmooth(1, 0, 500, 500, 0.5);
        halfFrames.moveSmooth(1, 0, 500, 500, 0.5);
        expect(halfFrames.vx).toBeCloseTo(oneFrame.vx, 10);
    });

    it("clamps unusually large frame time values", function () {
        const player = new Player(100, 100);
        player.moveSmooth(1, 0, 500, 500, 999);
        expect(player.vx).toBeCloseTo(2.25, 10);
        expect(player.x).toBeCloseTo(106.75, 10);
    });

    it("stop clears momentum and freezes the animation", function () {
        const player = new Player(100, 100);
        for (let i = 0; i < 9; i++) player.moveSmooth(1, 0, 500, 500);
        const facing = player.direction;
        const x = player.x;
        player.stop();
        expect(player.vx).toBe(0);
        expect(player.vy).toBe(0);
        expect(player.walkFrame).toBe(0);
        expect(player.direction).toBe(facing);
        player.moveSmooth(0, 0, 500, 500);
        expect(player.x).toBe(x);
    });

    it("can adjust animation frame delay without changing movement", function () {
        const player = new Player(100, 100);
        player.animationDelay = 3;
        for (let i = 0; i < 3; i++) player.moveSmooth(1, 0, 500, 500);
        expect(player.walkFrame).toBe(1);
    });
});

describe("Developer menu settings", function () {
    function mockStorage() {
        const data = {};
        return {
            getItem: key => Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
            setItem: (key, value) => { data[key] = value; }
        };
    }

    function makeMenu(storage = mockStorage()) {
        const player = new Player(100, 100);
        const fontMenu = { getTextSize: () => 18 };
        return { player, storage, developer: new DeveloperMenu(player, fontMenu, storage) };
    }

    it("starts with sensible movement defaults", function () {
        const { player, developer } = makeMenu();
        expect(player.speed).toBe(3);
        expect(player.acceleration).toBe(0.75);
        expect(player.friction).toBe(0.25);
        expect(player.animationDelay).toBe(8);
        expect(developer.isOpen).toBe(false);
    });

    it("uses P-style toggle and W/S/A/D navigation", function () {
        const { player, developer } = makeMenu();
        developer.toggle();
        expect(developer.isOpen).toBe(true);
        developer.handleInput("s"); // select Base Speed
        expect(developer.selectedSetting).toBe(1);
        developer.handleInput("d");
        expect(player.speed).toBe(3.25);
        developer.handleInput("a");
        expect(player.speed).toBe(3);
        developer.toggle();
        expect(developer.isOpen).toBe(false);
    });

    it("makes friction adjustable and persistent", function () {
        const { player, storage, developer } = makeMenu();
        developer.toggle();
        developer.handleInput("d");
        expect(player.friction).toBe(0.3);
        developer.toggle();
        const second = new Player(100, 100);
        new DeveloperMenu(second, { getTextSize: () => 18 }, storage);
        expect(second.friction).toBe(0.3);
    });

    it("adjusts acceleration and animation delay independently", function () {
        const { player, developer } = makeMenu();
        developer.toggle();
        developer.handleInput("s");
        developer.handleInput("s");
        developer.handleInput("d");
        expect(player.acceleration).toBe(0.8);
        developer.handleInput("s");
        developer.handleInput("a");
        expect(player.animationDelay).toBe(7);
        expect(player.speed).toBe(3);
    });

    it("clamps adjustments to allowed bounds", function () {
        const { player, developer } = makeMenu();
        developer.toggle();
        for (let i = 0; i < 100; i++) developer.handleInput("a");
        expect(player.friction).toBe(0.05);
        developer.handleInput("s");
        for (let i = 0; i < 100; i++) developer.handleInput("d");
        expect(player.speed).toBe(8);
    });

    it("ignores invalid values from storage", function () {
        const storage = mockStorage();
        storage.setItem("mageQuestDeveloperSettings", JSON.stringify({
            friction: "oops", speed: 100, acceleration: null, animationDelay: -5
        }));
        const { player } = makeMenu(storage);
        expect(player.friction).toBe(0.25);
        expect(player.speed).toBe(8);
        expect(player.acceleration).toBe(0.75);
        expect(player.animationDelay).toBe(3);
    });

    it("uses a separate storage key from the regular menu", function () {
        const { storage, developer } = makeMenu();
        developer.toggle();
        developer.handleInput("d");
        expect(storage.getItem("mageQuestDeveloperSettings") !== null).toBe(true);
        expect(storage.getItem("mageQuestSettings")).toBe(null);
    });

    it("does not change movement settings when the menu is closed", function () {
        const { player, developer } = makeMenu();
        developer.handleInput("d");
        expect(player.friction).toBe(0.25);
    });
});
