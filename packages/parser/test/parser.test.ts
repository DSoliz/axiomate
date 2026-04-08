import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';

describe('parse', () => {
  it('parses a simple statement', () => {
    const doc = parse('ax1 All humans are mortal\n');
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0].id).toBe('ax1');
    expect(doc.statements[0].body).toBe('All humans are mortal');
    expect(doc.statements[0].line).toBe(0);
  });

  it('parses multiple statements', () => {
    const doc = parse('ax1 First\nax2 Second\nax3 Third\n');
    expect(doc.statements).toHaveLength(3);
    expect(doc.statements[0].id).toBe('ax1');
    expect(doc.statements[1].id).toBe('ax2');
    expect(doc.statements[2].id).toBe('ax3');
  });

  it('skips blank lines', () => {
    const doc = parse('ax1 First\n\nax2 Second\n');
    expect(doc.statements).toHaveLength(2);
    expect(doc.statements[0].line).toBe(0);
    expect(doc.statements[1].line).toBe(2);
  });

  it('skips comment lines', () => {
    const doc = parse('# This is a comment\nax1 First\n');
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0].id).toBe('ax1');
  });

  it('skips indented comments', () => {
    const doc = parse('  # indented comment\nax1 First\n');
    expect(doc.statements).toHaveLength(1);
  });

  it('parses references in body', () => {
    const doc = parse('ax1 Start\nth1 Given {ax1} we conclude\n');
    const th1 = doc.statements[1];
    expect(th1.references).toHaveLength(1);
    expect(th1.references[0].id).toBe('ax1');
  });

  it('parses multiple references in one statement', () => {
    const doc = parse('ax1 A\nax2 B\nth1 Given {ax1} and {ax2} then C\n');
    const th1 = doc.statements[2];
    expect(th1.references).toHaveLength(2);
    expect(th1.references[0].id).toBe('ax1');
    expect(th1.references[1].id).toBe('ax2');
  });

  it('builds statementsById map', () => {
    const doc = parse('ax1 First\nax2 Second\n');
    expect(doc.statementsById.get('ax1')).toHaveLength(1);
    expect(doc.statementsById.get('ax2')).toHaveLength(1);
    expect(doc.statementsById.has('ax3')).toBe(false);
  });

  it('detects duplicate IDs in statementsById', () => {
    const doc = parse('ax1 First\nax1 Duplicate\n');
    expect(doc.statementsById.get('ax1')).toHaveLength(2);
  });

  it('computes correct idRange', () => {
    const doc = parse('ax1 Some body\n');
    const stmt = doc.statements[0];
    expect(stmt.idRange.start).toEqual({ line: 0, character: 0 });
    expect(stmt.idRange.end).toEqual({ line: 0, character: 3 });
  });

  it('computes correct bodyRange', () => {
    const doc = parse('ax1 Some body\n');
    const stmt = doc.statements[0];
    expect(stmt.bodyRange.start).toEqual({ line: 0, character: 4 });
    expect(stmt.bodyRange.end).toEqual({ line: 0, character: 13 });
  });

  it('computes correct reference ranges', () => {
    const doc = parse('th1 Given {ax1} done\n');
    const ref = doc.statements[0].references[0];
    // {ax1} starts at character 10
    expect(ref.range.start).toEqual({ line: 0, character: 10 });
    expect(ref.range.end).toEqual({ line: 0, character: 15 });
    // id inside braces
    expect(ref.idRange.start).toEqual({ line: 0, character: 11 });
    expect(ref.idRange.end).toEqual({ line: 0, character: 14 });
  });

  it('handles IDs with hyphens and underscores', () => {
    const doc = parse('my-axiom_1 Something\n');
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

  it('skips malformed lines without whitespace separator', () => {
    const doc = parse('nospacehere\nax1 Valid\n');
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0].id).toBe('ax1');
  });

  it('parses statement without annotation', () => {
    const doc = parse('ax1 Plain statement\n');
    expect(doc.statements[0].annotation).toBeNull();
    expect(doc.statements[0].annotationRange).toBeNull();
  });

  it('parses @asm annotation', () => {
    const doc = parse('ax1@asm This is an assumption\n');
    const stmt = doc.statements[0];
    expect(stmt.id).toBe('ax1');
    expect(stmt.annotation).toBe('asm');
    expect(stmt.body).toBe('This is an assumption');
  });

  it('parses @rsk annotation', () => {
    const doc = parse('th1@rsk Risky conclusion\n');
    expect(doc.statements[0].annotation).toBe('rsk');
  });

  it('parses @unk annotation', () => {
    const doc = parse('open1@unk Unknown thing\n');
    expect(doc.statements[0].annotation).toBe('unk');
  });

  it('stores raw annotation even if invalid', () => {
    const doc = parse('ax1@foo Invalid annotation\n');
    expect(doc.statements[0].annotation).toBe('foo');
  });

  it('computes correct annotationRange', () => {
    const doc = parse('ax1@asm Body\n');
    const stmt = doc.statements[0];
    // @asm starts at character 3, ends at 7
    expect(stmt.annotationRange).toEqual({
      start: { line: 0, character: 3 },
      end: { line: 0, character: 7 },
    });
  });

  it('computes correct bodyRange with annotation', () => {
    const doc = parse('ax1@asm Body text\n');
    const stmt = doc.statements[0];
    // ax1@asm = 7 chars, then space, body starts at 8
    expect(stmt.bodyRange.start).toEqual({ line: 0, character: 8 });
  });

  it('computes correct reference ranges with annotation', () => {
    const doc = parse('th1@rsk Given {ax1} done\n');
    const ref = doc.statements[0].references[0];
    // th1@rsk = 7, space = 1, "Given " = 6 => {ax1} at 14
    expect(ref.range.start).toEqual({ line: 0, character: 14 });
    expect(ref.range.end).toEqual({ line: 0, character: 19 });
  });
});
