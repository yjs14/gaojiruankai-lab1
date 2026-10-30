import { createInterface } from 'node:readline';
import { CommandRouter } from './CommandRouter.js';
export class Repl {
  constructor(private readonly router: CommandRouter) {}
  async start(): Promise<void> {
    const terminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const input = createInterface({ input: process.stdin, output: process.stdout, terminal, crlfDelay: Infinity });
    console.log("svg-editor 0.1 — type 'help' for commands");
    const prompt = (): void => { if (terminal) { input.setPrompt('svg> '); input.prompt(); } };
    prompt();
    for await (const line of input) { const output = await this.router.run(line); if (output) console.log(output); prompt(); }
  }
}
