import { CompletionParams, CompletionItem, CompletionItemKind, TextEdit, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ParsedDocument } from '@axiomate/parser';

export function onCompletion(params: CompletionParams, doc: ParsedDocument, textDoc: TextDocument): CompletionItem[] {
  const cursorLine = params.position.line;
  const cursorChar = params.position.character;

  // Only complete inside a `{` context
  const lineText = textDoc.getText({
    start: { line: cursorLine, character: 0 },
    end: { line: cursorLine, character: cursorChar },
  });

  const braceIdx = lineText.lastIndexOf('{');
  if (braceIdx === -1) return [];

  // Make sure there's no closing `}` between the `{` and cursor
  const afterBrace = lineText.slice(braceIdx);
  if (afterBrace.includes('}')) return [];

  const currentStmt = doc.statements.find((s) => s.line === cursorLine);

  // Check if there's a `}` right after the cursor (from auto-close) to include in the replace range
  const fullLine = textDoc.getText({
    start: { line: cursorLine, character: 0 },
    end: { line: cursorLine + 1, character: 0 },
  });
  const hasClosingBrace = fullLine[cursorChar] === '}';

  const replaceRange: Range = {
    start: { line: cursorLine, character: braceIdx },
    end: { line: cursorLine, character: cursorChar + (hasClosingBrace ? 1 : 0) },
  };

  return doc.statements
    .filter((s) => !currentStmt || s.id !== currentStmt.id)
    .map((s) => ({
      label: s.id,
      kind: CompletionItemKind.Reference,
      detail: (s.annotation ? `[@${s.annotation}] ` : '') + (s.body.length > 80 ? s.body.slice(0, 80) + '...' : s.body),
      textEdit: TextEdit.replace(replaceRange, `{${s.id}}`),
    }));
}
