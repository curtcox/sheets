import init from "../../vendor/numbat@1.24.0/numbat_wasm.js";
import { evaluateNumbat } from "../formats/numbat/engine.js";
self.onmessage = async ({ data: { src, xml } }) => {
  try {
    await init();
    const { html, diagnostics } = evaluateNumbat(src, { xml });
    self.postMessage({ html, diagnostics });
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
