import type { Document } from '../domain/Document.js';
export interface DocumentCodec { encode(document: Document): string; decode(source: string): { document: Document; warnings: string[] }; }
