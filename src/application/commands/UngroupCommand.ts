import { Command } from '../Command.js';
import { Document } from '../../domain/Document.js';
export class UngroupCommand extends Command {
  constructor(private readonly id: string) { super(); }
  override execute(document: Document): string { document.ungroup(this.id); return 'g#' + this.id + ' ungrouped'; }
}
