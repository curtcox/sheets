import { escapeHTML as e } from "../../util.js";
import { sourceMap } from "../gfm/locations.js";
import { cellOptions } from "./cell-options.js";

const identifier = /^[A-Za-z][\w-]*$/;
const callouts = new Set(["note", "warning", "tip", "important", "caution"]);
function attributes(source, report) {
  const result = { classes: [] };
  const pattern =
    /\s*(?:([.#])([\w-]+)|([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+)))/y;
  let offset = 0;
  while (offset < source.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (!match) {
      if (source.slice(offset).trim())
        report("Unsupported or malformed attributes.");
      break;
    }
    offset = pattern.lastIndex;
    if (match[1] === ".") result.classes.push(match[2]);
    else if (match[1] === "#") {
      if (result.id || !identifier.test(match[2]))
        report("Invalid or repeated identifier.");
      else result.id = match[2];
    } else report(`Unsupported attribute: ${match[3]}.`);
  }
  return result;
}
const blockText = (state, line) =>
  state.src.slice(state.bMarks[line] + state.tShift[line], state.eMarks[line]);

export function quartoStructure(md, diagnostics, lines) {
  md.block.ruler.before(
    "fence",
    "quarto_div",
    (state, start, end, silent) => {
      if (state.sCount[start] - state.blkIndent >= 4) return false;
      const match =
        /^:{3,}(?:\s*(\{.*\}|[A-Za-z][\w-]*)(?:\s*:{3,})?)?\s*$/.exec(
          blockText(state, start),
        );
      if (!match) return false;
      if (silent) return true;
      const token = state.push(
        match[1] ? "quarto_div_open" : "quarto_div_close",
        "",
        0,
      );
      token.map = [start, start + 1];
      token.meta = {
        location: {
          line: start + 1,
          column:
            state.bMarks[start] +
            state.tShift[start] -
            state.src.lastIndexOf("\n", state.bMarks[start]) -
            1,
        },
      };
      if (match[1]) {
        const attrs = match[1].startsWith("{")
          ? match[1].slice(1, -1)
          : `.${match[1]}`;
        Object.assign(
          token.meta,
          attributes(attrs, (message) =>
            diagnostics.push({ ...token.meta.location, message }),
          ),
        );
        const types = token.meta.classes.filter((name) =>
          name.startsWith("callout-"),
        );
        if (
          types.length &&
          (types.length !== 1 || !callouts.has(types[0].slice(8)))
        )
          diagnostics.push({
            ...token.meta.location,
            message:
              "Unsupported callout type; use note, warning, tip, important or caution.",
          });
        token.meta.tag = token.meta.id?.startsWith("fig-")
          ? "figure"
          : types.length === 1 && callouts.has(types[0].slice(8))
            ? "aside"
            : "div";
        if (token.meta.tag === "aside") token.meta.classes.unshift("callout");
      }
      state.line = start + 1;
      return true;
    },
    { alt: ["paragraph", "reference", "blockquote"] },
  );
  md.inline.ruler.before("text", "quarto_reference", (state, silent) => {
    if (
      state.linkLevel ||
      state.src[state.pos] !== "@" ||
      /[\w@]/.test(state.src[state.pos - 1] || "")
    )
      return false;
    const match = /^@fig-[\w-]+/.exec(state.src.slice(state.pos));
    if (!match) return false;
    if (!silent) {
      const token = state.push("quarto_reference", "", 0);
      token.content = match[0];
      token.meta = { sourceStart: state.pos, label: match[0].slice(1) };
    }
    state.pos += match[0].length;
    return true;
  });
  md.inline.ruler.before("text", "quarto_image_attributes", (state, silent) => {
    if (state.tokens.at(-1)?.type !== "image" || state.src[state.pos] !== "{")
      return false;
    const match = /^\{([^}\n]*)\}/.exec(state.src.slice(state.pos));
    if (!match) return false;
    if (!silent)
      state.tokens.at(-1).meta = {
        quartoAttributes: match[1],
        sourceStart: state.pos,
      };
    state.pos += match[0].length;
    return true;
  });
  // Close divs at their Markdown container boundary, never across a list/quote.
  md.core.ruler.after("block", "quarto_div_balance", (state) => {
    const result = [],
      stack = [];
    const close = (location, unclosed = false) => {
      const open = stack.pop();
      if (unclosed)
        diagnostics.push({
          ...open.meta.location,
          message: "Unclosed fenced div; closed at its container boundary.",
        });
      const token = new state.Token("quarto_div_close", "", 0);
      token.meta = open.meta;
      token.map = [location, location];
      const last = result.length - 1;
      if (
        open.meta.tag === "figure" &&
        result[last]?.type === "paragraph_close" &&
        result[last - 1]?.type === "inline" &&
        result[last - 2]?.type === "paragraph_open" &&
        result[last].level === open.level
      ) {
        result[last - 2].tag = result[last].tag = "figcaption";
      }
      result.push(token);
    };
    for (const token of state.tokens) {
      while (
        stack.length &&
        token.nesting === -1 &&
        token.level < stack.at(-1).level
      )
        close(token.map?.[0] ?? lines.length, true);
      if (token.type === "quarto_div_open") stack.push(token);
      if (token.type === "quarto_div_close") {
        if (stack.length && stack.at(-1).level === token.level)
          close(token.map[0]);
        else
          diagnostics.push({
            ...token.meta.location,
            message: "Closing fenced div has no matching opener.",
          });
      } else result.push(token);
    }
    while (stack.length) close(lines.length, true);
    state.tokens = result;
  });
  md.renderer.rules.quarto_div_open = (tokens, i) => {
    const { tag, classes, id, target } = tokens[i].meta;
    return `<${tag}${classes.length ? ` class="${e(classes.join(" "))}"` : ""}${id && (!id.startsWith("fig-") || target) ? ` id="${e(id)}"` : ""}>\n`;
  };
  md.renderer.rules.quarto_div_close = (tokens, i) =>
    `</${tokens[i].meta.tag}>\n`;
  md.renderer.rules.quarto_reference = (tokens, i) => {
    const token = tokens[i];
    return token.meta.target
      ? `<a href="#${e(token.meta.label)}">Figure ${token.meta.target.number}</a>`
      : e(token.content);
  };
  const image = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, i, options, env, self) => {
    const token = tokens[i],
      html = image(tokens, i, options, env, self);
    if (!token.meta?.figure) return html;
    return `<figure${token.meta.target ? ` id="${e(token.meta.id)}"` : ""}>${html}<figcaption>${e(token.content)}</figcaption></figure>`;
  };
}

export function resolveFigures(tokens, outputs, metadata, diagnostics, lines) {
  const labels = new Map(),
    references = [],
    declarations = new Map();
  const declare = (label, owner, location, available) => {
    if (!label?.startsWith("fig-")) return;
    if (label === "fig-") {
      diagnostics.push({
        ...location,
        message: "Figure label needs a name after fig-.",
      });
      return;
    }
    if (declarations.has(label)) {
      diagnostics.push({
        ...location,
        message: `Duplicate figure label ${label}; first declared on line ${declarations.get(label)}.`,
      });
      return;
    }
    declarations.set(label, location.line);
    if (!available) {
      diagnostics.push({
        ...location,
        message: `Figure ${label} has no visible plot output; references remain unresolved.`,
      });
      return;
    }
    const target = { number: labels.size + 1 };
    labels.set(label, target);
    owner.target = target;
  };
  let row,
    cursor = 0,
    rawDepth = 0;
  const views = new Map();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "tr_open") {
      row = token.map?.[0];
      cursor = 0;
    }
    if (token.type === "tr_close") row = undefined;
    if (token.type === "quarto_div_open")
      declare(token.meta.id, token.meta, token.meta.location, true);
    if (token.type === "quarto_cell") {
      const part = token.meta,
        output = outputs.get(part),
        options = part.execution || cellOptions(metadata, part);
      declare(
        part.options.label,
        part,
        part.locations.get("label") || { line: part.line, column: 0 },
        options.include !== false &&
          options.output !== false &&
          !!(output?.figures?.length || output?.images?.length),
      );
    }
    const first = token.map?.[0] ?? row;
    const locationMap =
      token.type === "inline" && first !== undefined
        ? sourceMap(
            token.content,
            lines,
            first,
            row !== undefined ? cursor : 0,
            views,
          )
        : null;
    if (row !== undefined && locationMap) cursor = locationMap.endColumn;
    for (const child of token.children || []) {
      if (child.type === "html_inline") {
        if (/^<\//.test(child.content)) rawDepth = Math.max(0, rawDepth - 1);
        else if (
          /^<[a-z][^>]*>$/i.test(child.content) &&
          !/\/>$|^<(?:img|br|hr|input|wbr)\b/i.test(child.content)
        )
          rawDepth++;
      }
      if (child.type === "quarto_reference" && !rawDepth)
        references.push({
          child,
          location: locationMap?.position(child.meta.sourceStart) || {
            line: 1,
            column: 0,
          },
        });
      if (
        child.type === "image" &&
        child.meta?.quartoAttributes !== undefined
      ) {
        const location = locationMap?.position(child.meta.sourceStart) || {
          line: 1,
          column: 0,
        };
        Object.assign(
          child.meta,
          attributes(child.meta.quartoAttributes, (message) =>
            diagnostics.push({ ...location, message }),
          ),
        );
        const standalone =
          token.children.length === 1 &&
          tokens[i - 1]?.type === "paragraph_open";
        if (child.meta.id?.startsWith("fig-")) {
          if (!standalone)
            diagnostics.push({
              ...location,
              message: "Figure labels require an image in its own paragraph.",
            });
          else {
            child.meta.figure = true;
            tokens[i - 1].hidden = tokens[i + 1].hidden = true;
            declare(child.meta.id, child.meta, location, true);
          }
        }
      }
    }
  }
  for (const { child, location } of references) {
    child.meta.target = labels.get(child.meta.label);
    if (!child.meta.target)
      diagnostics.push({
        ...location,
        message: `Unresolved figure reference: ${child.meta.label}.`,
      });
  }
}
