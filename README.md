# Axiomate

A plain-text format for writing traceable chains of reasoning. Every statement gets a unique ID, a type, and can reference other statements — so you can see exactly what depends on what.

## Quick start

```bash
pnpm install
pnpm --filter @axiomate/parser build
```

## Write your first `.axm` file

Create a file called `analysis.axm`:

```
# Evaluate whether to adopt Postgres

stm db1 = the team has decided to use a relational database
asm db2 = Postgres is mature enough for our workload
unk db3 = do we have someone with production Postgres experience?
rsk db4 = given ${db3} we may hit operational issues we can't resolve quickly
stm db5 = from ${db1} and ${db2} Postgres is the default choice unless ${db4} materialises
```

Every line follows the same shape:

```
<type> <id> = <body>
```

## Statement types

Each statement starts with a keyword that signals how much weight it carries:

| Keyword | Name       | What it means                                      |
| ------- | ---------- | -------------------------------------------------- |
| `stm`   | Statement  | A fact or conclusion you are asserting.             |
| `asm`   | Assumption | Something accepted without proof — flag it so reviewers know. |
| `rsk`   | Risk       | A statement whose validity is uncertain and could cause problems. |
| `unk`   | Unknown    | An open question — the truth value is not yet known.|

## References

Link statements together with `${id}`:

```
stm a1 = all humans are mortal
stm a2 = Socrates is a human
stm t1 = from ${a1} and ${a2} Socrates is mortal
```

The LSP will warn you if a reference points to an ID that doesn't exist, or if a statement references itself.

## Analyse a file

Run the parser on any `.axm` file to extract statements and check for issues:

```bash
pnpm --filter @axiomate/parser build
node -e "
const { parse } = require('./packages/parser/out');
const fs = require('fs');

const doc = parse(fs.readFileSync(process.argv[1], 'utf8'));

for (const stmt of doc.statements) {
  const refs = stmt.references.map(r => r.id);
  console.log(
    stmt.annotation.padEnd(3),
    stmt.id.padEnd(10),
    refs.length ? 'refs: ' + refs.join(', ') : '(no refs)'
  );
}

// Check for problems
for (const [id, stmts] of doc.statementsById) {
  if (stmts.length > 1) console.error('DUPLICATE:', id);
}
for (const stmt of doc.statements) {
  for (const ref of stmt.references) {
    if (!doc.statementsById.has(ref.id)) console.error('UNRESOLVED:', ref.id, 'in', stmt.id);
    if (ref.id === stmt.id) console.error('SELF-REF:', stmt.id);
  }
}
" analysis.axm
```

Example output:

```
stm db1        (no refs)
asm db2        (no refs)
unk db3        (no refs)
rsk db4        refs: db3
stm db5        refs: db1, db2, db4
```

## VS Code extension

The `packages/lsp` package is a VS Code extension that gives you:

- **Syntax highlighting** — each type keyword (`stm`, `rsk`, `unk`, `asm`) gets a distinct colour
- **Diagnostics** — duplicate IDs, unresolved references, self-references, invalid types
- **Go to Definition** — jump from a `${ref}` to where the ID is defined
- **Find References** — see everywhere a statement is referenced
- **Hover** — hover a `${ref}` to see the target statement and what its type means
- **Autocomplete** — type `${` to get a list of all statement IDs with their type and body
- **Code Action** — generate a new statement with the next available ID

Build and install:

```bash
pnpm --filter @axiomate/lsp build
cd packages/lsp && pnpm run package
code --install-extension axiomate-0.1.0.vsix
```

## Run tests

```bash
pnpm --filter @axiomate/parser build
pnpm -r test
```

## Project structure

```
packages/
  parser/     — core parser: turns .axm text into structured data
  lsp/        — VS Code extension (language server + TextMate grammar)
  renderer/   — rendering utilities
tree-sitter-axiomate/  — tree-sitter grammar for editor integrations
samples/               — example .axm files
spec.md                — full language specification
```
