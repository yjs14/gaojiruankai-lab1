import { Document } from '../domain/Document.js';
import type { DocumentCodec } from '../ports/DocumentCodec.js';
import type { FileStore } from '../ports/FileStore.js';
import { Command } from './Command.js';
import { History } from './History.js';
export class Editor {
  private current?: Document;
  private path?: string;
  private readonly history = new History();
  constructor(private readonly files: FileStore, private readonly codec: DocumentCodec) {}
  get document(): Document { if (!this.current) throw new Error("no document. use 'init' or 'read' first"); return this.current; }
  init(width = 800, height = 600): string { const next = new Document(width, height); this.current = next; this.path = undefined; this.history.barrier(); return 'canvas ' + width + 'x' + height + ' created'; }
  async read(path: string): Promise<string> {
    const result = this.codec.decode(await this.files.read(path));
    this.current = result.document; this.path = path; this.history.barrier();
    return [...result.warnings, 'read ' + path + ' (' + result.document.all().length + ' elements)'].join('\n');
  }
  async save(path?: string): Promise<string> {
    const document = this.document; const target = path ?? this.path;
    if (!target) throw new Error('no file path. use save <file.svg>');
    await this.files.write(target, this.codec.encode(document));
    this.path = target; this.history.barrier(); return 'saved to ' + target + ' (' + document.all().length + ' elements)';
  }
  canvas(width?: number, height?: number): string {
    const document = this.document;
    if (width !== undefined && height !== undefined) { const candidate = document.clone(); candidate.resize(width, height); this.current = candidate; this.history.barrier(); }
    return 'canvas ' + this.document.width + 'x' + this.document.height;
  }
  execute(command: Command): string { const result = this.history.edit(this.document, command); this.current = result.document; return result.message; }
  undo(): string { void this.document; const result = this.history.undo(); this.current = result.document; return result.message; }
  redo(): string { void this.document; const result = this.history.redo(); this.current = result.document; return result.message; }
}
