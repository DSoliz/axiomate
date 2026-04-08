import { ReferenceParams, Location } from 'vscode-languageserver/node';
import { ParsedDocument } from '@axiomate/parser';
import { findReferenceAtPosition, positionInRange } from './utils';

export function onReferences(params: ReferenceParams, doc: ParsedDocument): Location[] {
  const uri = params.textDocument.uri;
  const pos = params.position;

  // Determine which ID we're looking up references for.
  // Case 1: cursor is on a {ref} — find all references to that ref's target ID
  // Case 2: cursor is on a statement ID — find all references to that ID
  let targetId: string | null = null;

  const refHit = findReferenceAtPosition(doc, pos);
  if (refHit) {
    targetId = refHit.reference.id;
  } else {
    for (const stmt of doc.statements) {
      if (positionInRange(pos, stmt.idRange)) {
        targetId = stmt.id;
        break;
      }
    }
  }

  if (!targetId) return [];

  const locations: Location[] = [];

  for (const stmt of doc.statements) {
    for (const ref of stmt.references) {
      if (ref.id === targetId) {
        locations.push({ uri, range: ref.range });
      }
    }
  }

  return locations;
}
