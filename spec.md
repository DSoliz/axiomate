# Axiomate File Format Specification

**Extension:** `.axm`

## Overview

Axiomate (`.axm`) is a plain-text file format for writing and referencing uniquely identified statements. Each statement has a unique ID that other statements can reference, forming a chain of reasoning. Statements can optionally be annotated to denote assumptions, risks, or unknowns.

## Syntax

### Statements

A statement is a single line composed of a unique ID, an optional annotation, and the statement body.

```
<id>[@<annotation>] <body>
```

- `<id>` — A unique identifier. Must be a non-empty string of alphanumeric characters, hyphens, or underscores (`[a-zA-Z0-9_-]+`). Must be unique within the file.
- `@<annotation>` — Optional. One of `unk` (unknown), `rsk` (risk), or `asm` (assumption). Immediately follows the ID with no space.
- `<body>` — The rest of the line after the first whitespace separator. Free-form text.

**Example:**

```axm
ax1 All humans are mortal
ax2@asm We assume Socrates is a human
th1@rsk Given {ax1} and {ax2} this conclusion depends on an assumption
open1@unk We don't know if this applies to demigods
```

### Annotations

Annotations classify the nature of a statement:

| Annotation | Meaning    | Description                                        |
| ---------- | ---------- | -------------------------------------------------- |
| `@asm`     | Assumption | A statement accepted without proof                 |
| `@rsk`     | Risk       | A statement whose validity carries risk            |
| `@unk`     | Unknown    | A statement whose truth value is not yet known     |

Annotations are optional. A statement without an annotation is a plain assertion.

### References

A statement can reference other statements by wrapping their ID in curly braces `{<id>}`.

```
<id> ... {<referenced_id>} ...
```

The referenced ID must correspond to a statement defined elsewhere in the same file. A statement may contain zero or more references.

**Example:**

```axm
ax1 All humans are mortal
ax2 Socrates is a human
th1 Given {ax1} and {ax2} then Socrates is mortal
```

### Comments

Lines starting with `#` are comments and are ignored by parsers.

```axm
# This is a comment
ax1 All humans are mortal
```

### Blank Lines

Blank lines are ignored and can be used freely to organize content.

## Constraints

| Rule                        | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| Unique IDs                  | No two statements may share the same ID within a file.   |
| Valid references             | Every `{id}` must resolve to a statement in the file.    |
| No circular self-reference  | A statement cannot reference its own ID.                 |
| One statement per line      | Each statement occupies exactly one line.                 |
| Valid annotations            | If present, annotation must be one of `unk`, `rsk`, `asm`.|

## LSP Features

An Axiomate Language Server provides the following capabilities:

### Diagnostics

- **Duplicate ID** — Warning when two statements share the same ID.
- **Unresolved reference** — Error when `{id}` does not match any statement.
- **Self-reference** — Warning when a statement references itself.
- **Invalid annotation** — Error when `@<value>` is not one of `unk`, `rsk`, `asm`.

### Go to Definition

Placing the cursor on a `{id}` reference and invoking "Go to Definition" navigates to the statement where that ID is defined.

### Find References

Placing the cursor on a statement ID or a `{id}` reference and invoking "Find References" lists all locations where that statement is referenced.

### Hover

Hovering over a `{id}` reference displays the full text of the referenced statement, including its annotation if present.

### Code Action: Generate Statement

A code action that generates a new statement with a unique ID. When triggered:

1. A new unique ID is generated (e.g., incrementing the highest numeric suffix found in the file).
2. A blank statement is inserted with the cursor positioned at the body.

**Example:** If the file contains `ax1` and `ax2`, the generated statement is:

```axm
ax3
```

### Autocomplete

Typing `{` inside a statement body triggers autocomplete with a list of all known statement IDs in the file. Completion items show the annotation (if any) and body text.

## File Example

```axm
# Peano axioms (informal)
pa1 Zero is a natural number
pa2 Every natural number has a successor which is also a natural number
pa3@asm Zero is not the successor of any natural number
pa4 If the successors of two numbers are equal then the two numbers are equal
pa5 If a property holds for zero and for the successor of every number for which it holds then it holds for all natural numbers

# A derived statement
th1 Given {pa1} and {pa2} we can construct the sequence 0, S(0), S(S(0)), ...

# Open questions
q1@unk Is there a largest natural number?
```

## Grammar (EBNF)

```ebnf
file       = { line } ;
line       = blank | comment | statement ;
blank      = { whitespace } , newline ;
comment    = "#" , { any_char } , newline ;
statement  = id , [ annotation ] , whitespace , body , newline ;
id         = id_char , { id_char } ;
id_char    = letter | digit | "_" | "-" ;
annotation = "@" , ann_value ;
ann_value  = "unk" | "rsk" | "asm" ;
body       = { body_part } ;
body_part  = reference | text ;
reference  = "{" , id , "}" ;
text       = any_char - "{" ;
```
