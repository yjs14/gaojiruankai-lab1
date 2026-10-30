import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
interface Definition {
  readonly fields: readonly string[];
  readonly style?: string;
  readonly build: (id: string, args: readonly string[]) => Shape;
}
/** Phase 1 type-name dispatch point; replace with providers in the plugin phase. */
export class ShapeFactory {
  private readonly definitions = new Map<string, Definition>([
    ['rect', { fields: ['x', 'y', 'width', 'height'], style: 'fill', build: (id, a) => new Rect(id, ...this.numbers(a, 4) as [number, number, number, number]) }],
    ['circle', { fields: ['cx', 'cy', 'r'], style: 'fill', build: (id, a) => new Circle(id, ...this.numbers(a, 3) as [number, number, number]) }],
    ['ellipse', { fields: ['cx', 'cy', 'rx', 'ry'], style: 'fill', build: (id, a) => new Ellipse(id, ...this.numbers(a, 4) as [number, number, number, number]) }],
    ['line', { fields: ['x1', 'y1', 'x2', 'y2'], style: 'stroke', build: (id, a) => new Line(id, ...this.numbers(a, 4) as [number, number, number, number]) }],
    ['text', { fields: ['x', 'y', 'text'], build: (id, a) => new Text(id, Shape.number(a[0], 'x'), Shape.number(a[1], 'y'), a[2]) }],
    ['g', { fields: [], build: id => new Group(id) }]
  ]);
  private numbers(args: readonly string[], count: number): number[] { return args.slice(0, count).map(value => Shape.number(value, 'geometry')); }
  private definition(kind: string): Definition {
    const definition = this.definitions.get(kind);
    if (!definition) throw new Error('unknown shape type: ' + kind + ' (is the plugin loaded?)');
    return definition;
  }
  create(kind: string, id: string, args: readonly string[]): Shape {
    const definition = this.definition(kind);
    const count = definition.fields.length;
    if (args.length < count || args.length > count + (definition.style ? 1 : 0)) throw new Error('invalid parameters for ' + kind);
    const shape = definition.build(id, args);
    if (args.length > count && definition.style) shape.setAttribute(definition.style, args[count]);
    return shape;
  }
  fromAttributes(kind: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const definition = this.definition(kind);
    const args = definition.fields.map(key => key === 'text' ? text : attributes[key] ?? '0');
    const shape = this.create(kind, id, args);
    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'id' || key === 'transform' || key === 'xmlns' || key === 'data-kind' || definition.fields.includes(key)) continue;
      shape.setAttribute(key, value);
    }
    return shape;
  }
}
