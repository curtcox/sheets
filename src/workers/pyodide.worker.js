import { pythonCell } from "./python-cell.js";
const base = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
self.onmessage = async ({ data: { cells } }) => {
  try {
    const { loadPyodide } = await import(base + "pyodide.mjs");
    const py = await loadPyodide({ indexURL: base });
    await py.runPythonAsync(pythonCell);
    const outputs = [];
    for (const cell of cells) {
      try {
        await py.loadPackagesFromImports(cell.source);
        py.globals.set("_sheets_source", cell.source);
        py.globals.set("_sheets_options", JSON.stringify(cell.execution || {}));
        const json = await py.runPythonAsync(
          "_sheets_cell(_sheets_source, _sheets_options)",
        );
        const output = JSON.parse(json);
        outputs.push(output);
        if (output.error && cell.execution?.error === false) break;
      } catch (error) {
        outputs.push({ error: error.message });
        if (cell.execution?.error === false) break;
      }
    }
    self.postMessage({ outputs });
  } catch (error) {
    self.postMessage({ error: `Python could not start: ${error.message}` });
  }
};
