import { CompletionParams, CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { ParsedDocument } from '@axiomate/parser';

export function onCompletion(params: CompletionParams, doc: ParsedDocument): CompletionItem[] {
  // Find which statement the cursor is in (if any)
  const cursorLine = params.position.line;
  const currentStmt = doc.statements.find((s) => s.line === cursorLine);

  return doc.statements
    .filter((s) => !currentStmt || s.id !== currentStmt.id)
    .map((s) => ({
      label: s.id,
      kind: CompletionItemKind.Reference,
      detail: s.body.length > 80 ? s.body.slice(0, 80) + '...' : s.body,
      insertText: `${s.id}}`,
    }));
}
