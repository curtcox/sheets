/** Every edit invalidates running work immediately, including while debounce waits. */
export class RenderScheduler {
  constructor({
    render,
    onResult,
    onStatus = () => {},
    delay = 300,
    timers = globalThis,
  }) {
    Object.assign(this, { render, onResult, onStatus, delay, timers });
    this.revision = 0;
  }
  cancel() {
    this.revision++;
    this.timers.clearTimeout(this.timer);
    this.controller?.abort();
  }
  schedule(source, context = {}, immediate = false) {
    this.cancel();
    const revision = this.revision;
    const controller = (this.controller = new AbortController());
    this.onStatus("waiting");
    this.timer = this.timers.setTimeout(
      async () => {
        this.onStatus("rendering");
        try {
          const result = await this.render(source, {
            ...context,
            signal: controller.signal,
            revision,
          });
          if (revision !== this.revision || controller.signal.aborted) return;
          await this.onResult(result, revision);
          if (revision === this.revision)
            this.onStatus("done", result.diagnostics || []);
        } catch (error) {
          if (revision === this.revision && error.name !== "AbortError")
            this.onStatus("error", error);
        }
      },
      immediate ? 0 : this.delay,
    );
    return revision;
  }
}
