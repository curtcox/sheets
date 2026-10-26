// Project-owned lexical highlighting. These modes do not validate or execute source.
const number =
  /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|(?:\d[\d_]*(?:\.\d[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?)/;
const identifier =
  /[A-Za-z_\u00c0-\u02ff\u0370-\u03ff][\w\u00c0-\u02ff\u0370-\u03ff]*/;
const operators = /->|→|=>|==|!=|<=|>=|&&|\|\||[+*/^%=<>!?:~−×÷≤≥≠-]/;
const quotedString = (quote) => [
  { token: "constant.language.escape", regex: /\\./ },
  { token: "string", regex: quote, next: "pop" },
  { defaultToken: "string" },
];
const expression = () => [
  { token: "string", regex: '"', push: quotedString('"') },
  { token: "string", regex: "'", push: quotedString("'") },
  { token: "constant.numeric", regex: number },
  { token: "keyword.operator", regex: operators },
  { token: "paren.lparen", regex: /[([{]/ },
  { token: "paren.rparen", regex: /[)\]}]/ },
  { token: "variable", regex: identifier },
];
function numbatRules() {
  return {
    start: [
      { token: "comment", regex: /#.*/ },
      {
        token: "keyword",
        regex: /\b(?:let|fn|unit|dimension|use|mod|if|then|else|per|to)\b/,
      },
      { token: "constant.language", regex: /\b(?:true|false|NaN|inf)\b/ },
      { token: "storage.type", regex: /\b(?:Bool|String|DateTime|Fn)\b/ },
      { token: "storage.type", regex: /@[A-Za-z_]+/ },
      ...expression(),
    ],
  };
}
function beancountRules() {
  return {
    start: [
      { token: "comment", regex: /;.*/ },
      { token: "constant.numeric.date", regex: /\b\d{4}-\d{2}-\d{2}\b/ },
      {
        token: "keyword",
        regex:
          /\b(?:option|open|close|commodity|txn|balance|pad|price|note|event|include|plugin|pushtag|poptag|pushmeta|popmeta)\b/,
      },
      { token: "string", regex: '"', push: quotedString('"') },
      {
        token: "variable",
        regex: /\b[A-Z][A-Za-z0-9-]*(?::[A-Z][A-Za-z0-9-]*)+/,
      },
      { token: "variable.parameter", regex: /\b[a-z][\w-]*:/ },
      { token: "constant.numeric", regex: /[+-]?(?:\d[\d,]*(?:\.\d*)?|\.\d+)/ },
      { token: "support.type", regex: /\b[A-Z][A-Z0-9._'-]*\b/ },
      { token: "entity.name.tag", regex: /[#^][\w/-]+/ },
      { token: "keyword.operator", regex: /@@?|[*!{}]/ },
    ],
  };
}
function orgRules() {
  return {
    start: [
      { token: "markup.heading", regex: /^\*+\s+.*/ },
      {
        token: "keyword",
        regex: /^\s*#\+BEGIN_SRC\b.*/,
        caseInsensitive: true,
        next: "org-source",
      },
      {
        token: "keyword",
        regex: /^\s*#\+TBLFM:/,
        caseInsensitive: true,
        next: "org-formula",
      },
      { token: "keyword", regex: /^\s*#\+[\w-]+:/ },
      { token: "comment", regex: /^\s*#(?:\s.*)?$/ },
      { token: "punctuation.operator", regex: /^\s*\|[-+|]+\|\s*$/ },
      { token: "punctuation.operator", regex: /\|/ },
      { token: "constant.numeric", regex: number },
      { token: "markup.underline", regex: /\[\[[^\]]+\](?:\[[^\]]*\])?\]/ },
      { token: "markup.bold", regex: /\*[^*\n]+\*/ },
      { token: "markup.italic", regex: /\/[^/\n]+\// },
      { token: "markup.raw", regex: /[=~][^=~\n]+[=~]/ },
    ],
    "org-formula": [
      { token: "text", regex: /$/, next: "start" },
      { token: "variable", regex: /\$[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)?/ },
      { token: "variable", regex: /[@$](?:[+-]?\d+|[<>]|I+)/ },
      {
        token: "support.function",
        regex:
          /\b(?:vsum|vmean|vmin|vmax|vcount|vprod|sqrt|sin|cos|tan|abs|round)\b/,
      },
      { token: "keyword.operator", regex: /::|\.\.|[=+*/^;%-]/ },
      { token: "constant.numeric", regex: number },
    ],
    "org-source": [
      {
        token: "keyword",
        regex: /^\s*#\+END_SRC\b.*/,
        caseInsensitive: true,
        next: "start",
      },
      { defaultToken: "markup.raw" },
    ],
  };
}
function addHurmetRules(rules) {
  // Preserve Markdown prose, fenced code and its return states around calculations.
  for (const state of ["start", "header", "listblock", "blockquote"]) {
    rules[state].unshift(
      { token: "constant.language.escape", regex: /\\[¢`]/ },
      { token: "keyword", regex: /¢¢/, push: "hurmet-display" },
      { token: "keyword", regex: /¢`/, push: "hurmet-inline" },
      { token: "keyword", regex: /¢/, push: "hurmet-paired" },
    );
  }
  for (const [state, end] of [
    ["display", /¢¢/],
    ["inline", /`/],
    ["paired", /¢/],
  ])
    rules[`hurmet-${state}`] = [
      { token: "keyword", regex: end, next: "pop" },
      ...expression(),
    ];
}
const modes = new Map();
const custom = new Set(["numbat", "beancount", "org", "hurmet"]);
export async function loadEditorMode(ace, id) {
  const name = id.replace(/^ace\/mode\//, "");
  if (!custom.has(name)) return id;
  if (!modes.has(id))
    modes.set(
      id,
      createMode(ace, name).catch((error) => {
        modes.delete(id);
        throw error;
      }),
    );
  return modes.get(id);
}
async function createMode(ace, name) {
  if (name === "hurmet")
    await new Promise((resolve, reject) =>
      ace.config.loadModule("ace/mode/markdown", (module) =>
        module
          ? resolve()
          : reject(new Error("Markdown editor mode could not load.")),
      ),
    );
  const { Mode: BaseMode } = ace.require(
    `ace/mode/${name === "hurmet" ? "markdown" : "text"}`,
  );
  const BaseRules = ace.require(
    name === "hurmet"
      ? "ace/mode/markdown_highlight_rules"
      : "ace/mode/text_highlight_rules",
  )[name === "hurmet" ? "MarkdownHighlightRules" : "TextHighlightRules"];
  class HighlightRules extends BaseRules {
    constructor() {
      super();
      if (name === "hurmet") addHurmetRules(this.$rules);
      else
        this.$rules = {
          numbat: numbatRules,
          beancount: beancountRules,
          org: orgRules,
        }[name]();
      this.normalizeRules();
    }
  }
  const mode = new BaseMode();
  mode.HighlightRules = HighlightRules;
  mode.$id = `ace/mode/${name}`;
  if (name !== "hurmet")
    mode.lineCommentStart = { numbat: "#", beancount: ";", org: "#" }[name];
  return mode;
}
