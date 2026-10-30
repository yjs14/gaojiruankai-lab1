import { Document } from '../domain/Document.js';
import { Command } from './Command.js';
export class EditRecord {
  private before?: Document;
  private after?: Document;
  private result = '';
  constructor(private readonly command: Command) {}
  execute(document: Document): { document: Document; message: string } {
    this.before = document.clone();
    const candidate = document.clone();
    this.result = this.command.execute(candidate);
    this.after = candidate.clone();
    return { document: candidate, message: this.result };
  }
  undo(): Document { if (!this.before) throw new Error('command has not executed'); return this.before.clone(); }
  redo(): Document { if (!this.after) throw new Error('command has not executed'); return this.after.clone(); }
  get message(): string { return this.result; }
}
