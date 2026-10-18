const base = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
self.onmessage = async ({ data: { cells } }) => {
  try {
    const { loadPyodide } = await import(base + "pyodide.mjs");
    const py = await loadPyodide({ indexURL: base });
    await py.runPythonAsync(
      `import ast, io, json, contextlib, os\nos.environ["MPLBACKEND"] = "Agg"\n_sheets_globals = {"__name__": "__main__"}\ndef _sheets_cell(source):\n    stdout, stderr = io.StringIO(), io.StringIO()\n    result = {"stdout": "", "stderr": "", "html": "", "text": "", "figures": []}\n    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):\n        try:\n            tree = ast.parse(source)\n            last = tree.body.pop() if tree.body and isinstance(tree.body[-1], ast.Expr) else None\n            exec(compile(tree, "<cell>", "exec"), _sheets_globals)\n            if last is not None:\n                value = eval(compile(ast.Expression(last.value), "<cell>", "eval"), _sheets_globals)\n                if value is not None:\n                    if hasattr(value, "_repr_html_"):\n                        result["html"] = value._repr_html_() or ""\n                    else:\n                        result["text"] = repr(value)\n            import sys\n            if "matplotlib.pyplot" in sys.modules:\n                import matplotlib.pyplot as plt\n                for number in plt.get_fignums():\n                    buffer = io.StringIO()\n                    plt.figure(number).savefig(buffer, format="svg")\n                    result["figures"].append(buffer.getvalue())\n                plt.close("all")\n        except Exception as error:\n            result["error"] = type(error).__name__ + ": " + str(error)\n    result["stdout"] = stdout.getvalue()\n    result["stderr"] = stderr.getvalue()\n    return json.dumps(result)`,
    );
    const outputs = [];
    for (const cell of cells) {
      try {
        await py.loadPackagesFromImports(cell.source);
        py.globals.set("_sheets_source", cell.source);
        const json = await py.runPythonAsync("_sheets_cell(_sheets_source)");
        outputs.push(JSON.parse(json));
      } catch (error) {
        outputs.push({ error: error.message });
      }
    }
    self.postMessage({ outputs });
  } catch (error) {
    self.postMessage({ error: `Python could not start: ${error.message}` });
  }
};
