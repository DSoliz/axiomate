export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Reference {
  id: string;
  range: Range;
  idRange: Range;
}

export type Annotation = 'stm' | 'unk' | 'rsk' | 'asm';

export const VALID_ANNOTATIONS: readonly string[] = ['stm', 'unk', 'rsk', 'asm'];

export const TYPE_LABELS: Record<string, string> = {
  stm: 'Statement',
  unk: 'Unknown',
  rsk: 'Risk',
  asm: 'Assumption',
};

export const TYPE_DESCRIPTIONS: Record<string, string> = {
  stm: 'A plain assertion or fact.',
  unk: 'A statement whose truth value is not yet known.',
  rsk: 'A statement whose validity carries risk.',
  asm: 'A statement accepted without proof.',
};

export interface Statement {
  id: string;
  idRange: Range;
  annotation: string;
  annotationRange: Range;
  bodyRange: Range;
  fullRange: Range;
  body: string;
  references: Reference[];
  line: number;
}

export interface ParsedDocument {
  statements: Statement[];
  statementsById: Map<string, Statement[]>;
}
