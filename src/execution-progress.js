/** Report the active stage and time left without keeping a completed job alive. */
export function executionProgress({ label, timeout, onProgress, initial }) {
  const started = Date.now();
  let stage = initial;
  const report = () => {
    const elapsed = Math.floor((Date.now() - started) / 1000);
    const remaining = Math.max(0, Math.ceil(timeout / 1000 - elapsed));
    onProgress?.(`${label}: ${stage} · ${elapsed}s elapsed · ${remaining}s until timeout. Cancel or edit to stop.`);
  };
  const interval = onProgress ? setInterval(report, 1000) : null;
  report();
  return {
    update(next) {
      stage = next;
      report();
    },
    stop: () => clearInterval(interval),
    error: () => new Error(
      `Calculation exceeded ${timeout / 1000} seconds while ${label}: ${stage}. ` +
      "Runtime and package downloads need a working connection. Retry after checking your connection, or reduce the cell's work if execution was already running.",
    ),
  };
}
