import { HoverParams, Hover } from 'vscode-languageserver/node';
import { ParsedDocument, TYPE_LABELS, TYPE_DESCRIPTIONS } from '@axiomate/parser';
import { findReferenceAtPosition } from './utils';

export function onHover(params: HoverParams, doc: ParsedDocument): Hover | null {
  const found = findReferenceAtPosition(doc, params.position);
  if (!found) return null;

  const target = doc.statementsById.get(found.reference.id);
  if (!target || target.length === 0) return null;

  const stmt = target[0];
  const typeLabel = TYPE_LABELS[stmt.annotation] ?? stmt.annotation;
  const typeDesc = TYPE_DESCRIPTIONS[stmt.annotation] ?? '';

  const lines = [
    `**${stmt.id}** \`${stmt.annotation}\` — *${typeLabel}*`,
    '',
    stmt.body,
  ];

  if (typeDesc) {
    lines.push('', `---`, '', typeDesc);
  }

  return {
    contents: {
      kind: 'markdown',
      value: lines.join('\n'),
    },
    range: found.reference.range,
  };
}
