import { Shape } from './Shape.js';
export class Group extends Shape {
  private readonly items: Shape[] = [];
  constructor(id: string) { super(id); }
  override get kind(): string { return 'g'; }
  override get isContainer(): boolean { return true; }
  override get children(): readonly Shape[] { return [...this.items]; }
  insert(shape: Shape, index = this.items.length): void {
    if (shape === this || this.contains(shape, this)) throw new Error('cannot create a cycle: ' + shape.id);
    this.items.splice(index, 0, shape);
  }
  private contains(root: Shape, target: Shape): boolean { return root.children.some(child => child === target || this.contains(child, target)); }
  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index < 0) throw new Error('shape is not a child: ' + shape.id);
    this.items.splice(index, 1); return index;
  }
  override move(dx: number, dy: number): void { for (const child of this.items) child.move(dx, dy); }
  override scale(factor: number): void { Shape.positive(factor, 'scale factor'); for (const child of this.items) child.scale(factor); }
  protected override geometry(): Record<string, string> { return {}; }
  protected override setGeometry(_name: string, _value: string): boolean { return false; }
  override details(): string { return this.styleDetails(); }
  override clone(): Group { const copy = new Group(this.id); this.copyStyles(copy); for (const child of this.items) copy.insert(child.clone()); return copy; }
}
