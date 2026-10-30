import { Document } from '../domain/Document.js';
import { Command } from './Command.js';
import { EditRecord } from './EditRecord.js';
export class History {
  private past: EditRecord[] = [];
  private future: EditRecord[] = [];
  private ioBarrier = false;
  edit(document: Document, command: Command): { document: Document; message: string } {
    const entry = new EditRecord(command);
    const result = entry.execute(document);
    this.past.push(entry); this.future = []; this.ioBarrier = false;
    return result;
  }
  barrier(): void { this.past = []; this.future = []; this.ioBarrier = true; }
  undo(): { document: Document; message: string } {
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
    const entry = this.past.pop(); if (!entry) throw new Error('nothing to undo');
    this.future.push(entry); return { document: entry.undo(), message: 'undone: ' + entry.message };
  }
  redo(): { document: Document; message: string } {
    if (this.ioBarrier) throw new Error('undo not allowed after io command');
    const entry = this.future.pop(); if (!entry) throw new Error('nothing to redo');
    this.past.push(entry); return { document: entry.redo(), message: 'redone: ' + entry.message };
  }
}
