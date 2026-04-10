import { ParsedDocument, Reference, Statement } from './types';

// <type> <id> = <body>
const STMT_PATTERN = /^([a-zA-Z]+)\s+([a-zA-Z0-9][a-zA-Z0-9_-]*)\s*=\s*(.*)/;
const REF_PATTERN = /\$\{([a-zA-Z0-9_-]+)\}/g;

export function parse(text: string): ParsedDocument {
  const lines = text.split('\n');
  const statements: Statement[] = [];
  const statementsById = new Map<string, Statement[]>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const match = line.match(STMT_PATTERN);
    if (!match) {
      continue;
    }

    const annotation = match[1];
    const id = match[2];
    const body = match[3];

    const annotationStart = line.indexOf(annotation);
    const annotationEnd = annotationStart + annotation.length;

    const idStart = line.indexOf(id, annotationEnd);
    const idEnd = idStart + id.length;

    // Find where the body starts (after "= ")
    const eqIdx = line.indexOf('=', idEnd);
    const bodyStart = eqIdx + 1 + (line[eqIdx + 1] === ' ' ? 1 : 0);

    const references: Reference[] = [];
    let refMatch: RegExpExecArray | null;
    REF_PATTERN.lastIndex = 0;

    while ((refMatch = REF_PATTERN.exec(body)) !== null) {
      const refId = refMatch[1];
      const refStartInBody = refMatch.index;
      const refStartInLine = bodyStart + refStartInBody;

      references.push({
        id: refId,
        range: {
          start: { line: i, character: refStartInLine },
          end: { line: i, character: refStartInLine + refMatch[0].length },
        },
        idRange: {
          start: { line: i, character: refStartInLine + 2 }, // skip ${
          end: { line: i, character: refStartInLine + 2 + refId.length },
        },
      });
    }

    const statement: Statement = {
      id,
      idRange: {
        start: { line: i, character: idStart },
        end: { line: i, character: idEnd },
      },
      annotation,
      annotationRange: {
        start: { line: i, character: annotationStart },
        end: { line: i, character: annotationEnd },
      },
      bodyRange: {
        start: { line: i, character: bodyStart },
        end: { line: i, character: bodyStart + body.length },
      },
      fullRange: {
        start: { line: i, character: 0 },
        end: { line: i, character: line.length },
      },
      body,
      references,
      line: i,
    };

    statements.push(statement);

    const existing = statementsById.get(id);
    if (existing) {
      existing.push(statement);
    } else {
      statementsById.set(id, [statement]);
    }
  }

  return { statements, statementsById };
}
