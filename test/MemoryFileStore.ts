import type { FileStore } from '../src/ports/FileStore.js';
export class MemoryFileStore implements FileStore {
  readonly files = new Map<string, string>();
  failWrite = false;
  async read(path: string): Promise<string> { const data = this.files.get(path); if (data === undefined) throw new Error('cannot read file: ' + path); return data; }
  async write(path: string, content: string): Promise<void> { if (this.failWrite) throw new Error('cannot write file: ' + path); this.files.set(path, content); }
}
