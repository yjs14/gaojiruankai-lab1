import { Group } from './Group.js';
import { Shape } from './Shape.js';
export class Document {
  private root = new Group('$root');
  private w: number;
  private h: number;
  constructor(width = 800, height = 600) { this.w = Shape.positive(width, 'width'); this.h = Shape.positive(height, 'height'); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  get children(): readonly Shape[] { return this.root.children; }
  resize(width: number, height: number): void { const w = Shape.positive(width, 'width'); const h = Shape.positive(height, 'height'); this.w = w; this.h = h; }
  all(): Shape[] { const visit = (shape: Shape): Shape[] => [shape, ...shape.children.flatMap(visit)]; return this.children.flatMap(visit); }
  find(id: string): Shape { const shape = this.all().find(item => item.id === id); if (!shape) throw new Error('no such shape: ' + id); return shape; }
  unique(id: string): void { if (this.all().some(item => item.id === id)) throw new Error('id already exists: ' + id); }
  container(id: string): Group {
    const item = this.all().find(shape => shape.id === id);
    if (!item) throw new Error('no such container: ' + id);
    if (!(item instanceof Group)) throw new Error('not a container: ' + id);
    return item;
  }
  parent(id: string): Group {
    const result = [this.root, ...this.all().filter((shape): shape is Group => shape instanceof Group)].find(group => group.children.some(child => child.id === id));
    if (!result) throw new Error('no such shape: ' + id);
    return result;
  }
  parentLabel(id: string): string { const parent = this.parent(id); return parent === this.root ? 'svg' : 'g#' + parent.id; }
  add(shape: Shape, parentId?: string): void {
    const parent = parentId === undefined ? this.root : this.container(parentId);
    const incoming = (item: Shape): Shape[] => [item, ...item.children.flatMap(incoming)];
    const ids = new Set<string>();
    for (const item of incoming(shape)) { this.unique(item.id); if (ids.has(item.id)) throw new Error('id already exists: ' + item.id); ids.add(item.id); }
    parent.insert(shape);
  }
  delete(id: string): void { const shape = this.find(id); this.parent(id).remove(shape); }
  addTo(gid: string, id: string): void {
    const target = this.container(gid); const shape = this.find(id);
    if (shape === target || this.descends(shape, target)) throw new Error('cannot group a container into its own descendant: ' + id);
    this.parent(id).remove(shape); target.insert(shape);
  }
  private descends(ancestor: Shape, target: Shape): boolean { return ancestor.children.some(child => child === target || this.descends(child, target)); }
  group(gid: string, ids: readonly string[]): void {
    this.unique(gid);
    if (!ids.length) throw new Error('group needs at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = this.all().filter(shape => ids.includes(shape.id));
    for (const id of ids) this.find(id);
    for (const shape of selected) if (selected.some(other => shape !== other && this.descends(shape, other))) throw new Error('cannot group a container into its own descendant: ' + shape.id);
    let parent = this.parent(selected[0].id);
    while (parent !== this.root && !selected.every(shape => this.descends(parent, shape))) parent = this.parent(parent.id);
    const original = parent.children;
    const firstBranch = original.findIndex(branch => selected.some(shape => branch === shape || this.descends(branch, shape)));
    const before = original.slice(0, firstBranch).filter(branch => !selected.includes(branch)).length;
    const group = new Group(gid);
    for (const shape of selected) { this.parent(shape.id).remove(shape); group.insert(shape); }
    parent.insert(group, before);
  }
  ungroup(id: string): void {
    const group = this.find(id);
    if (!(group instanceof Group)) throw new Error('not a container: ' + id);
    const parent = this.parent(id);
    if (parent === this.root) throw new Error('cannot ungroup top-level container: ' + id);
    const index = parent.remove(group);
    for (const [offset, child] of group.children.entries()) { group.remove(child); parent.insert(child, index + offset); }
  }
  order(id: string, front: boolean): void { const shape = this.find(id); const parent = this.parent(id); parent.remove(shape); parent.insert(shape, front ? parent.children.length : 0); }
  clone(): Document { const copy = new Document(this.w, this.h); copy.root = this.root.clone(); return copy; }
}
