import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { FileStore } from '../ports/FileStore.js';
export class NodeFileStore implements FileStore {
  async read(path: string): Promise<string> { try { return await readFile(path, 'utf8'); } catch { throw new Error('cannot read file: ' + path); } }
  async write(path: string, content: string): Promise<void> {
    const temporary = join(dirname(path), '.svg-' + randomUUID() + '.tmp');
    try { await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' }); await rename(temporary, path); }
    catch { throw new Error('cannot write file: ' + path); }
    finally { await unlink(temporary).catch(() => undefined); }
  }
}
