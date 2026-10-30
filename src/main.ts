import { Editor } from './application/Editor.js';
import { NodeFileStore } from './infrastructure/NodeFileStore.js';
import { SvgCodec } from './infrastructure/SvgCodec.js';
import { CommandRouter } from './cli/CommandRouter.js';
import { Repl } from './cli/Repl.js';
await new Repl(new CommandRouter(new Editor(new NodeFileStore(), new SvgCodec()))).start();
