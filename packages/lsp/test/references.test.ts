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
    const doc = parse('ax1 First\nth1 Given {ax1} done\nth2 Also {ax1} here\n');
    // cursor on "ax1" at line 0
    const result = onReferences(makeParams(0, 1), doc);
    expect(result).toHaveLength(2);
  });

  it('finds all references when cursor is on a {ref}', () => {
    const doc = parse('ax1 First\nth1 Given {ax1} done\nth2 Also {ax1} here\n');
    // cursor on {ax1} at line 1
    const result = onReferences(makeParams(1, 12), doc);
    expect(result).toHaveLength(2);
  });

  it('returns empty when cursor is not on an ID or reference', () => {
    const doc = parse('ax1 First\nth1 Given {ax1} done\n');
    const result = onReferences(makeParams(0, 6), doc);
    expect(result).toHaveLength(0);
  });

  it('returns empty when statement has no references', () => {
    const doc = parse('ax1 First\nax2 Second\n');
    const result = onReferences(makeParams(0, 1), doc);
    expect(result).toHaveLength(0);
  });
});
