import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { onHover } from '../src/hover';

function makeParams(line: number, character: number, uri = 'file:///test.axm') {
  return {
    textDocument: { uri },
    position: { line, character },
  };
}

describe('onHover', () => {
  it('returns hover content for a reference', () => {
    const doc = parse('stm ax1 = All humans are mortal\nstm th1 = Given ${ax1} done\n');
    const result = onHover(makeParams(1, 19), doc);
    expect(result).not.toBeNull();
    const value = (result!.contents as { value: string }).value;
    expect(value).toContain('**ax1**');
    expect(value).toContain('`stm`');
    expect(value).toContain('*Statement*');
    expect(value).toContain('All humans are mortal');
    expect(value).toContain('A plain assertion or fact.');
  });

  it('returns null when not on a reference', () => {
    const doc = parse('stm ax1 = First\nstm th1 = Given ${ax1} done\n');
    const result = onHover(makeParams(0, 6), doc);
    expect(result).toBeNull();
  });

  it('returns null for unresolved reference', () => {
    const doc = parse('stm th1 = Given ${missing} done\n');
    const result = onHover(makeParams(0, 19), doc);
    expect(result).toBeNull();
  });

  it('shows asm type with description in hover', () => {
    const doc = parse('asm ax1 = We assume this\nstm th1 = Given ${ax1} done\n');
    const result = onHover(makeParams(1, 19), doc);
    expect(result).not.toBeNull();
    const value = (result!.contents as { value: string }).value;
    expect(value).toContain('`asm`');
    expect(value).toContain('*Assumption*');
    expect(value).toContain('A statement accepted without proof.');
  });

  it('shows rsk type with description in hover', () => {
    const doc = parse('rsk r1 = Risky thing\nstm th1 = Given ${r1} done\n');
    const result = onHover(makeParams(1, 19), doc);
    const value = (result!.contents as { value: string }).value;
    expect(value).toContain('`rsk`');
    expect(value).toContain('*Risk*');
    expect(value).toContain('A statement whose validity carries risk.');
  });

  it('shows unk type with description in hover', () => {
    const doc = parse('unk q1 = Open question\nstm th1 = Given ${q1} done\n');
    const result = onHover(makeParams(1, 19), doc);
    const value = (result!.contents as { value: string }).value;
    expect(value).toContain('`unk`');
    expect(value).toContain('*Unknown*');
    expect(value).toContain('A statement whose truth value is not yet known.');
  });
});
