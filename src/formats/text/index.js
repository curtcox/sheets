import { plugin } from "../registry.js";
import { escapeHTML } from "../../util.js";
export default plugin("text", async (src) => ({
  html: `<pre>${escapeHTML(src)}</pre>`,
  diagnostics: [],
}));
