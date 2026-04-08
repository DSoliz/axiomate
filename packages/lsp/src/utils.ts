import { ParsedDocument, Position, Reference, Statement } from '@axiomate/parser';

export function findReferenceAtPosition(
  doc: ParsedDocument,
  pos: Position
): { statement: Statement; reference: Reference } | null {
  for (const statement of doc.statements) {
    for (const ref of statement.references) {
      if (positionInRange(pos, ref.range)) {
        return { statement, reference: ref };
      }
    }
  }
  return null;
}

export function positionInRange(pos: Position, range: { start: Position; end: Position }): boolean {
  if (pos.line < range.start.line || pos.line > range.end.line) return false;
  if (pos.line === range.start.line && pos.character < range.start.character) return false;
  if (pos.line === range.end.line && pos.character >= range.end.character) return false;
  return true;
}

export function generateNextId(doc: ParsedDocument): string {
  let maxNum = 0;
  let prefix = 'ax';

  const prefixCounts = new Map<string, number>();

  for (const stmt of doc.statements) {
    const match = stmt.id.match(/^([a-zA-Z_-]*)(\d+)$/);
    if (match) {
      const p = match[1] || 'ax';
      const n = parseInt(match[2], 10);
      prefixCounts.set(p, (prefixCounts.get(p) || 0) + 1);
      if (n > maxNum) {
        maxNum = n;
        prefix = p;
      }
    }
  }

  // Use the most common prefix
  let maxCount = 0;
  for (const [p, count] of prefixCounts) {
    if (count > maxCount) {
      maxCount = count;
      prefix = p;
    }
  }

  return `${prefix}${maxNum + 1}`;
}
