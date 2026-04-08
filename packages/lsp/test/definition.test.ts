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
    const doc = parse('ax1 First\nth1 Given {ax1} done\n');
    // cursor on {ax1} at line 1, char 12
    const result = onDefinition(makeParams(1, 12), doc);
    expect(result).not.toBeNull();
    expect(result!.range.start).toEqual({ line: 0, character: 0 });
    expect(result!.range.end).toEqual({ line: 0, character: 3 });
  });

  it('returns null when cursor is not on a reference', () => {
    const doc = parse('ax1 First\nth1 Given {ax1} done\n');
    const result = onDefinition(makeParams(1, 5), doc);
    expect(result).toBeNull();
  });

  it('returns null for unresolved reference', () => {
    const doc = parse('th1 Given {ax99} done\n');
    const result = onDefinition(makeParams(0, 12), doc);
    expect(result).toBeNull();
  });
});
