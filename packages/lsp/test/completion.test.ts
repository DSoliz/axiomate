import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse } from '@axiomate/parser';
import { onCompletion } from '../src/completion';

function setup(text: string, line: number, character: number, uri = 'file:///test.axm') {
  const doc = parse(text);
  const textDoc = TextDocument.create(uri, 'axiomate', 1, text);
  const params = { textDocument: { uri }, position: { line, character } };
  return { doc, textDoc, params };
}

describe('onCompletion', () => {
  it('returns all statement IDs except the current one after {', () => {
    const { doc, textDoc, params } = setup('ax1 First\nax2 Second\nth1 Given {\n', 2, 11);
    const result = onCompletion(params, doc, textDoc);
    const labels = result.map((c) => c.label);
    expect(labels).toContain('ax1');
    expect(labels).toContain('ax2');
    expect(labels).not.toContain('th1');
  });

  it('includes body text as detail', () => {
    const { doc, textDoc, params } = setup('ax1 All humans are mortal\nth1 Given {\n', 1, 11);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toBe('All humans are mortal');
  });

  it('truncates long body text', () => {
    const longBody = 'A'.repeat(100);
    const { doc, textDoc, params } = setup(`ax1 ${longBody}\nth1 Given {\n`, 1, 11);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toHaveLength(83); // 80 chars + "..."
  });

  it('returns empty when no { before cursor', () => {
    const { doc, textDoc, params } = setup('ax1 First\nax2 Second\n', 1, 5);
    const result = onCompletion(params, doc, textDoc);
    expect(result).toHaveLength(0);
  });

  it('returns empty when cursor is after a closed reference', () => {
    const { doc, textDoc, params } = setup('ax1 First\nth1 Given {ax1} more text\n', 1, 20);
    const result = onCompletion(params, doc, textDoc);
    expect(result).toHaveLength(0);
  });

  it('returns completions when typing inside an open {', () => {
    const { doc, textDoc, params } = setup('ax1 First\nth1 Given {a\n', 1, 12);
    const result = onCompletion(params, doc, textDoc);
    expect(result.length).toBeGreaterThan(0);
  });

  it('shows annotation in completion detail', () => {
    const { doc, textDoc, params } = setup('ax1@asm An assumption\nth1 Given {\n', 1, 11);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toBe('[@asm] An assumption');
  });

  it('shows no annotation prefix when none present', () => {
    const { doc, textDoc, params } = setup('ax1 Plain\nth1 Given {\n', 1, 11);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toBe('Plain');
  });
});
