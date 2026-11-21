import { MAX_CALC_LENGTH, MAX_DEPTH, MAX_NODES, fail } from "./calc-number.js";

// --- Parser: calc-aent.el math-read-expr-level with
// calc-multiplication-has-precedence (Org's Emacs default). ---
const INFIX = {
  "^": [201, 200],
  "**": [201, 200],
  "*": [196, 195],
  "2x": [196, 195],
  "/": [190, 191],
  "%": [190, 191],
  "\\": [190, 191],
  "+": [180, 181],
  "-": [180, 181],
  "<": [160, 161],
  ">": [160, 161],
  "<=": [160, 161],
  ">=": [160, 161],
  "=": [160, 161],
  "==": [160, 161],
  "!=": [160, 161],
};
const comparisons = new Set(["<", ">", "<=", ">=", "=", "==", "!="]);
function tokenize(source) {
  if (source.length > MAX_CALC_LENGTH) fail("Formula is too long.");
  const tokens = [],
    pattern =
      /\s+|(\uE000(\d+)\uE001)|((?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)|([A-Za-z][A-Za-z0-9]*)|(\*\*|!!|<=|>=|==|!=|[-+*/%\\^!(),\[\]<>=])/y;
  let at = 0;
  while (at < source.length) {
    pattern.lastIndex = at;
    const m = pattern.exec(source);
    if (!m)
      fail(`Unsupported Calc syntax near "${source.slice(at, at + 12)}".`);
    at = pattern.lastIndex;
    if (m[1]) tokens.push({ type: "ref", value: Number(m[2]) });
    else if (m[3]) tokens.push({ type: "number", value: m[3] });
    else if (m[4]) tokens.push({ type: "name", value: m[4] });
    else if (m[5]) tokens.push({ type: "op", value: m[5] });
  }
  return tokens;
}
export function parseCalc(source, { onDivisionProduct } = {}) {
  const tokens = tokenize(source);
  // Advisory metadata stays outside the arithmetic tree. Parentheses mark
  // explicit grouping; only ungrouped products containing an explicit * count.
  const grouped = new WeakSet(),
    explicitProducts = new WeakSet();
  let i = 0,
    nodes = 0,
    depth = 0,
    divisionProduct = false;
  const peek = () => tokens[i],
    isOp = (v) => tokens[i]?.type === "op" && tokens[i].value === v;
  const node = (n) => {
    if (++nodes > MAX_NODES) fail("Formula is too complex.");
    return n;
  };
  const startsFactor = (t) =>
    t && (t.type !== "op" || ["(", "[", "-", "+"].includes(t.value));
  function level(minPrec) {
    if (++depth > MAX_DEPTH) fail("Formula nesting is too deep.");
    let x = factor(),
      first = true;
    for (;;) {
      const t = peek();
      let op = null,
        lp,
        rp;
      if (t?.type === "op") {
        if (t.value === "!" || t.value === "!!") {
          if (210 < minPrec) break;
          i++;
          x = node({ type: "fact", step: t.value === "!" ? 1n : 2n, arg: x });
          continue;
        }
        if (t.value === "%" && !startsFactor(tokens[i + 1])) {
          if (1100 < minPrec) break;
          i++;
          x = node({ type: "percent", arg: x });
          continue;
        }
        if (INFIX[t.value]) [op, lp, rp] = [t.value, ...INFIX[t.value]];
        else if (t.value === "(" || t.value === "[")
          [op, lp, rp] = ["2x", ...INFIX["2x"]];
      } else if (t) [op, lp, rp] = ["2x", ...INFIX["2x"]];
      if (!op || lp < minPrec) break;
      if (op !== "2x") i++;
      const y = level(rp);
      if (comparisons.has(op)) {
        if (op === "=") op = "==";
        // calc-prog.el math-composite-inequalities: parentheses start a new
        // level, so (3>2)>1 compares a Boolean rather than forming an interval.
        if (!first && x.type === "compare") {
          if ((op === "==" || op === "!=") && x.op === op)
            x = node({ ...x, args: [...x.args, y] });
          else if (
            (["<", "<="].includes(op) && ["<", "<="].includes(x.op)) ||
            ([">", ">="].includes(op) && [">", ">="].includes(x.op))
          )
            x = node({
              type: "between",
              ops: [x.op, op],
              args: [...x.args, y],
            });
          else fail("Invalid mixed Calc comparison chain; use parentheses.");
        } else x = node({ type: "compare", op, args: [x, y] });
      } else {
        const product = op === "*" || (op === "2x" && [x, y].some(
          (child) => explicitProducts.has(child) && !grouped.has(child),
        ));
        if (op === "/" && explicitProducts.has(y) && !grouped.has(y))
          divisionProduct = true;
        x = node({
          type: "binary",
          op: op === "2x" ? "*" : op === "**" ? "^" : op,
          args: [x, y],
        });
        if (product) explicitProducts.add(x);
      }
      first = false;
    }
    depth--;
    return x;
  }
  function factor() {
    const t = tokens[i++];
    if (!t) fail("Incomplete Calc formula.");
    if (t.type === "number") return node({ type: "number", value: t.value });
    if (t.type === "ref") return node({ type: "ref", index: t.value });
    if (t.type === "name") {
      if (isOp("(")) {
        i++;
        const args = [];
        if (!isOp(")"))
          for (;;) {
            args.push(level(0));
            if (isOp(",")) {
              i++;
              continue;
            }
            break;
          }
        if (!isOp(")")) fail(`Missing ) after ${t.value}(...).`);
        i++;
        return node({ type: "call", name: t.value, args });
      }
      return node({ type: "symbol", name: t.value });
    }
    if (t.value === "-") return node({ type: "neg", arg: level(197) });
    if (t.value === "+") return level(197);
    if (t.value === "(") {
      const x = level(0);
      if (isOp(","))
        fail(
          "Calc reads (a, b) as a complex number; complex values are unsupported.",
        );
      if (!isOp(")")) fail("Missing ).");
      i++;
      grouped.add(x);
      return x;
    }
    if (t.value === "[") {
      const items = [];
      if (!isOp("]"))
        for (;;) {
          items.push(level(0));
          if (isOp(",")) {
            i++;
            continue;
          }
          break;
        }
      if (!isOp("]")) fail("Missing ].");
      i++;
      return node({ type: "vector", items });
    }
    fail(`Unexpected ${t.value} in Calc formula.`);
  }
  const tree = level(0);
  if (i < tokens.length) fail(`Unexpected ${tokens[i].value} in Calc formula.`);
  if (divisionProduct) onDivisionProduct?.();
  return tree;
}

export const arity = (name) =>
  name === "arctan2"
    ? [2, 2]
    : name === "log" || name === "round"
      ? [1, 2]
      : name === "min" || name === "max" || name.startsWith("v")
        ? [0, Infinity]
        : [1, 1];
