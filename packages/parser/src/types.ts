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

export type Annotation = 'unk' | 'rsk' | 'asm';

export const VALID_ANNOTATIONS: readonly string[] = ['unk', 'rsk', 'asm'];

export interface Statement {
  id: string;
  idRange: Range;
  annotation: Annotation | null;
  annotationRange: Range | null;
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
