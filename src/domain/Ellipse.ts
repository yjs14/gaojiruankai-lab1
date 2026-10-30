import { NumericShape } from './NumericShape.js';
export class Ellipse extends NumericShape {
  override get kind(): string { return 'ellipse'; }
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) { super(id, { cx, cy, rx, ry }, [["cx","cy"]], ["rx","ry"]); }
  override clone(): Ellipse { const copy = new Ellipse(this.id, this.value('cx'), this.value('cy'), this.value('rx'), this.value('ry')); this.copyStyles(copy); return copy; }
}
