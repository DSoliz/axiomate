import { Annotation, ParsedDocument, Reference, Statement, VALID_ANNOTATIONS } from './types';

const ID_PATTERN = /^([a-zA-Z0-9_-]+)(?:@([a-zA-Z]+))?\s+(.*)/;
const REF_PATTERN = /\{([a-zA-Z0-9_-]+)\}/g;

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

    const match = line.match(ID_PATTERN);
    if (!match) {
      continue;
    }

    const id = match[1];
    const rawAnnotation = match[2] || null;
    const body = match[3];
    const idStart = line.indexOf(id);
    const idEnd = idStart + id.length;

    let annotation: Annotation | null = null;
    let annotationRange: Statement['annotationRange'] = null;

    if (rawAnnotation) {
      const annotationStart = idEnd + 1; // skip the @
      annotation = VALID_ANNOTATIONS.includes(rawAnnotation)
        ? (rawAnnotation as Annotation)
        : (rawAnnotation as Annotation); // store raw value; diagnostics will flag invalid ones
      annotationRange = {
        start: { line: i, character: idEnd },
        end: { line: i, character: annotationStart + rawAnnotation.length },
      };
    }

    const bodyStart = idEnd + (rawAnnotation ? 1 + rawAnnotation.length : 0) + 1;

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
          start: { line: i, character: refStartInLine + 1 },
          end: { line: i, character: refStartInLine + 1 + refId.length },
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
      annotationRange,
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
