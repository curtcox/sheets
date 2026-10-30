import { runWorker } from "./worker-client.js";
import { pythonCell } from "./workers/python-cell.js";
import { startSandbox } from "./sandbox.js";

/** A fresh Pyodide interpreter per render, in a HashBin SDK sandbox. */
export async function runPython(
  cells,
  { signal, timeout = 90000, start = startSandbox } = {},
) {
  signal?.throwIfAborted();
  const worker = await start("pyodide.worker.js", {
    signal,
    prefix: `const pythonCell = ${JSON.stringify(pythonCell)};\n`,
  });
  if (signal?.aborted) worker.terminate();
  return runWorker(
    null,
    { cells },
    { signal, timeout, createWorker: () => worker },
  );
}
