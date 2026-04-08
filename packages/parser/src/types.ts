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

export interface Statement {
  id: string;
  idRange: Range;
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
