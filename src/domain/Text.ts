import { NumericShape } from './NumericShape.js';
export class Text extends NumericShape {
  override get kind(): string { return 'text'; }
  constructor(id: string, x: number, y: number, private text: string) { super(id, { x, y }, [['x', 'y']]); }
  override get acceptsText(): boolean { return true; }
  override get content(): string { return this.text; }
  protected override setGeometry(name: string, value: string): boolean {
    if (name === 'text') { this.text = value; return true; }
    return super.setGeometry(name, value);
  }
  override details(): string { return super.details() + ' ' + JSON.stringify(this.text); }
  override clone(): Text { const copy = new Text(this.id, this.value('x'), this.value('y'), this.text); this.copyStyles(copy); return copy; }
}
