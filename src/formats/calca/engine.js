import { parseExpression } from "../../math.js";

// Equations use a single top-level '='; comparisons and strings remain expressions.
export function equality(source) {
  let depth = 0,
    quote = "",
    at = -1;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (
      c === "=" &&
      depth === 0 &&
      !/[<>=!]/.test(source[i - 1] || " ") &&
      source[i + 1] !== "="
    ) {
      if (at !== -1) throw new Error("Use one equation per line.");
      at = i;
    }
  }
  return at;
}
const unsupported = () =>
  new Error(
    "Equation solving supports real scalar linear and quadratic polynomials only.",
  );
const missing = (name) => new Error(`Undefined symbol ${name}`);
function finite(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw unsupported();
  return value;
}
function trim(p) {
  p.forEach(finite);
  while (p.length > 1 && p.at(-1) === 0) p.pop();
  return p;
}
function add(a, b, sign = 1) {
  return trim(
    Array.from(
      { length: Math.max(a.length, b.length) },
      (_, i) => (a[i] || 0) + sign * (b[i] || 0),
    ),
  );
}
function multiply(a, b) {
  if (a.length + b.length > 4) throw unsupported();
  const p = Array(a.length + b.length - 1).fill(0);
  a.forEach((x, i) => b.forEach((y, j) => (p[i + j] += x * y)));
  return trim(p);
}
function roots(p, name) {
  if (p.length === 1) {
    if (p[0] !== 0) return [];
    throw new Error(
      `Infinitely many solutions for ${name}; add an independent value.`,
    );
  }
  if (p.length === 2) return finite(-p[0] / p[1]);
  // Scale before computing the discriminant, and avoid subtracting near-equal roots.
  const scale = Math.max(...p.map(Math.abs)),
    [c, b, a] = p.map((x) => x / scale);
  if (
    [c, b, a].some((value, i) => value === 0 && p[i] !== 0) ||
    (b !== 0 && b * b === 0) ||
    (c !== 0 && a * c === 0)
  )
    throw new Error("Equation coefficients exceed numeric precision.");
  let d = b * b - 4 * a * c;
  const tolerance = 16 * Number.EPSILON * (b * b + Math.abs(4 * a * c));
  if (d < 0 && d >= -tolerance) d = 0;
  if (d < 0) return [];
  if (d === 0) return finite(-b / (2 * a));
  const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(d));
  return [finite(q / a), finite(c / q)].sort((x, y) => x - y);
}

/** A fresh, bounded, DOM-free calculation context for one Calca document. */
export function createCalca() {
  const scope = new Map(),
    definitions = new Map(),
    equations = [];
  let remaining = 12000;
  function solve(name) {
    let failure;
    for (const [left, right] of equations.toReversed()) {
      const mentions = (node, trail = new Set()) => {
        if (--remaining < 0 || trail.size > 32)
          throw new Error("Equation is too complex to solve.");
        if (node.type === "SymbolNode") {
          if (node.name === name) return true;
          if (
            !scope.has(node.name) &&
            definitions.has(node.name) &&
            !trail.has(node.name)
          )
            return mentions(
              definitions.get(node.name),
              new Set([...trail, node.name]),
            );
        }
        return (
          node.type !== "SymbolNode" &&
          node
            .filter((n) => n !== node && n.type === "SymbolNode")
            .some((n) => mentions(n, trail))
        );
      };
      if (!mentions(left) && !mentions(right)) continue;
      let contains = false;
      const expand = (node, trail = new Set(), depth = 0) => {
        if (--remaining < 0 || depth > 32)
          throw new Error("Equation is too complex to solve.");
        const next = (n) => expand(n, trail, depth + 1);
        if (node.type === "ParenthesisNode") return next(node.content);
        if (node.type === "ConstantNode") return [finite(node.value)];
        if (node.type === "SymbolNode") {
          if (node.name === name) {
            contains = true;
            return [0, 1];
          }
          if (scope.has(node.name)) return [finite(scope.get(node.name))];
          if (definitions.has(node.name)) {
            if (trail.has(node.name))
              throw new Error("Circular equation definitions.");
            return expand(
              definitions.get(node.name),
              new Set([...trail, node.name]),
              depth + 1,
            );
          }
          // Built-in real constants such as pi are allowed; unknowns stay unknown.
          return [finite(node.evaluate(scope))];
        }
        if (node.type === "OperatorNode") {
          const args = node.args.map(next),
            [a, b] = args;
          if (node.op === "+") return args.length === 1 ? a : add(a, b);
          if (node.op === "-")
            return args.length === 1 ? a.map((x) => -x) : add(a, b, -1);
          if (node.op === "*") return multiply(a, b);
          if (node.op === "/" && b.length === 1 && b[0] !== 0)
            return trim(a.map((x) => x / b[0]));
          if (node.op === "^" && b.length === 1 && [0, 1, 2].includes(b[0]))
            return b[0] === 0 ? [1] : b[0] === 1 ? a : multiply(a, a);
          throw unsupported();
        }
        if (node.type === "FunctionNode") {
          // Constant calls are fine; inversion of functions is deliberately unsupported.
          const args = node.args.map(next);
          if (args.some((p) => p.length !== 1)) throw unsupported();
          const local = new Map(scope);
          node.args.forEach((arg, i) => local.set(`calcaArg${i}`, args[i][0]));
          const call = `${node.fn.name}(${args.map((_, i) => `calcaArg${i}`).join(",")})`;
          return [finite(parseExpression(call, local).evaluate(local))];
        }
        throw unsupported();
      };
      try {
        const polynomial = add(expand(left), expand(right), -1);
        if (contains) return roots(polynomial, name);
      } catch (error) {
        // Earlier independent equations can still resolve this query.
        failure ||= error;
      }
      if (remaining < 0) throw new Error("Equation is too complex to solve.");
    }
    throw failure || missing(name);
  }
  function resolve(name, trail = new Set()) {
    if (--remaining < 0) throw new Error("Equation is too complex to solve.");
    if (scope.has(name)) return scope.get(name);
    if (trail.has(name) || trail.size >= 32)
      throw new Error("Circular or overly deep equation definitions.");
    if (definitions.has(name)) {
      try {
        return run(definitions.get(name), new Set([...trail, name]));
      } catch (error) {
        if (!/^(?:Undefined symbol |Circular )/.test(error.message))
          throw error;
      }
    }
    return solve(name);
  }
  function run(node, trail = new Set()) {
    const local = new Map(scope);
    for (let i = 0; i < 64; i++) {
      if (--remaining < 0) throw new Error("Equation is too complex to solve.");
      try {
        return node.evaluate(local);
      } catch (error) {
        const name = /^Undefined symbol (\S+)$/.exec(error.message)?.[1];
        if (!name || local.has(name)) throw error;
        const value = resolve(name, trail);
        if (Array.isArray(value))
          throw new Error(
            `${name} has ${value.length} real solutions; query ${name} directly.`,
          );
        local.set(name, value);
      }
    }
    throw new Error("Expression has too many unresolved variables.");
  }
  return (source) => {
    remaining = 12000;
    if (source.length > 4000) throw new Error("Expression is too long.");
    const at = equality(source);
    if (at !== -1) {
      if (
        /^\s*[\p{L}_$][\p{L}\p{N}_$]*\s*\(\s*(?:[\p{L}_$][\p{L}\p{N}_$]*\s*(?:,\s*[\p{L}_$][\p{L}\p{N}_$]*\s*)*)?\)\s*$/u.test(
          source.slice(0, at),
        )
      ) {
        // Function definitions retain mathjs's existing semantics and closures.
        const declaration = parseExpression(source, scope, { assign: true });
        if (declaration.type !== "FunctionAssignmentNode") throw unsupported();
        return declaration.evaluate(scope);
      }
      const left = parseExpression(source.slice(0, at), scope, {
          target: true,
        }),
        right = parseExpression(source.slice(at + 1), scope);
      if (equations.length >= 256)
        throw new Error("At most 256 equations are supported per document.");
      let value = source;
      if (left.type === "SymbolNode") {
        // Validate reserved names using the same assignment guard as other formats.
        parseExpression(source, scope, { assign: true });
        try {
          value = right.evaluate(scope);
          scope.set(left.name, value);
          definitions.delete(left.name);
        } catch (error) {
          if (!/^Undefined symbol /.test(error.message)) throw error;
          scope.delete(left.name);
          definitions.set(left.name, right);
        }
      }
      equations.push([left, right]);
      return value;
    }
    const node = parseExpression(source, scope, { assign: true });
    if (node.type === "SymbolNode" && !scope.has(node.name)) {
      // Preserve built-in constants and units before attempting equation solving.
      try {
        return node.evaluate(scope);
      } catch (error) {
        if (!/^Undefined symbol /.test(error.message)) throw error;
        return resolve(node.name);
      }
    }
    return run(node);
  };
}
