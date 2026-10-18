import { plugin } from "../registry.js";
import { renderMarkdown } from "./markdown.js";
export default plugin("gfm", async (src) => renderMarkdown(src));
