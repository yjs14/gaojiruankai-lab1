export abstract class Shape {
  private readonly styles = new Map<string, string>();
  protected constructor(private readonly shapeId: string) {
    if (!shapeId || /[\s<>"'&]/u.test(shapeId)) throw new Error('invalid id: ' + shapeId);
  }
  get id(): string { return this.shapeId; }
  abstract get kind(): string;
  get children(): readonly Shape[] { return []; }
  get isContainer(): boolean { return false; }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  protected abstract geometry(): Record<string, string>;
  protected abstract setGeometry(name: string, value: string): boolean;
  abstract details(): string;
  attributes(): Readonly<Record<string, string>> {
    return { id: this.id, ...this.geometry(), ...Object.fromEntries(this.styles) };
  }
  setAttribute(name: string, value: string): void {
    if (['fill', 'stroke', 'stroke-width'].includes(name)) {
      if (name === 'stroke-width') Shape.nonnegative(value, name);
      this.styles.set(name, value); return;
    }
    if (!this.setGeometry(name, value)) throw new Error('unknown attribute: ' + name);
  }
  protected copyStyles(target: Shape): void {
    for (const [key, value] of this.styles) target.styles.set(key, value);
  }
  protected styleDetails(): string {
    return [...this.styles].map(([key, value]) => key + '=' + value).join(' ');
  }
  get content(): string { return ''; }
  static number(value: string | number, name: string): number {
    if (String(value).trim() === '' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/u.test(String(value))) throw new Error('invalid number for ' + name);
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error('invalid number for ' + name);
    return n;
  }
  static nonnegative(value: string | number, name: string): number {
    const n = Shape.number(value, name);
    if (n < 0) throw new Error(name + ' must be non-negative');
    return n;
  }
  static positive(value: string | number, name: string): number {
    const n = Shape.number(value, name);
    if (n <= 0) throw new Error(name === 'scale factor' ? 'scale factor must be positive' : name + ' must be positive');
    return n;
  }
}
