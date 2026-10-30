import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class MoveCommand extends Command {
  constructor(private readonly id: string, private readonly dx: number, private readonly dy: number) { super(); }
  override execute(document: Document): string { const shape = document.find(this.id); shape.move(this.dx, this.dy); return shape.kind + '#' + this.id + ' moved by (' + this.dx + ',' + this.dy + ')'; }
}
