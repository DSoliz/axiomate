import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { onCodeAction } from '../src/codeAction';

function makeParams(uri = 'file:///test.axm') {
  return {
    textDocument: { uri },
    range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
    context: { diagnostics: [] },
  };
}

describe('onCodeAction', () => {
  it('generates next ID based on existing statements', () => {
    const doc = parse('stm ax1 = First\nstm ax2 = Second\n');
    const actions = onCodeAction(makeParams(), doc);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toContain('ax3');
  });

  it('inserts after the last statement', () => {
    const doc = parse('stm ax1 = First\nstm ax2 = Second\n');
    const actions = onCodeAction(makeParams(), doc);
    const edit = actions[0].edit!.changes!['file:///test.axm'][0];
    expect(edit.range.start.line).toBe(2);
  });

  it('handles empty document', () => {
    const doc = parse('');
    const actions = onCodeAction(makeParams(), doc);
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toContain('ax1');
  });

  it('generates statement with stm prefix and = separator', () => {
    const doc = parse('stm ax1 = First\n');
    const actions = onCodeAction(makeParams(), doc);
    const edit = actions[0].edit!.changes!['file:///test.axm'][0];
    expect(edit.newText).toBe('stm ax2 = \n');
  });
});
