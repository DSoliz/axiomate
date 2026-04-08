import { DefinitionParams, Location } from 'vscode-languageserver/node';
import { ParsedDocument } from '@axiomate/parser';
import { findReferenceAtPosition } from './utils';

export function onDefinition(params: DefinitionParams, doc: ParsedDocument): Location | null {
  const found = findReferenceAtPosition(doc, params.position);
  if (!found) return null;

  const target = doc.statementsById.get(found.reference.id);
  if (!target || target.length === 0) return null;

  return {
    uri: params.textDocument.uri,
    range: target[0].idRange,
  };
}
