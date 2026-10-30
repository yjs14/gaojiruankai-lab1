import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
import { Shape } from '../../domain/Shape.js';
export class CreateCommand extends Command {
  constructor(private readonly shape: Shape, private readonly parent?: string) { super(); }
  override execute(document: Document): string { document.add(this.shape.clone(), this.parent); return this.shape.kind + '#' + this.shape.id + ' created' + (this.parent === undefined ? '' : ' in g#' + this.parent); }
}
