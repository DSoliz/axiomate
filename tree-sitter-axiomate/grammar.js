/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "axiomate",

  extras: ($) => [],

  rules: {
    source_file: ($) => repeat(choice($.statement, $.comment, $.error_line, /\n/)),

    comment: ($) => token(seq(/[ \t]*#/, /[^\n]*/)),

    // A line that doesn't match statement or comment — consumed to prevent
    // expensive error recovery on partial edits
    error_line: ($) => token(prec(-1, seq(/[^\n#]/, /[^\n]*/))),

    statement: ($) =>
      seq(
        $.statement_head,
        $.body,
        /\n?/,
      ),

    // Tokenize "type id = " as a single atomic token to avoid
    // ambiguity with text during error recovery
    statement_head: ($) =>
      token(prec(1, seq(/[a-zA-Z]+/, / /, /[a-zA-Z0-9][a-zA-Z0-9_-]*/, / = /))),

    body: ($) => repeat1(choice($.reference, $.text)),

    reference: ($) => seq("$", token.immediate("{"), token.immediate(/[a-zA-Z0-9_-]+/), token.immediate("}")),

    text: ($) => /[^\$\n]+/,
  },
});
