import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class AddToCommand extends Command {
  constructor(private readonly gid: string, private readonly id: string) { super(); }
  override execute(document: Document): string { const shape = document.find(this.id); document.addTo(this.gid, this.id); return shape.kind + '#' + this.id + ' added to g#' + this.gid; }
}
