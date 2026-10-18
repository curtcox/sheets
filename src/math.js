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
/** Constrain the mathjs language to calculation syntax. No imports or object access. */
export function parseExpression(
  expression,
  scope = new Map(),
  { assign = false } = {},
) {
  if (expression.length > 4000) throw new Error("Expression is too long.");
  const node = math.parse(expression);
  let count = 0;
  node.traverse((n) => {
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
    if (
      n.type === "ConstantNode" &&
      typeof n.value === "number" &&
      !Number.isFinite(n.value)
    )
      throw new Error("Expected a finite number.");
    if (
      n.type === "AssignmentNode" &&
      n.object?.name &&
      /^(?:import|evaluate|parse|compile|createUnit|config|constructor|__proto__)$/.test(
        n.object.name,
      )
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
