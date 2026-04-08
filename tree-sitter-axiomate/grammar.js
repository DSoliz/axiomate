/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "axiomate",

  extras: ($) => [],

  rules: {
    source_file: ($) => repeat(choice($.statement, $.comment, /\n/)),

    comment: ($) => token(seq(/[ \t]*#/, /[^\n]*/)),

    statement: ($) => seq($.identifier, / /, $.body, /\n?/),

    identifier: ($) => /[a-zA-Z0-9][a-zA-Z0-9_-]*/,

    body: ($) => repeat1(choice($.reference, $.text)),

    reference: ($) => seq("{", $.reference_id, "}"),

    reference_id: ($) => /[a-zA-Z0-9_-]+/,

    text: ($) => /[^\{\n]+/,
  },
});
