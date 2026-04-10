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
  it('returns all statement IDs except the current one after ${', () => {
    const { doc, textDoc, params } = setup('stm ax1 = First\nstm ax2 = Second\nstm th1 = Given ${\n', 2, 18);
    const result = onCompletion(params, doc, textDoc);
    const labels = result.map((c) => c.label);
    expect(labels).toContain('ax1');
    expect(labels).toContain('ax2');
    expect(labels).not.toContain('th1');
  });

  it('includes body text and type label as detail', () => {
    const { doc, textDoc, params } = setup('stm ax1 = All humans are mortal\nstm th1 = Given ${\n', 1, 18);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toBe('[Statement] All humans are mortal');
  });

  it('truncates long body text', () => {
    const longBody = 'A'.repeat(100);
    const { doc, textDoc, params } = setup(`stm ax1 = ${longBody}\nstm th1 = Given \${\n`, 1, 18);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toContain('[Statement] ');
    expect(ax1?.detail).toContain('...');
  });

  it('returns empty when no ${ before cursor', () => {
    const { doc, textDoc, params } = setup('stm ax1 = First\nstm ax2 = Second\n', 1, 12);
    const result = onCompletion(params, doc, textDoc);
    expect(result).toHaveLength(0);
  });

  it('returns empty when cursor is after a closed reference', () => {
    const { doc, textDoc, params } = setup('stm ax1 = First\nstm th1 = Given ${ax1} more text\n', 1, 28);
    const result = onCompletion(params, doc, textDoc);
    expect(result).toHaveLength(0);
  });

  it('returns completions when typing inside an open ${', () => {
    const { doc, textDoc, params } = setup('stm ax1 = First\nstm th1 = Given ${a\n', 1, 19);
    const result = onCompletion(params, doc, textDoc);
    expect(result.length).toBeGreaterThan(0);
  });

  it('shows Assumption label for asm type', () => {
    const { doc, textDoc, params } = setup('asm ax1 = An assumption\nstm th1 = Given ${\n', 1, 18);
    const result = onCompletion(params, doc, textDoc);
    const ax1 = result.find((c) => c.label === 'ax1');
    expect(ax1?.detail).toBe('[Assumption] An assumption');
  });

  it('shows Risk label for rsk type', () => {
    const { doc, textDoc, params } = setup('rsk r1 = Risky\nstm th1 = Given ${\n', 1, 18);
    const result = onCompletion(params, doc, textDoc);
    const r1 = result.find((c) => c.label === 'r1');
    expect(r1?.detail).toBe('[Risk] Risky');
  });

  it('shows Unknown label for unk type', () => {
    const { doc, textDoc, params } = setup('unk q1 = Open question\nstm th1 = Given ${\n', 1, 18);
    const result = onCompletion(params, doc, textDoc);
    const q1 = result.find((c) => c.label === 'q1');
    expect(q1?.detail).toBe('[Unknown] Open question');
  });
});
