function setup() {
  createCanvas(400, 400);
}

class TileGrid {
	constructor(cols, rows, tileSize, tileColors = []) {
		this.cols = cols;
		this.rows = rows;
		this.tileSize = tileSize;
		this.tileColors = tileColors;
	}

	draw() {
		stroke(100);
		strokeWeight(1);
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				fill(this.tileColors[row]?.[col] ?? 230);
				rect(col * this.tileSize, row * this.tileSize, this.tileSize, this.tileSize);
			}
		}
	}
}

function draw() {
  background(220);
  const tileSize = 30;
  let tileGrid = new TileGrid(Math.ceil(width / tileSize), Math.ceil(height / tileSize), tileSize);
  tileGrid.draw();
}
