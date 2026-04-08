import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { ParsedDocument, VALID_ANNOTATIONS } from '@axiomate/parser';

export function computeDiagnostics(doc: ParsedDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Duplicate IDs
  for (const [id, stmts] of doc.statementsById) {
    if (stmts.length > 1) {
      for (const stmt of stmts) {
        diagnostics.push({
          range: stmt.idRange,
          severity: DiagnosticSeverity.Error,
          message: `Duplicate statement ID '${id}'`,
          source: 'axiomate',
        });
      }
    }
  }

  // Invalid annotations
  for (const stmt of doc.statements) {
    if (stmt.annotation && !VALID_ANNOTATIONS.includes(stmt.annotation)) {
      diagnostics.push({
        range: stmt.annotationRange!,
        severity: DiagnosticSeverity.Error,
        message: `Invalid annotation '@${stmt.annotation}'. Valid annotations: @unk, @rsk, @asm`,
        source: 'axiomate',
      });
    }
  }

  // Unresolved references and self-references
  for (const stmt of doc.statements) {
    for (const ref of stmt.references) {
      if (!doc.statementsById.has(ref.id)) {
        diagnostics.push({
          range: ref.range,
          severity: DiagnosticSeverity.Error,
          message: `Unresolved reference '{${ref.id}}'`,
          source: 'axiomate',
        });
      } else if (ref.id === stmt.id) {
        diagnostics.push({
          range: ref.range,
          severity: DiagnosticSeverity.Warning,
          message: `Statement '${stmt.id}' references itself`,
          source: 'axiomate',
        });
      }
    }
  }

  return diagnostics;
}
