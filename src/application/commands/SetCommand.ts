import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class SetCommand extends Command {
  constructor(private readonly id: string, private readonly attribute: string, private readonly value: string) { super(); }
  override execute(document: Document): string { const shape = document.find(this.id); shape.setAttribute(this.attribute, this.value); return shape.kind + '#' + this.id + ' updated: ' + this.attribute + '=' + JSON.stringify(this.value); }
}
