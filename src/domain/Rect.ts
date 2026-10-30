import { NumericShape } from './NumericShape.js';
export class Rect extends NumericShape {
  override get kind(): string { return 'rect'; }
  constructor(id: string, x: number, y: number, width: number, height: number) { super(id, { x, y, width, height }, [["x","y"]], ["width","height"]); }
  override clone(): Rect { const copy = new Rect(this.id, this.value('x'), this.value('y'), this.value('width'), this.value('height')); this.copyStyles(copy); return copy; }
}
