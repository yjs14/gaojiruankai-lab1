import { Document } from '../domain/Document.js';
import { Shape } from '../domain/Shape.js';
export class TreePrinter {
  tree(document: Document, id?: string): string {
    const lines: string[] = [];
    const label = (shape: Shape): string => shape.kind + '#' + shape.id + (shape.details() ? '  ' + shape.details() : '');
    const children = (shapes: readonly Shape[], prefix: string): void => {
      for (const [index, shape] of shapes.entries()) {
        const last = index === shapes.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + label(shape));
        children(shape.children, prefix + (last ? '    ' : '│   '));
      }
    };
    if (id === undefined) { lines.push('svg (' + document.width + 'x' + document.height + ')'); children(document.children, ''); }
    else { const shape = document.find(id); lines.push(label(shape)); children(shape.children, ''); }
    return lines.join('\n');
  }
  show(document: Document, id: string): string {
    const shape = document.find(id);
    const attrs = Object.entries(shape.attributes()).filter(([name]) => name !== 'id').map(([name, value]) => '  ' + name + '=' + value);
    if (shape.acceptsText) attrs.push('  text=' + JSON.stringify(shape.content));
    return [shape.kind + '#' + id + '  parent=' + document.parentLabel(id), ...attrs].join('\n');
  }
}
