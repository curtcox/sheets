import { parseExpression, math } from "../../math.js";
import { createCalca, equality } from "./engine.js";

const conflict = (lines) =>
  new Error(
    `Conflicting relations at lines ${[...new Set(lines)].join(", ")}: no common real solution.`,
  );
const consistent = (left, right, scale) =>
  Math.abs(left - right) <= 64 * Number.EPSILON * scale;
const finite = (value) => typeof value === "number" && Number.isFinite(value);

/** Immutable visible definitions plus bounded checks of connected relations.
 * This is a documented numeric subset, not a general symbolic/system solver.
 */
export function createScopedCalca() {
  let frame = { level: 0, parent: null, definitions: new Map(), relations: [] },
    count = 0,
    work = 0;
  const builtins = new Map();
  const tick = () => {
    if (++work > 12000)
      throw new Error("Scoped calculation exceeds its work limit.");
  };
  function recorded(source, scope, options) {
    if (source.length > 4000) throw new Error("Expression is too long.");
    // Store unresolved names as data dependencies, including names that might
    // collide with a mathjs built-in. Execution is revalidated by createCalca.
    const syntax = math.parse(source),
      locals = new Map(scope);
    let nodes = 0;
    syntax.traverse((n, path, parent) => {
      if (++nodes > 1000) throw new Error("Expression is too complex.");
      if (
        n !== syntax &&
        ["AssignmentNode", "FunctionAssignmentNode"].includes(n.type)
      )
        throw new Error(
          "Nested assignments are unsupported in scoped definitions.",
        );
      if (
        n.type === "SymbolNode" &&
        !(parent?.type === "FunctionNode" && path === "fn") &&
        !locals.has(n.name)
      )
        locals.set(n.name, 0);
    });
    return parseExpression(source, locals, options);
  }
  function builtin(name) {
    if (!builtins.has(name)) {
      try {
        parseExpression(name).evaluate(new Map());
        builtins.set(name, true);
      } catch {
        builtins.set(name, false);
      }
    }
    return builtins.get(name);
  }
  function visible() {
    const chain = [];
    for (let f = frame; f; f = f.parent) chain.unshift(f);
    const definitions = new Map(),
      relations = [];
    for (const f of chain) {
      for (const [name, record] of f.definitions) definitions.set(name, record);
      relations.push(...f.relations);
    }
    return { definitions, relations };
  }
  function scopeFor(definitions, extra) {
    const scope = new Map(
      [...definitions]
        .filter(([, d]) => d.params)
        .map(([name]) => [name, () => {}]),
    );
    if (extra) scope.set(extra, () => {});
    return scope;
  }
  function symbols(node, definitions, params = []) {
    const result = new Set(),
      local = new Set(params);
    node.traverse((n, path, parent) => {
      tick();
      if (n.type !== "SymbolNode" || local.has(n.name)) return;
      if (parent?.type === "FunctionNode" && path === "fn") {
        if (definitions.get(n.name)?.params) result.add(n.name);
        return;
      }
      result.add(n.name);
    });
    return result;
  }
  function component(initial, definitions, relations) {
    const relevant = (names) =>
      [...names].filter((name) => definitions.has(name) || !builtin(name));
    const names = new Set(relevant(initial)),
      selected = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      const include = (items) => {
        for (const name of items)
          if (!names.has(name)) {
            names.add(name);
            changed = true;
          }
      };
      for (const [name, d] of definitions) {
        tick();
        if (
          names.has(name) ||
          [...d.dependencies].some((dep) => names.has(dep))
        )
          include([name, ...relevant(d.dependencies)]);
      }
      for (const r of relations) {
        tick();
        if ([...r.dependencies].some((name) => names.has(name))) {
          selected.add(r);
          include(relevant(r.dependencies));
        }
      }
    }
    return { names, relations: [...selected] };
  }
  function order(names, definitions) {
    const ordered = [],
      done = new Set(),
      visiting = new Set();
    function visit(name, depth = 0) {
      tick();
      if (done.has(name) || !definitions.has(name)) return;
      if (visiting.has(name))
        throw new Error(`Circular definition involving ${name}.`);
      if (depth > 32)
        throw new Error("Definition dependency depth exceeds 32.");
      visiting.add(name);
      const d = definitions.get(name);
      for (const dependency of d.dependencies) visit(dependency, depth + 1);
      visiting.delete(name);
      done.add(name);
      ordered.push(d);
    }
    for (const name of names) visit(name);
    return ordered;
  }
  function context(ordered, relations, binding) {
    const run = createCalca();
    for (const d of ordered) {
      tick();
      run(d.source);
    }
    for (const r of relations) {
      tick();
      run(`0 = (${r.left}) - (${r.right})`);
    }
    if (binding) run(`${binding.name}=${binding.value}`);
    return (source) => {
      tick();
      return run(source);
    };
  }
  function grounded(names, definitions, ordered = order(names, definitions)) {
    return [...names, ...ordered.flatMap((d) => [...d.dependencies])].every(
      (name) => definitions.has(name) || builtin(name),
    );
  }
  // Carry a magnitude through arithmetic so cancellation against zero does not
  // reject rounded polynomial roots. There is deliberately no absolute floor:
  // a tiny equation gets a correspondingly tiny rounding allowance.
  function magnitude(
    node,
    run,
    definitions,
    trail = new Set(),
    depth = 0,
    locals = new Map(),
  ) {
    tick();
    if (depth > 32) throw new Error("Relation magnitude depth exceeds 32.");
    const source = (n) =>
      n
        .transform((child) =>
          child.type === "SymbolNode" && locals.has(child.name)
            ? new math.ConstantNode(locals.get(child.name))
            : child,
        )
        .toString();
    const value = (n) => Math.abs(run(source(n)));
    const next = (n, args = locals) =>
      magnitude(n, run, definitions, trail, depth + 1, args);
    if (node.type === "ParenthesisNode") return next(node.content);
    if (node.type === "SymbolNode" && !locals.has(node.name)) {
      const d = definitions.get(node.name);
      if (d && !d.params && !trail.has(node.name))
        return magnitude(
          d.body,
          run,
          definitions,
          new Set([...trail, node.name]),
          depth + 1,
        );
    }
    if (node.type === "OperatorNode") {
      const args = node.args.map((n) => next(n));
      if (["+", "-"].includes(node.op)) return args.reduce((a, b) => a + b, 0);
      if (node.op === "*") return args.reduce((a, b) => a * b, 1);
      if (node.op === "/") return args[0] / value(node.args[1]);
      if (node.op === "^") {
        const exponent = run(source(node.args[1]));
        if (typeof exponent === "number" && exponent >= 0)
          return args[0] ** exponent;
      }
    }
    if (node.type === "FunctionNode") {
      const d = definitions.get(node.fn.name);
      if (d?.params && d.params.length === node.args.length) {
        const args = new Map();
        for (let i = 0; i < d.params.length; i++)
          args.set(d.params[i], run(source(node.args[i])));
        return next(d.body, args);
      }
    }
    return value(node);
  }
  function relationValues(run, relation, definitions) {
    const left = run(relation.left),
      right = run(relation.right);
    if (!finite(left) || !finite(right))
      throw new Error(
        `Relation at line ${relation.line} requires real scalar values; symbolic, unit-valued and general system solving are unsupported.`,
      );
    let scale = Math.max(Math.abs(left), Math.abs(right));
    if (!grounded(relation.dependencies, definitions))
      scale = Math.max(
        scale,
        magnitude(relation.lhs, run, definitions),
        magnitude(relation.rhs, run, definitions),
      );
    if (!finite(scale)) throw new Error("Relation exceeds numeric precision.");
    return consistent(left, right, scale);
  }
  function evaluate(source, node, state) {
    const initial = symbols(node, state.definitions),
      group = component(initial, state.definitions, state.relations);
    const ordered = order(group.names, state.definitions),
      run = context(ordered, group.relations);
    let value;
    try {
      value = run(source);
    } catch (error) {
      if (
        node.type === "SymbolNode" &&
        !state.definitions.has(node.name) &&
        group.relations.length === 0 &&
        error.message === `Undefined symbol ${node.name}`
      )
        return node.name;
      throw new Error(
        `${error.message} Symbolic dependencies and general system solving are not supported in this profile.`,
      );
    }
    if (typeof value === "number" && !finite(value))
      throw new Error("Expected a finite result.");
    if (!group.relations.length) return value;
    if (Array.isArray(value) && node.type === "SymbolNode") {
      if (!value.length) {
        if (group.relations.length > 1)
          throw conflict(group.relations.map((r) => r.line));
        return value;
      }
      const candidates = [];
      for (const candidate of value) {
        if (!finite(candidate)) throw new Error("Expected real scalar roots.");
        const check = context(ordered, group.relations, {
          name: node.name,
          value: candidate,
        });
        if (
          group.relations.every((r) =>
            relationValues(check, r, state.definitions),
          )
        )
          candidates.push(candidate);
      }
      if (!candidates.length)
        throw conflict(group.relations.map((r) => r.line));
      return candidates.length === 1 ? candidates[0] : candidates;
    }
    for (const relation of group.relations)
      if (!relationValues(run, relation, state.definitions))
        throw conflict(group.relations.map((r) => r.line));
    return value;
  }
  function calculate(source, { line = 1, query = true } = {}) {
    work = 0;
    const state = visible(),
      scope = scopeFor(state.definitions),
      at = equality(source);
    if (at < 0) return evaluate(source, recorded(source, scope), state);
    if (++count > 256)
      throw new Error(
        "At most 256 definitions and relations are supported per document.",
      );
    const left = source.slice(0, at).trim(),
      right = source.slice(at + 1).trim();
    const functionName =
      /^([\p{L}_$][\p{L}\p{N}_$]*)\s*\(\s*(?:[\p{L}_$][\p{L}\p{N}_$]*\s*(?:,\s*[\p{L}_$][\p{L}\p{N}_$]*\s*)*)?\)$/u.exec(
        left,
      )?.[1];
    let declaration;
    if (functionName && !state.definitions.has(functionName)) {
      declaration = recorded(
        source,
        scopeFor(state.definitions, functionName),
        { assign: true },
      );
      if (declaration.type !== "FunctionAssignmentNode")
        throw new Error("Unsupported function equation.");
      const record = {
        name: declaration.name,
        params: declaration.params,
        body: declaration.expr,
        source,
        line,
      };
      state.definitions.set(record.name, record);
      record.dependencies = symbols(
        declaration.expr,
        state.definitions,
        record.params,
      );
      frame.definitions.set(record.name, record);
      order([record.name], state.definitions);
      return source;
    }
    const lhs = recorded(left, scope),
      rhs = recorded(right, scope);
    if (lhs.type === "SymbolNode" && !state.definitions.has(lhs.name)) {
      recorded(source, scope, { assign: true });
      const record = { name: lhs.name, source, body: rhs, line };
      state.definitions.set(record.name, record);
      record.dependencies = symbols(rhs, state.definitions);
      frame.definitions.set(record.name, record);
      order([record.name], state.definitions);
      return query ? evaluate(lhs.name, lhs, state) : source;
    }
    const relation = {
      left,
      right,
      lhs,
      rhs,
      line,
      dependencies: new Set([
        ...symbols(lhs, state.definitions),
        ...symbols(rhs, state.definitions),
      ]),
    };
    frame.relations.push(relation);
    state.relations.push(relation);
    // Report contradictions that can already be checked without solving. Other
    // relations stay deferred until a query supplies the required dependencies.
    const ordered = order(relation.dependencies, state.definitions);
    if (grounded(relation.dependencies, state.definitions, ordered)) {
      const run = context(ordered, []);
      try {
        if (!relationValues(run, relation, state.definitions))
          throw conflict([...ordered.map((d) => d.line), line]);
      } catch (error) {
        if (!error.message.startsWith("Undefined symbol")) throw error;
      }
    }
    return query && lhs.type === "SymbolNode"
      ? evaluate(left, lhs, state)
      : source;
  }
  calculate.heading = (level) => {
    while (frame.parent && frame.level >= level) frame = frame.parent;
    frame = { level, parent: frame, definitions: new Map(), relations: [] };
  };
  return calculate;
}
