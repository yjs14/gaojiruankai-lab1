import { Editor } from '../src/application/Editor.js';
import { SvgCodec } from '../src/infrastructure/SvgCodec.js';
import { CommandRouter } from '../src/cli/CommandRouter.js';
import { MemoryFileStore } from './MemoryFileStore.js';
export class Fixture {
  readonly files = new MemoryFileStore();
  readonly codec = new SvgCodec();
  readonly editor = new Editor(this.files, this.codec);
  readonly router = new CommandRouter(this.editor);
  run(line: string): Promise<string> { return this.router.run(line); }
  async setup(...lines: string[]): Promise<void> { for (const line of ['init', ...lines]) { const result = await this.run(line); if (result.startsWith('error:')) throw new Error(result); } }
  snapshot(): string { return this.codec.encode(this.editor.document); }
}
