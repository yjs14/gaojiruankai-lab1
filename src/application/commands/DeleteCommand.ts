import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class DeleteCommand extends Command {
  constructor(private readonly id: string) { super(); }
  override execute(document: Document): string { const shape = document.find(this.id); document.delete(this.id); return shape.kind + '#' + this.id + ' deleted'; }
}
