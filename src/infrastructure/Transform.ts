import { Shape } from '../domain/Shape.js';
/** Only translate and uniform scale are representable by this phase's geometric model. */
export class Transform {
  apply(shape: Shape, source: string): void {
    const operations = [...source.matchAll(/(translate|scale)\s*\(([^)]*)\)/gu)];
    if (source.replace(/(translate|scale)\s*\([^)]*\)/gu, '').trim()) throw new Error('unsupported transform: ' + source);
    for (const operation of operations.reverse()) {
      const args = operation[2].trim().split(/[\s,]+/u).map(value => Shape.number(value, 'transform'));
      if (args.length < 1 || args.length > 2) throw new Error('invalid transform: ' + source);
      if (operation[1] === 'translate') shape.move(args[0], args[1] ?? 0);
      else { if (args[1] !== undefined && args[0] !== args[1]) throw new Error('non-uniform scale is not supported'); shape.scale(args[0]); }
    }
  }
}
