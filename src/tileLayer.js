/**
 * One layer of a tile map: a grid of numbers, one per tile.
 * Model only: stores values and has no drawing code.
 */
export class TileLayer {
    /**
     * @param {number} cols - Number of tile columns.
     * @param {number} rows - Number of tile rows.
     * @param {number} fill - Value for every tile at the start, and for tiles outside the grid.
     */
    constructor(cols, rows, fill = 0) {
        this.cols = cols;
        this.rows = rows;
        this.fill = fill;
        this.cells = new Array(cols * rows).fill(fill);
    }

    /**
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {boolean} True if the position is inside the grid.
     */
    inBounds(col, row) {
        return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
    }

    /**
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @returns {number} The tile's value, or the fill value outside the grid.
     */
    get(col, row) {
        return this.inBounds(col, row) ? this.cells[row * this.cols + col] : this.fill;
    }

    /**
     * Sets a tile's value. Positions outside the grid are ignored.
     * @param {number} col - Tile column.
     * @param {number} row - Tile row.
     * @param {number} value - New value.
     */
    set(col, row, value) {
        if (this.inBounds(col, row)) this.cells[row * this.cols + col] = value;
    }
}
