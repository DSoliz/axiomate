import { CodeAction, CodeActionKind, CodeActionParams, TextEdit } from 'vscode-languageserver/node';
import { ParsedDocument } from '@axiomate/parser';
import { generateNextId } from './utils';

export function onCodeAction(params: CodeActionParams, doc: ParsedDocument): CodeAction[] {
  const newId = generateNextId(doc);

  const lastLine = doc.statements.length > 0
    ? doc.statements[doc.statements.length - 1].line
    : 0;

  const insertPosition = { line: lastLine + 1, character: 0 };

  return [
    {
      title: `Generate new statement (${newId})`,
      kind: CodeActionKind.Source,
      edit: {
        changes: {
          [params.textDocument.uri]: [
            TextEdit.insert(insertPosition, `${newId} \n`),
          ],
        },
      },
    },
  ];
}
