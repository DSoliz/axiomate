# Axiomate File Format Specification

**Extension:** `.axm`

## Overview

Axiomate (`.axm`) is a plain-text file format for writing and referencing uniquely identified statements. Each statement has a unique ID that other statements can reference, forming a chain of reasoning.

## Syntax

### Statements

A statement is a single line composed of a unique ID followed by the statement body.

```
<id> <body>
```

- `<id>` — A unique identifier. Must be a non-empty string of alphanumeric characters, hyphens, or underscores (`[a-zA-Z0-9_-]+`). Must be unique within the file.
- `<body>` — The rest of the line after the first whitespace separator. Free-form text.

**Example:**

```axm
ax1 All humans are mortal
ax2 Socrates is a human
```

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

## LSP Features

An Axiomate Language Server provides the following capabilities:

### Diagnostics

- **Duplicate ID** — Error when two statements share the same ID.
- **Unresolved reference** — Error when `{id}` does not match any statement.
- **Self-reference** — Warning when a statement references itself.

### Go to Definition

Placing the cursor on a `{id}` reference and invoking "Go to Definition" navigates to the statement where that ID is defined.

### Hover

Hovering over a `{id}` reference displays the full text of the referenced statement.

### Code Action: Generate Statement

A code action that generates a new statement with a unique ID. When triggered:

1. A new unique ID is generated (e.g., incrementing the highest numeric suffix found in the file).
2. A blank statement is inserted with the cursor positioned at the body.

**Example:** If the file contains `ax1` and `ax2`, the generated statement is:

```axm
ax3
```

### Autocomplete

Typing `{` inside a statement body triggers autocomplete with a list of all known statement IDs in the file.

## File Example

```axm
# Peano axioms (informal)
pa1 Zero is a natural number
pa2 Every natural number has a successor which is also a natural number
pa3 Zero is not the successor of any natural number
pa4 If the successors of two numbers are equal then the two numbers are equal
pa5 If a property holds for zero and for the successor of every number for which it holds then it holds for all natural numbers

# A derived statement
th1 Given {pa1} and {pa2} we can construct the sequence 0, S(0), S(S(0)), ...
```

## Grammar (EBNF)

```ebnf
file      = { line } ;
line      = blank | comment | statement ;
blank     = { whitespace } , newline ;
comment   = "#" , { any_char } , newline ;
statement = id , whitespace , body , newline ;
id        = id_char , { id_char } ;
id_char   = letter | digit | "_" | "-" ;
body      = { body_part } ;
body_part = reference | text ;
reference = "{" , id , "}" ;
text      = any_char - "{" ;
```
