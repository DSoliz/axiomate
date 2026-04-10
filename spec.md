# Axiomate File Format Specification

**Extension:** `.axm`

## Overview

Axiomate (`.axm`) is a plain-text file format for writing and referencing uniquely identified statements. Each statement has a unique ID that other statements can reference, forming a chain of reasoning. Statements are classified by type to denote assumptions, risks, or unknowns.

## Syntax

### Statements

A statement is a single line composed of a type keyword, a unique ID, an `=` separator, and the statement body.

```
<type> <id> = <body>
```

- `<type>` — A keyword classifying the statement. Must be one of `stm`, `unk`, `rsk`, or `asm`.
- `<id>` — A unique identifier. Must be a non-empty string starting with an alphanumeric character, followed by alphanumeric characters, hyphens, or underscores (`[a-zA-Z0-9][a-zA-Z0-9_-]*`). Must be unique within the file.
- `=` — Separator between the ID and the body.
- `<body>` — The rest of the line after the `=` separator. Free-form text.

**Example:**

```axm
stm ax1 = All humans are mortal
asm ax2 = We assume Socrates is a human
rsk th1 = Given ${ax1} and ${ax2} this conclusion depends on an assumption
unk open1 = We don't know if this applies to demigods
```

### Types

Types classify the nature of a statement:

| Type  | Meaning    | Description                                        |
| ----- | ---------- | -------------------------------------------------- |
| `stm` | Statement  | A plain assertion or fact                          |
| `asm` | Assumption | A statement accepted without proof                 |
| `rsk` | Risk       | A statement whose validity carries risk            |
| `unk` | Unknown    | A statement whose truth value is not yet known     |

Every statement must have a type keyword.

### References

A statement can reference other statements by wrapping their ID in `${<id>}`.

```
<type> <id> = ... ${<referenced_id>} ...
```

The referenced ID must correspond to a statement defined elsewhere in the same file. A statement may contain zero or more references.

**Example:**

```axm
stm ax1 = All humans are mortal
stm ax2 = Socrates is a human
stm th1 = Given ${ax1} and ${ax2} then Socrates is mortal
```

### Comments

Lines starting with `#` are comments and are ignored by parsers.

```axm
# This is a comment
stm ax1 = All humans are mortal
```

### Blank Lines

Blank lines are ignored and can be used freely to organize content.

## Constraints

| Rule                        | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| Unique IDs                  | No two statements may share the same ID within a file.   |
| Valid references             | Every `${id}` must resolve to a statement in the file.   |
| No circular self-reference  | A statement cannot reference its own ID.                 |
| One statement per line      | Each statement occupies exactly one line.                 |
| Valid types                  | Type must be one of `stm`, `unk`, `rsk`, `asm`.          |

## LSP Features

An Axiomate Language Server provides the following capabilities:

### Diagnostics

- **Duplicate ID** — Warning when two statements share the same ID.
- **Unresolved reference** — Error when `${id}` does not match any statement.
- **Self-reference** — Warning when a statement references itself.
- **Invalid type** — Error when the type keyword is not one of `stm`, `unk`, `rsk`, `asm`.

### Go to Definition

Placing the cursor on a `${id}` reference and invoking "Go to Definition" navigates to the statement where that ID is defined.

### Find References

Placing the cursor on a statement ID or a `${id}` reference and invoking "Find References" lists all locations where that statement is referenced.

### Hover

Hovering over a `${id}` reference displays the full text of the referenced statement, including its type.

### Code Action: Generate Statement

A code action that generates a new statement with a unique ID. When triggered:

1. A new unique ID is generated (e.g., incrementing the highest numeric suffix found in the file).
2. A blank statement is inserted with the `stm` type and the cursor positioned at the body.

**Example:** If the file contains `ax1` and `ax2`, the generated statement is:

```axm
stm ax3 =
```

### Autocomplete

Typing `${` inside a statement body triggers autocomplete with a list of all known statement IDs in the file. Completion items show the type (if not `stm`) and body text.

## File Example

```axm
# Peano axioms (informal)
stm pa1 = Zero is a natural number
stm pa2 = Every natural number has a successor which is also a natural number
asm pa3 = Zero is not the successor of any natural number
stm pa4 = If the successors of two numbers are equal then the two numbers are equal
stm pa5 = If a property holds for zero and for the successor of every number for which it holds then it holds for all natural numbers

# A derived statement
stm th1 = Given ${pa1} and ${pa2} we can construct the sequence 0, S(0), S(S(0)), ...

# Open questions
unk q1 = Is there a largest natural number?
```

## Grammar (EBNF)

```ebnf
file       = { line } ;
line       = blank | comment | statement ;
blank      = { whitespace } , newline ;
comment    = "#" , { any_char } , newline ;
statement  = type , whitespace , id , whitespace , "=" , whitespace , body , newline ;
type       = "stm" | "unk" | "rsk" | "asm" ;
id         = id_start , { id_char } ;
id_start   = letter | digit ;
id_char    = letter | digit | "_" | "-" ;
body       = { body_part } ;
body_part  = reference | text ;
reference  = "$" , "{" , id , "}" ;
text       = any_char - "$" ;
```
