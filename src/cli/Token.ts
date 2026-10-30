export class Token {
  constructor(private readonly text: string, private readonly wasQuoted: boolean) {}
  get value(): string { return this.text; }
  get quoted(): boolean { return this.wasQuoted; }
}
