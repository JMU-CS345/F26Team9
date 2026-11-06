class Tile {
	constructor(x, y, size, color = 230) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.color = color;
		this.image = null;
	}

	loadImage(path) {
		loadImage(path, (loadedImage) => {
			this.image = loadedImage;
		});
	}

	setImage(image) {
		this.image = image;
	}

	draw() {
		if (this.image) {
			image(this.image, this.x, this.y, this.size, this.size);
		} else {
			fill(this.color);
			rect(this.x, this.y, this.size, this.size);
		}

		noFill();
		stroke(100);
		strokeWeight(1);
		rect(this.x, this.y, this.size, this.size);
	}
}

class TileGrid {
	constructor(cols, rows, tileSize, tileColors = []) {
		this.cols = cols;
		this.rows = rows;
		this.tileSize = tileSize;
		this.tiles = Array.from({ length: rows }, (_, row) =>
			Array.from({ length: cols }, (_, col) =>
				new Tile(col * tileSize, row * tileSize, tileSize, tileColors[row]?.[col] ?? 230)
			)
		);
	}

	draw() {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				this.tiles[row][col].draw();
			}
		}
	}
}
