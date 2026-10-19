import * as math from "../vendor/mathjs.js";
export { math };
const allowed = new Set([
  "abs",
  "sqrt",
  "cbrt",
  "exp",
  "log",
  "log10",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "atan2",
  "sinh",
  "cosh",
  "tanh",
  "floor",
  "ceil",
  "round",
  "min",
  "max",
  "sum",
  "mean",
  "median",
  "prod",
  "size",
  "det",
  "transpose",
  "inv",
  "dot",
  "cross",
  "norm",
  "concat",
  "simplify",
  "derivative",
  "number",
  "unit",
]);
const reserved =
  /^(?:import|evaluate|parse|compile|createUnit|config|constructor|__proto__)$/;
/** Constrain the mathjs language to calculation syntax. No imports or object access. */
export function parseExpression(
  expression,
  scope = new Map(),
  { assign = false, target = false } = {},
) {
  if (expression.length > 4000) throw new Error("Expression is too long.");
  const node = math.parse(expression);
  const parameters =
    node.type === "FunctionAssignmentNode" ? new Set(node.params) : new Set();
  let count = 0;
  node.traverse((n, path, parent) => {
    if (++count > 1000) throw new Error("Expression is too complex.");
    if (
      ["AccessorNode", "ObjectNode", "BlockNode", "RangeNode"].includes(n.type)
    )
      throw new Error(
        `${n.type.replace("Node", "")} expressions are unsupported.`,
      );
    if (
      ["AssignmentNode", "FunctionAssignmentNode"].includes(n.type) &&
      !assign
    )
      throw new Error("Assignment is not allowed in a formula.");
    if (n.type === "FunctionNode" && n.fn?.type !== "SymbolNode")
      throw new Error("Only named functions are supported.");
    if (
      n.type === "FunctionNode" &&
      !allowed.has(n.fn.name) &&
      typeof scope.get(n.fn.name) !== "function"
    )
      throw new Error(`Unsupported function: ${n.fn.name}`);
    // A function value can be called through a user-function parameter. Apply the
    // same allowlist to bare built-ins, not just direct FunctionNode calls.
    if (n.type === "SymbolNode" && reserved.test(n.name))
      throw new Error("Reserved variable or function name.");
    if (
      n.type === "SymbolNode" &&
      !(target && n === node) &&
      !(parent?.type === "AssignmentNode" && parent.object === n) &&
      !parameters.has(n.name) &&
      !scope.has(n.name) &&
      typeof math[n.name] === "function" &&
      !allowed.has(n.name)
    )
      throw new Error(`Unsupported function: ${n.name}`);
    if (
      n.type === "FunctionAssignmentNode" &&
      (reserved.test(n.name) || n.params.some((name) => reserved.test(name)))
    )
      throw new Error("Reserved function or parameter name.");
    if (
      n.type === "ConstantNode" &&
      typeof n.value === "number" &&
      !Number.isFinite(n.value)
    )
      throw new Error("Expected a finite number.");
    if (
      n.type === "AssignmentNode" &&
      n.object?.name &&
      reserved.test(n.object.name)
    )
      throw new Error("Reserved variable name.");
  });
  return node;
}
export function evaluate(expression, scope = new Map(), options = {}) {
  return parseExpression(expression, scope, options).evaluate(scope);
}
export function formatValue(value) {
  return typeof value === "string"
    ? value
    : math.format(value, { precision: 12 });
}
