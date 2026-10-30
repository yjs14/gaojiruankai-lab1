import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class OrderCommand extends Command {
  constructor(private readonly id: string, private readonly front: boolean) { super(); }
  override execute(document: Document): string { const shape = document.find(this.id); document.order(this.id, this.front); return shape.kind + '#' + this.id + ' sent to ' + (this.front ? 'front' : 'back'); }
}
