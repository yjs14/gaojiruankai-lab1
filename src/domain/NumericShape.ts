import { Shape } from './Shape.js';
export abstract class NumericShape extends Shape {
  private readonly values: Record<string, number> = {};
  protected constructor(id: string, values: Record<string, number>, private readonly pairs: readonly (readonly [string, string])[], private readonly sizes: readonly string[] = []) {
    super(id);
    for (const [key, value] of Object.entries(values)) this.values[key] = sizes.includes(key) ? Shape.nonnegative(value, key) : Shape.number(value, key);
  }
  protected value(key: string): number { return this.values[key]; }
  protected override geometry(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.values).map(([key, value]) => [key, String(value)]));
  }
  protected override setGeometry(name: string, value: string): boolean {
    if (!Object.hasOwn(this.values, name)) return false;
    this.values[name] = this.sizes.includes(name) ? Shape.nonnegative(value, name) : Shape.number(value, name);
    return true;
  }
  override move(dx: number, dy: number): void {
    Shape.number(dx, 'dx'); Shape.number(dy, 'dy');
    const next = { ...this.values };
    for (const [x, y] of this.pairs) { next[x] = Shape.number(next[x] + dx, x); next[y] = Shape.number(next[y] + dy, y); }
    Object.assign(this.values, next);
  }
  override scale(factor: number): void {
    Shape.positive(factor, 'scale factor');
    const next = Object.fromEntries(Object.entries(this.values).map(([key, value]) => [key, Shape.number(value * factor, key)]));
    Object.assign(this.values, next);
  }
  override details(): string {
    return Object.entries(this.geometry()).map(([key, value]) => key + '=' + value).join(' ') + (this.styleDetails() ? ' ' + this.styleDetails() : '');
  }
}
