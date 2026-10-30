export class SvgElement {
  private readonly nested: SvgElement[] = [];
  private text = '';
  constructor(private readonly tag: string, private readonly attrs: Readonly<Record<string, string>>) {}
  get name(): string { return this.tag; }
  get attributes(): Readonly<Record<string, string>> { return this.attrs; }
  get children(): readonly SvgElement[] { return [...this.nested]; }
  get content(): string { return this.text; }
  append(child: SvgElement): void { this.nested.push(child); }
  appendText(value: string): void { this.text += value; }
  all(): SvgElement[] { return [this, ...this.nested.flatMap(child => child.all())]; }
}
