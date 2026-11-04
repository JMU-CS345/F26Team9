// Player object used throughout the game.
let player;

/**
 * Initializes the game canvas and player.
 * Called once when the program starts.
 */
function setup() {
    // Create the game canvas.
    createCanvas(800, 600);

    // Create the player near the center of the screen.
    player = new Player(400, 300);
}

/**
 * Main game loop.
 * Updates player movement and redraws the screen each frame.
 */
function draw() {
    // Clear the previous frame.
    background(220);

    // Check keyboard input and move the player.
    player.handleInput(width, height);

    // Draw the player at its current position.
    player.display();
}
