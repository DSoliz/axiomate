import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { onReferences } from '../src/references';

function makeParams(line: number, character: number, uri = 'file:///test.axm') {
  return {
    textDocument: { uri },
    position: { line, character },
    context: { includeDeclaration: false },
  };
}

describe('onReferences', () => {
  it('finds all references when cursor is on a statement ID', () => {
    // "stm ax1 = First"               line 0, id at 4-7
    // "stm th1 = Given ${ax1} done"   line 1
    // "stm th2 = Also ${ax1} here"    line 2
    const doc = parse('stm ax1 = First\nstm th1 = Given ${ax1} done\nstm th2 = Also ${ax1} here\n');
    // cursor on "ax1" id at line 0, char 5
    const result = onReferences(makeParams(0, 5), doc);
    expect(result).toHaveLength(2);
  });

  it('finds all references when cursor is on a ${ref}', () => {
    const doc = parse('stm ax1 = First\nstm th1 = Given ${ax1} done\nstm th2 = Also ${ax1} here\n');
    // cursor on ${ax1} at line 1
    const result = onReferences(makeParams(1, 19), doc);
    expect(result).toHaveLength(2);
  });

  it('returns empty when cursor is not on an ID or reference', () => {
    const doc = parse('stm ax1 = First\nstm th1 = Given ${ax1} done\n');
    const result = onReferences(makeParams(0, 12), doc);
    expect(result).toHaveLength(0);
  });

  it('returns empty when statement has no references', () => {
    const doc = parse('stm ax1 = First\nstm ax2 = Second\n');
    const result = onReferences(makeParams(0, 5), doc);
    expect(result).toHaveLength(0);
  });
});
