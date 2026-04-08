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
    const doc = parse('ax1 All humans are mortal\nth1 Given {ax1} done\n');
    const result = onHover(makeParams(1, 12), doc);
    expect(result).not.toBeNull();
    expect(result!.contents).toEqual({
      kind: 'markdown',
      value: '**ax1** All humans are mortal',
    });
  });

  it('returns null when not on a reference', () => {
    const doc = parse('ax1 First\nth1 Given {ax1} done\n');
    const result = onHover(makeParams(0, 2), doc);
    expect(result).toBeNull();
  });

  it('returns null for unresolved reference', () => {
    const doc = parse('th1 Given {missing} done\n');
    const result = onHover(makeParams(0, 12), doc);
    expect(result).toBeNull();
  });
});
