import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { onDefinition } from '../src/definition';

function makeParams(line: number, character: number, uri = 'file:///test.axm') {
  return {
    textDocument: { uri },
    position: { line, character },
  };
}

describe('onDefinition', () => {
  it('returns definition location for a reference', () => {
    // "stm ax1 = First"             line 0, id at 4-7
    // "stm th1 = Given ${ax1} done" line 1, ref at 16-22
    const doc = parse('stm ax1 = First\nstm th1 = Given ${ax1} done\n');
    const result = onDefinition(makeParams(1, 19), doc);
    expect(result).not.toBeNull();
    expect(result!.range.start).toEqual({ line: 0, character: 4 });
    expect(result!.range.end).toEqual({ line: 0, character: 7 });
  });

  it('returns null when cursor is not on a reference', () => {
    const doc = parse('stm ax1 = First\nstm th1 = Given ${ax1} done\n');
    const result = onDefinition(makeParams(1, 12), doc);
    expect(result).toBeNull();
  });

  it('returns null for unresolved reference', () => {
    const doc = parse('stm th1 = Given ${ax99} done\n');
    const result = onDefinition(makeParams(0, 19), doc);
    expect(result).toBeNull();
  });
});
