import { HoverParams, Hover } from 'vscode-languageserver/node';
import { ParsedDocument } from '@axiomate/parser';
import { findReferenceAtPosition } from './utils';

export function onHover(params: HoverParams, doc: ParsedDocument): Hover | null {
  const found = findReferenceAtPosition(doc, params.position);
  if (!found) return null;

  const target = doc.statementsById.get(found.reference.id);
  if (!target || target.length === 0) return null;

  return {
    contents: {
      kind: 'markdown',
      value: `**${target[0].id}** ${target[0].body}`,
    },
    range: found.reference.range,
  };
}
