import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { onCompletion } from '../src/completion';

function makeParams(line: number, character: number, uri = 'file:///test.axm') {
  return {
    textDocument: { uri },
    position: { line, character },
  };
}

describe('onCompletion', () => {
  it('returns all statement IDs except the current one', () => {
    const doc = parse('ax1 First\nax2 Second\nth1 Given {\n');
    // cursor on line 2 after {
    const result = onCompletion(makeParams(2, 11), doc);
    const labels = result.map((c) => c.label);
    expect(labels).toContain('ax1');
    expect(labels).toContain('ax2');
    expect(labels).not.toContain('th1');
  });

  it('includes body text as detail', () => {
    const doc = parse('ax1 All humans are mortal\nth1 Given {\n');
    const result = onCompletion(makeParams(1, 11), doc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toBe('All humans are mortal');
  });

  it('truncates long body text', () => {
    const longBody = 'A'.repeat(100);
    const doc = parse(`ax1 ${longBody}\nth1 Given {\n`);
    const result = onCompletion(makeParams(1, 11), doc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toHaveLength(83); // 80 chars + "..."
  });

  it('returns all IDs when cursor is not on a statement line', () => {
    const doc = parse('ax1 First\nax2 Second\n');
    // cursor on a blank/non-statement area
    const result = onCompletion(makeParams(2, 0), doc);
    expect(result).toHaveLength(2);
  });
});
