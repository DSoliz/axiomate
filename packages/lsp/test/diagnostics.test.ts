import { describe, it, expect } from 'vitest';
import { parse } from '@axiomate/parser';
import { computeDiagnostics } from '../src/diagnostics';

describe('computeDiagnostics', () => {
  it('returns no diagnostics for valid document', () => {
    const doc = parse('stm ax1 = First\nstm ax2 = Second\nstm th1 = Given ${ax1} and ${ax2}\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(0);
  });

  it('reports duplicate IDs', () => {
    const doc = parse('stm ax1 = First\nstm ax1 = Duplicate\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(2);
    expect(diags[0].message).toContain("Duplicate statement ID 'ax1'");
    expect(diags[1].message).toContain("Duplicate statement ID 'ax1'");
  });

  it('reports unresolved references', () => {
    const doc = parse('stm th1 = Given ${ax99} we conclude\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain("Unresolved reference '${ax99}'");
  });

  it('reports self-references as warnings', () => {
    const doc = parse('stm ax1 = References itself ${ax1}\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain("Statement 'ax1' references itself");
    expect(diags[0].severity).toBe(2); // Warning
  });

  it('reports multiple unresolved references', () => {
    const doc = parse('stm th1 = Given ${foo} and ${bar}\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(2);
  });

  it('handles mixed errors', () => {
    const doc = parse('stm ax1 = First\nstm ax1 = Dupe\nstm th1 = Given ${missing}\n');
    const diags = computeDiagnostics(doc);
    const dupes = diags.filter((d) => d.message.includes('Duplicate'));
    const unresolved = diags.filter((d) => d.message.includes('Unresolved'));
    expect(dupes).toHaveLength(2);
    expect(unresolved).toHaveLength(1);
  });

  it('reports invalid type keyword', () => {
    const doc = parse('foo ax1 = Invalid type\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain("Invalid type 'foo'");
  });

  it('accepts valid types without diagnostics', () => {
    const doc = parse('asm ax1 = Assumption\nrsk ax2 = Risk\nunk ax3 = Unknown\nstm ax4 = Statement\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(0);
  });

  it('no diagnostic for stm type', () => {
    const doc = parse('stm ax1 = Plain\n');
    const diags = computeDiagnostics(doc);
    expect(diags).toHaveLength(0);
  });
});
