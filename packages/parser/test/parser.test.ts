import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';

describe('parse', () => {
  it('parses a simple statement', () => {
    const doc = parse('stm ax1 = All humans are mortal\n');
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0].id).toBe('ax1');
    expect(doc.statements[0].annotation).toBe('stm');
    expect(doc.statements[0].body).toBe('All humans are mortal');
    expect(doc.statements[0].line).toBe(0);
  });

  it('parses multiple statements', () => {
    const doc = parse('stm ax1 = First\nstm ax2 = Second\nstm ax3 = Third\n');
    expect(doc.statements).toHaveLength(3);
    expect(doc.statements[0].id).toBe('ax1');
    expect(doc.statements[1].id).toBe('ax2');
    expect(doc.statements[2].id).toBe('ax3');
  });

  it('skips blank lines', () => {
    const doc = parse('stm ax1 = First\n\nstm ax2 = Second\n');
    expect(doc.statements).toHaveLength(2);
    expect(doc.statements[0].line).toBe(0);
    expect(doc.statements[1].line).toBe(2);
  });

  it('skips comment lines', () => {
    const doc = parse('# This is a comment\nstm ax1 = First\n');
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0].id).toBe('ax1');
  });

  it('skips indented comments', () => {
    const doc = parse('  # indented comment\nstm ax1 = First\n');
    expect(doc.statements).toHaveLength(1);
  });

  it('parses references in body', () => {
    const doc = parse('stm ax1 = Start\nstm th1 = Given ${ax1} we conclude\n');
    const th1 = doc.statements[1];
    expect(th1.references).toHaveLength(1);
    expect(th1.references[0].id).toBe('ax1');
  });

  it('parses multiple references in one statement', () => {
    const doc = parse('stm ax1 = A\nstm ax2 = B\nstm th1 = Given ${ax1} and ${ax2} then C\n');
    const th1 = doc.statements[2];
    expect(th1.references).toHaveLength(2);
    expect(th1.references[0].id).toBe('ax1');
    expect(th1.references[1].id).toBe('ax2');
  });

  it('builds statementsById map', () => {
    const doc = parse('stm ax1 = First\nstm ax2 = Second\n');
    expect(doc.statementsById.get('ax1')).toHaveLength(1);
    expect(doc.statementsById.get('ax2')).toHaveLength(1);
    expect(doc.statementsById.has('ax3')).toBe(false);
  });

  it('detects duplicate IDs in statementsById', () => {
    const doc = parse('stm ax1 = First\nstm ax1 = Duplicate\n');
    expect(doc.statementsById.get('ax1')).toHaveLength(2);
  });

  it('computes correct idRange', () => {
    // "stm ax1 = Some body"
    //  0123456789...
    const doc = parse('stm ax1 = Some body\n');
    const stmt = doc.statements[0];
    expect(stmt.idRange.start).toEqual({ line: 0, character: 4 });
    expect(stmt.idRange.end).toEqual({ line: 0, character: 7 });
  });

  it('computes correct bodyRange', () => {
    // "stm ax1 = Some body"
    //  0123456789012345678
    //            ^bodyStart=10
    const doc = parse('stm ax1 = Some body\n');
    const stmt = doc.statements[0];
    expect(stmt.bodyRange.start).toEqual({ line: 0, character: 10 });
    expect(stmt.bodyRange.end).toEqual({ line: 0, character: 19 });
  });

  it('computes correct reference ranges', () => {
    // "stm th1 = Given ${ax1} done"
    //  0123456789012345678901234567
    //                  ^16 ref start (${ax1})
    const doc = parse('stm th1 = Given ${ax1} done\n');
    const ref = doc.statements[0].references[0];
    expect(ref.range.start).toEqual({ line: 0, character: 16 });
    expect(ref.range.end).toEqual({ line: 0, character: 22 });
    // id inside braces: skip ${ = +2
    expect(ref.idRange.start).toEqual({ line: 0, character: 18 });
    expect(ref.idRange.end).toEqual({ line: 0, character: 21 });
  });

  it('handles IDs with hyphens and underscores', () => {
    const doc = parse('stm my-axiom_1 = Something\n');
    expect(doc.statements[0].id).toBe('my-axiom_1');
  });

  it('handles empty input', () => {
    const doc = parse('');
    expect(doc.statements).toHaveLength(0);
  });

  it('handles input with only comments and blanks', () => {
    const doc = parse('# comment\n\n# another\n');
    expect(doc.statements).toHaveLength(0);
  });

  it('skips malformed lines without = separator', () => {
    const doc = parse('nospacehere\nstm ax1 = Valid\n');
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0].id).toBe('ax1');
  });

  it('parses stm type', () => {
    const doc = parse('stm ax1 = Plain statement\n');
    expect(doc.statements[0].annotation).toBe('stm');
  });

  it('parses asm type', () => {
    const doc = parse('asm ax1 = This is an assumption\n');
    const stmt = doc.statements[0];
    expect(stmt.id).toBe('ax1');
    expect(stmt.annotation).toBe('asm');
    expect(stmt.body).toBe('This is an assumption');
  });

  it('parses rsk type', () => {
    const doc = parse('rsk th1 = Risky conclusion\n');
    expect(doc.statements[0].annotation).toBe('rsk');
  });

  it('parses unk type', () => {
    const doc = parse('unk open1 = Unknown thing\n');
    expect(doc.statements[0].annotation).toBe('unk');
  });

  it('stores raw type even if invalid', () => {
    const doc = parse('foo ax1 = Invalid type\n');
    expect(doc.statements[0].annotation).toBe('foo');
  });

  it('computes correct annotationRange', () => {
    // "asm ax1 = Body"
    //  012
    const doc = parse('asm ax1 = Body\n');
    const stmt = doc.statements[0];
    expect(stmt.annotationRange).toEqual({
      start: { line: 0, character: 0 },
      end: { line: 0, character: 3 },
    });
  });

  it('computes correct bodyRange with type', () => {
    // "asm ax1 = Body text"
    //  0123456789012345678
    //            ^10
    const doc = parse('asm ax1 = Body text\n');
    const stmt = doc.statements[0];
    expect(stmt.bodyRange.start).toEqual({ line: 0, character: 10 });
  });

  it('computes correct reference ranges with type', () => {
    // "rsk th1 = Given ${ax1} done"
    //  0123456789012345678901234567
    //                  ^16
    const doc = parse('rsk th1 = Given ${ax1} done\n');
    const ref = doc.statements[0].references[0];
    expect(ref.range.start).toEqual({ line: 0, character: 16 });
    expect(ref.range.end).toEqual({ line: 0, character: 22 });
  });
});
