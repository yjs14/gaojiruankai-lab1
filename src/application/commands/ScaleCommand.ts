import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class ScaleCommand extends Command {
  constructor(private readonly id: string, private readonly factor: number) { super(); }
  override execute(document: Document): string { const shape = document.find(this.id); shape.scale(this.factor); return shape.kind + '#' + this.id + ' scaled by ' + this.factor; }
}
