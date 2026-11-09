/** Cuts eight directions and two walking frames from the player sheet. */
const SPRITE_SIZE = 64;
const PLAYER_DIRECTIONS = [
    "south", "southeast", "east", "northeast",
    "north", "northwest", "west", "southwest"
];

/**
 * @param {p5.Image} sheet - The existing 512 x 128 player sprite sheet.
 * @returns {Object} Direction names mapped to two animation frames each.
 */
export function createPlayerSprites(sheet) {
    const sprites = {};
    // Entity displays a placeholder if its sprite sheet failed to load.
    if (!sheet || typeof sheet.get !== "function") return sprites;

    for (let column = 0; column < PLAYER_DIRECTIONS.length; column++) {
        sprites[PLAYER_DIRECTIONS[column]] = [
            sheet.get(column * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE),
            sheet.get(column * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE)
        ];
    }
    return sprites;
}

/**
 * Cuts the separate four-frame idle animation into directional frames.
 * The first frame of each direction matches the existing standing pose.
 * @param {p5.Image} sheet - The 512 x 256 idle sprite sheet.
 * @returns {Object} Direction names mapped to four idle frames each.
 */
export function createPlayerIdleSprites(sheet) {
    const sprites = {};
    if (!sheet || typeof sheet.get !== "function") return sprites;

    for (let column = 0; column < PLAYER_DIRECTIONS.length; column++) {
        const direction = PLAYER_DIRECTIONS[column];
        sprites[direction] = [];
        for (let frame = 0; frame < 4; frame++) {
            sprites[direction].push(
                sheet.get(column * SPRITE_SIZE, frame * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE)
            );
        }
    }
    return sprites;
}
