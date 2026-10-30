import sax from 'sax';
import type { DocumentCodec } from '../ports/DocumentCodec.js';
import { Document } from '../domain/Document.js';
import { Shape } from '../domain/Shape.js';
import { Group } from '../domain/Group.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { SvgElement } from './SvgElement.js';
import { Transform } from './Transform.js';
export class SvgCodec implements DocumentCodec {
  constructor(private readonly factory = new ShapeFactory()) {}
  private escape(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;'); }
  encode(document: Document): string {
    const render = (shape: Shape, depth: number): string => {
      const indent = '  '.repeat(depth);
      const attrs = Object.entries(shape.attributes()).map(([key, value]) => key + '="' + this.escape(value) + '"').join(' ');
      if (!shape.children.length && !shape.content) return indent + '<' + shape.kind + ' ' + attrs + '/>';
      return indent + '<' + shape.kind + ' ' + attrs + '>' + this.escape(shape.content) + (shape.children.length ? '\n' + shape.children.map(child => render(child, depth + 1)).join('\n') + '\n' + indent : '') + '</' + shape.kind + '>';
    };
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + document.width + '" height="' + document.height + '" viewBox="0 0 ' + document.width + ' ' + document.height + '">\n' + document.children.map(shape => render(shape, 1)).join('\n') + '\n</svg>\n';
  }
  decode(source: string): { document: Document; warnings: string[] } {
    const root = this.parse(source);
    if (root.name !== 'svg') throw new Error('root element must be svg');
    if (root.attributes.xmlns !== undefined && root.attributes.xmlns !== 'http://www.w3.org/2000/svg') throw new Error('invalid SVG namespace');
    const dimension = (value: string | undefined, fallback: number): number => value === undefined ? fallback : Shape.positive(value.replace(/px$/u, ''), 'canvas dimension');
    const document = new Document(dimension(root.attributes.width, 800), dimension(root.attributes.height, 600));
    for (const key of Object.keys(root.attributes)) if (!['width', 'height', 'viewBox', 'xmlns', 'version'].includes(key)) throw new Error('unsupported svg attribute: ' + key);
    if (root.attributes.viewBox) {
      const box = root.attributes.viewBox.trim().split(/[\s,]+/u).map(Number);
      if (box.length !== 4 || box[0] !== 0 || box[1] !== 0 || box[2] !== document.width || box[3] !== document.height) throw new Error('viewBox must match canvas: 0 0 width height');
    }
    if (root.content.trim()) throw new Error('unexpected text in svg');
    const explicit = new Set<string>();
    for (const element of root.children.flatMap(child => child.all())) {
      const id = element.attributes.id;
      if (id !== undefined) { if (explicit.has(id)) throw new Error('id already exists: ' + id); explicit.add(id); }
    }
    const warnings: string[] = [];
    const counters = new Map<string, number>();
    const build = (element: SvgElement): Shape => {
      let id = element.attributes.id;
      if (id === undefined) {
        let count = counters.get(element.name) ?? 0;
        do { id = element.name + ++count; } while (explicit.has(id));
        counters.set(element.name, count); explicit.add(id);
        warnings.push('warning: assigned id ' + id + ' to unnamed <' + element.name + '>');
      }
      const shape = this.factory.fromAttributes(element.name, id, element.attributes, element.content);
      if (shape instanceof Group) {
        if (element.content.trim()) throw new Error('unexpected text in g');
        for (const child of element.children) shape.insert(build(child));
      } else if (element.children.length || (!shape.acceptsText && element.content.trim())) throw new Error('unexpected content in ' + shape.kind);
      if (element.attributes.transform) new Transform().apply(shape, element.attributes.transform);
      return shape;
    };
    for (const child of root.children) document.add(build(child));
    return { document, warnings };
  }
  private parse(source: string): SvgElement {
    const parser = sax.parser(true, { trim: false, normalize: false });
    const stack: SvgElement[] = []; let root: SvgElement | undefined;
    parser.ondoctype = () => { throw new Error('DOCTYPE is not supported'); };
    parser.onprocessinginstruction = instruction => { if (instruction.name.toLowerCase() !== 'xml') throw new Error('processing instruction is not supported'); };
    parser.onopentag = node => {
      const attrs = Object.fromEntries(Object.entries(node.attributes).map(([key, value]) => [key, String(value)]));
      const element = new SvgElement(node.name, attrs);
      if (stack.length) stack[stack.length - 1].append(element);
      else { if (root) throw new Error('multiple svg roots'); root = element; }
      stack.push(element);
    };
    parser.ontext = text => { if (stack.length) stack[stack.length - 1].appendText(text); };
    parser.oncdata = text => { if (stack.length) stack[stack.length - 1].appendText(text); };
    parser.onclosetag = () => { stack.pop(); };
    parser.onerror = () => { throw new Error('invalid SVG XML'); };
    parser.write(source).close();
    if (!root) throw new Error('empty SVG');
    return root;
  }
}
