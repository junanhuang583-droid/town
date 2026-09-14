import { REFERENCE_WORLD, createReferenceColumns } from './referenceCoast.js';

const VALID_BLOCK_TYPES = new Set(['grass', 'sand', 'rock']);
export const DEFAULT_MIN_Y = -6;

export class BlockWorld {
  constructor({
    width,
    depth,
    waterLevel = 0.4,
    maxHeight = 12,
    minY = DEFAULT_MIN_Y,
    blocks = new Map(),
    columns = new Map()
  }) {
    this.width = width;
    this.depth = depth;
    this.waterLevel = waterLevel;
    this.maxHeight = maxHeight;
    this.minY = minY;

    // Authoritative world data: one entry per real x/y/z voxel.
    this.blocks = blocks;

    // Derived top-of-column cache kept for editing and compatibility.
    this.columns = columns;
  }

  static fromReference() {
    const world = new BlockWorld({ ...REFERENCE_WORLD, minY: DEFAULT_MIN_Y });
    world.loadColumns(createReferenceColumns());
    return world;
  }

  columnKey(x, z) {
    return String(x) + ',' + String(z);
  }

  blockKey(x, y, z) {
    return String(x) + ',' + String(y) + ',' + String(z);
  }

  inBounds(x, z) {
    return x >= 0 && z >= 0 && x < this.width && z < this.depth;
  }

  inVerticalBounds(y) {
    return y >= this.minY && y <= this.maxHeight;
  }

  getBlock(x, y, z) {
    return this.blocks.get(this.blockKey(x, y, z)) || null;
  }

  hasBlock(x, y, z) {
    return this.blocks.has(this.blockKey(x, y, z));
  }

  setBlock(x, y, z, type = 'rock') {
    x = Math.round(x);
    y = Math.round(y);
    z = Math.round(z);
    if (!this.inBounds(x, z) || !this.inVerticalBounds(y)) return false;

    const safeType = VALID_BLOCK_TYPES.has(type) ? type : 'rock';
    this.blocks.set(this.blockKey(x, y, z), { x, y, z, type: safeType });
    return true;
  }

  deleteBlock(x, y, z) {
    this.blocks.delete(this.blockKey(x, y, z));
  }

  clearColumn(x, z) {
    const current = this.get(x, z);
    if (current) {
      for (let y = this.minY; y <= current.height; y++) {
        this.deleteBlock(x, y, z);
      }
    } else {
      for (let y = this.minY; y <= this.maxHeight; y++) {
        this.deleteBlock(x, y, z);
      }
    }
    this.columns.delete(this.columnKey(x, z));
  }

  loadColumns(sourceColumns) {
    this.blocks.clear();
    this.columns.clear();

    for (const column of sourceColumns.values()) {
      this.set(column.x, column.z, column.height, column.surface);
    }
  }

  rebuildColumnIndex() {
    this.columns.clear();

    for (const block of this.blocks.values()) {
      const key = this.columnKey(block.x, block.z);
      const current = this.columns.get(key);
      if (!current || block.y > current.height) {
        this.columns.set(key, {
          x: block.x,
          z: block.z,
          height: block.y,
          surface: block.type
        });
      }
    }
  }

  get(x, z) {
    return this.columns.get(this.columnKey(x, z)) || null;
  }

  set(x, z, height, surface = 'grass') {
    x = Math.round(x);
    z = Math.round(z);
    if (!this.inBounds(x, z)) return false;

    const h = Math.max(this.minY - 1, Math.min(this.maxHeight, Math.round(height)));
    const safeSurface = VALID_BLOCK_TYPES.has(surface) ? surface : 'grass';

    this.clearColumn(x, z);
    if (h < this.minY) return true;

    // Real solid voxel column: every coordinate from foundation to surface exists.
    for (let y = this.minY; y <= h; y++) {
      this.setBlock(x, y, z, y === h ? safeSurface : 'rock');
    }

    this.columns.set(this.columnKey(x, z), {
      x,
      z,
      height: h,
      surface: safeSurface
    });
    return true;
  }

  cloneColumn(x, z) {
    const item = this.get(x, z);
    return item ? { ...item } : null;
  }

  restoreColumn(x, z, snapshot) {
    if (!snapshot) this.clearColumn(x, z);
    else this.set(snapshot.x, snapshot.z, snapshot.height, snapshot.surface);
  }
}
