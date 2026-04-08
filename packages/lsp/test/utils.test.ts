import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { findReferenceAtPosition, positionInRange, generateNextId } from '../src/utils';

describe('positionInRange', () => {
  const range = {
    start: { line: 1, character: 5 },
    end: { line: 1, character: 10 },
  };

  it('returns true for position inside range', () => {
    expect(positionInRange({ line: 1, character: 7 }, range)).toBe(true);
  });

  it('returns true for position at range start', () => {
    expect(positionInRange({ line: 1, character: 5 }, range)).toBe(true);
  });

  it('returns false for position at range end (exclusive)', () => {
    expect(positionInRange({ line: 1, character: 10 }, range)).toBe(false);
  });

  it('returns false for position before range', () => {
    expect(positionInRange({ line: 1, character: 3 }, range)).toBe(false);
  });

  it('returns false for position on different line', () => {
    expect(positionInRange({ line: 0, character: 7 }, range)).toBe(false);
  });
});

describe('findReferenceAtPosition', () => {
  it('finds reference when cursor is on it', () => {
    const doc = parse('ax1 First\nth1 Given {ax1} done\n');
    // {ax1} is at characters 10-15 on line 1
    const result = findReferenceAtPosition(doc, { line: 1, character: 12 });
    expect(result).not.toBeNull();
    expect(result!.reference.id).toBe('ax1');
  });

  it('returns null when cursor is not on a reference', () => {
    const doc = parse('ax1 First\nth1 Given {ax1} done\n');
    const result = findReferenceAtPosition(doc, { line: 1, character: 5 });
    expect(result).toBeNull();
  });

  it('returns null for empty document', () => {
    const doc = parse('');
    const result = findReferenceAtPosition(doc, { line: 0, character: 0 });
    expect(result).toBeNull();
  });
});

describe('generateNextId', () => {
  it('increments the most common prefix', () => {
    const doc = parse('ax1 A\nax2 B\nax3 C\n');
    expect(generateNextId(doc)).toBe('ax4');
  });

  it('handles mixed prefixes', () => {
    const doc = parse('ax1 A\nax2 B\nth1 C\n');
    const next = generateNextId(doc);
    // ax is most common (2 vs 1), highest number overall is 2
    expect(next).toBe('ax3');
  });

  it('defaults to ax1 for empty document', () => {
    const doc = parse('');
    expect(generateNextId(doc)).toBe('ax1');
  });

  it('handles single statement', () => {
    const doc = parse('def1 Something\n');
    expect(generateNextId(doc)).toBe('def2');
  });
});
