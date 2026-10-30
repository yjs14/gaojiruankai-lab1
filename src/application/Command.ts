import type { Document } from '../domain/Document.js';
export abstract class Command { abstract execute(document: Document): string; }
