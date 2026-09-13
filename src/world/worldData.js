import { REFERENCE_WORLD, createReferenceColumns } from './referenceCoast.js';

const VALID_SURFACES = new Set(['grass', 'sand', 'rock']);

export class BlockWorld {
  constructor({ width, depth, waterLevel = 0.4, maxHeight = 12, columns = new Map() }) {
    this.width = width;
    this.depth = depth;
    this.waterLevel = waterLevel;
    this.maxHeight = maxHeight;
    this.columns = columns;
  }

  static fromReference() {
    return new BlockWorld({ ...REFERENCE_WORLD, columns: createReferenceColumns() });
  }

  key(x, z) {
    return String(x) + ',' + String(z);
  }

  inBounds(x, z) {
    return x >= 0 && z >= 0 && x < this.width && z < this.depth;
  }

  get(x, z) {
    return this.columns.get(this.key(x, z)) || null;
  }

  set(x, z, height, surface = 'grass') {
    x = Math.round(x);
    z = Math.round(z);
    if (!this.inBounds(x, z)) return false;

    const h = Math.max(0, Math.min(this.maxHeight, Math.round(height)));
    if (h <= 0) {
      this.columns.delete(this.key(x, z));
      return true;
    }

    const safeSurface = VALID_SURFACES.has(surface) ? surface : 'grass';
    this.columns.set(this.key(x, z), { x, z, height: h, surface: safeSurface });
    return true;
  }

  cloneColumn(x, z) {
    const item = this.get(x, z);
    return item ? { ...item } : null;
  }

  restoreColumn(x, z, snapshot) {
    if (!snapshot) this.columns.delete(this.key(x, z));
    else this.columns.set(this.key(x, z), { ...snapshot });
  }
}
