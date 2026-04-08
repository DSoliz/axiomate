import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse, ParsedDocument } from '@axiomate/parser';
import { computeDiagnostics } from './diagnostics';
import { onDefinition } from './definition';
import { onHover } from './hover';
import { onCompletion } from './completion';
import { onCodeAction } from './codeAction';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const parsedDocuments = new Map<string, ParsedDocument>();

connection.onInitialize((): InitializeResult => ({
  capabilities: {
    textDocumentSync: TextDocumentSyncKind.Full,
    completionProvider: { triggerCharacters: ['{'] },
    hoverProvider: true,
    definitionProvider: true,
    codeActionProvider: true,
  },
}));

documents.onDidChangeContent((change) => {
  const doc = change.document;
  const parsed = parse(doc.getText());
  parsedDocuments.set(doc.uri, parsed);

  connection.sendDiagnostics({
    uri: doc.uri,
    diagnostics: computeDiagnostics(parsed),
  });
});

documents.onDidClose((event) => {
  parsedDocuments.delete(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

connection.onDefinition((params) => {
  const parsed = parsedDocuments.get(params.textDocument.uri);
  if (!parsed) return null;
  return onDefinition(params, parsed);
});

connection.onHover((params) => {
  const parsed = parsedDocuments.get(params.textDocument.uri);
  if (!parsed) return null;
  return onHover(params, parsed);
});

connection.onCompletion((params) => {
  const parsed = parsedDocuments.get(params.textDocument.uri);
  if (!parsed) return [];
  return onCompletion(params, parsed);
});

connection.onCodeAction((params) => {
  const parsed = parsedDocuments.get(params.textDocument.uri);
  if (!parsed) return [];
  return onCodeAction(params, parsed);
});

documents.listen(connection);
connection.listen();
