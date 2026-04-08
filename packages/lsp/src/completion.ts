import { CompletionParams, CompletionItem, CompletionItemKind, TextEdit, Range } from 'vscode-languageserver/node';
import { ParsedDocument } from '@axiomate/parser';

export function onCompletion(params: CompletionParams, doc: ParsedDocument): CompletionItem[] {
  const cursorLine = params.position.line;
  const cursorChar = params.position.character;
  const currentStmt = doc.statements.find((s) => s.line === cursorLine);

  // Find the opening `{` before the cursor to build the replace range
  let braceChar = cursorChar - 1;
  // The trigger character is `{`, so brace should be right before or nearby
  // We'll replace from `{` to cursor with the full `{id}`
  const replaceRange: Range = {
    start: { line: cursorLine, character: Math.max(0, braceChar) },
    end: { line: cursorLine, character: cursorChar },
  };

  return doc.statements
    .filter((s) => !currentStmt || s.id !== currentStmt.id)
    .map((s) => ({
      label: s.id,
      kind: CompletionItemKind.Reference,
      detail: s.body.length > 80 ? s.body.slice(0, 80) + '...' : s.body,
      textEdit: TextEdit.replace(replaceRange, `{${s.id}}`),
    }));
}
