import { Token } from './Token.js';
export class Tokenizer {
  tokenize(source: string): Token[] {
    if (source.trimStart().startsWith('#')) return [];
    const tokens: Token[] = [];
    let value = ''; let active = false; let quoted = false; let inside = false;
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (inside) {
        if (char === '"') inside = false;
        else if (char === '\\' && (source[i + 1] === '"' || source[i + 1] === '\\')) value += source[++i];
        else value += char;
      } else if (char === '"') { if (active) throw new Error('quote must start a parameter'); inside = true; quoted = true; active = true; }
      else if (/\s/u.test(char)) { if (active) { tokens.push(new Token(value, quoted)); value = ''; active = false; quoted = false; } }
      else { if (quoted) throw new Error('expected space after quote'); active = true; value += char; }
    }
    if (inside) throw new Error('unterminated double quote');
    if (active) tokens.push(new Token(value, quoted));
    return tokens;
  }
}
