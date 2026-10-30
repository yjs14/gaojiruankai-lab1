import { Editor } from '../application/Editor.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Shape } from '../domain/Shape.js';
import { Token } from './Token.js';
import { Tokenizer } from './Tokenizer.js';
import { TreePrinter } from './TreePrinter.js';
import { CreateCommand } from '../application/commands/CreateCommand.js';
import { DeleteCommand } from '../application/commands/DeleteCommand.js';
import { MoveCommand } from '../application/commands/MoveCommand.js';
import { ScaleCommand } from '../application/commands/ScaleCommand.js';
import { SetCommand } from '../application/commands/SetCommand.js';
import { GroupCommand } from '../application/commands/GroupCommand.js';
import { UngroupCommand } from '../application/commands/UngroupCommand.js';
import { AddToCommand } from '../application/commands/AddToCommand.js';
import { OrderCommand } from '../application/commands/OrderCommand.js';
interface Route { readonly syntax: string; readonly handle: (args: Token[]) => string | Promise<string>; }
/** Phase 1 command-name dispatch point; registration may move to providers later. */
export class CommandRouter {
  private readonly routes = new Map<string, Route>();
  private readonly tokenizer = new Tokenizer();
  private readonly printer = new TreePrinter();
  constructor(private readonly editor: Editor, private readonly factory = new ShapeFactory()) {
    this.register('init', 'init [w] [h]', a => { this.arity(a, [0, 1, 2]); return editor.init(a[0] ? this.number(a[0]) : 800, a[1] ? this.number(a[1]) : 600); });
    this.register('read', 'read <file.svg>', a => { this.arity(a, [1]); return editor.read(a[0].value); });
    this.register('save', 'save [file.svg]', a => { this.arity(a, [0, 1]); return editor.save(a[0]?.value); });
    this.register('canvas', 'canvas [w] [h]', a => { this.arity(a, [0, 2]); return editor.canvas(a[0] ? this.number(a[0]) : undefined, a[1] ? this.number(a[1]) : undefined); });
    this.register('create', 'create <type> <id> [params...] [in <containerId>]', a => this.create(a));
    this.register('delete', 'delete <id>', a => { this.arity(a, [1]); return editor.execute(new DeleteCommand(a[0].value)); });
    this.register('move', 'move <id> <dx> <dy>', a => { this.arity(a, [3]); return editor.execute(new MoveCommand(a[0].value, this.number(a[1]), this.number(a[2]))); });
    this.register('scale', 'scale <id> <factor>', a => { this.arity(a, [2]); return editor.execute(new ScaleCommand(a[0].value, this.number(a[1]))); });
    this.register('set', 'set <id> <attr> <value>', a => { this.arity(a, [3]); return editor.execute(new SetCommand(a[0].value, a[1].value, a[2].value)); });
    this.register('group', 'group <newGid> <id1> [id2...]', a => { if (a.length < 2) throw new Error('group needs an id and at least one member'); return editor.execute(new GroupCommand(a[0].value, a.slice(1).map(t => t.value))); });
    this.register('ungroup', 'ungroup <gid>', a => { this.arity(a, [1]); return editor.execute(new UngroupCommand(a[0].value)); });
    this.register('addto', 'addto <gid> <id>', a => { this.arity(a, [2]); return editor.execute(new AddToCommand(a[0].value, a[1].value)); });
    this.register('front', 'front <id>', a => { this.arity(a, [1]); return editor.execute(new OrderCommand(a[0].value, true)); });
    this.register('back', 'back <id>', a => { this.arity(a, [1]); return editor.execute(new OrderCommand(a[0].value, false)); });
    this.register('tree', 'tree [id]', a => { this.arity(a, [0, 1]); return this.printer.tree(editor.document, a[0]?.value); });
    this.register('show', 'show <id>', a => { this.arity(a, [1]); return this.printer.show(editor.document, a[0].value); });
    this.register('undo', 'undo', a => { this.arity(a, [0]); return editor.undo(); });
    this.register('redo', 'redo', a => { this.arity(a, [0]); return editor.redo(); });
    this.register('help', 'help', a => { this.arity(a, [0]); return [...this.routes.values()].map(route => route.syntax).join('\n') + '\nTypes: rect x y w h [fill]; circle cx cy r [fill]; ellipse cx cy rx ry [fill]; line x1 y1 x2 y2 [stroke]; text x y "content"; g'; });
  }
  private register(name: string, syntax: string, handle: Route['handle']): void { this.routes.set(name, { syntax, handle }); }
  private arity(args: readonly Token[], allowed: readonly number[]): void { if (!allowed.includes(args.length)) throw new Error('invalid number of arguments'); }
  private number(token: Token): number { return Shape.number(token.value, 'argument'); }
  private create(args: Token[]): string {
    void this.editor.document;
    if (args.length < 2) throw new Error('create needs a type and an id');
    let parent: string | undefined;
    if (args.length >= 4 && args[args.length - 2].value === 'in' && !args[args.length - 2].quoted) {
      parent = args[args.length - 1].value; args = args.slice(0, -2);
    }
    const shape = this.factory.create(args[0].value, args[1].value, args.slice(2).map(t => t.value));
    return this.editor.execute(new CreateCommand(shape, parent));
  }
  async run(line: string): Promise<string> {
    try {
      const tokens = this.tokenizer.tokenize(line);
      if (!tokens.length) return '';
      const route = this.routes.get(tokens[0].value);
      if (!route) throw new Error('unknown command: ' + tokens[0].value);
      return await route.handle(tokens.slice(1));
    } catch (error) { return 'error: ' + (error instanceof Error ? error.message : String(error)).replace(/[\r\n]+/gu, ' '); }
  }
}
