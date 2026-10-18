// Same-origin bootstrap for webR's own (classic) worker. The controller creates
// this worker synchronously, so closing it also cancels a pending CDN download.
// With webR's cross-origin worker loader, close() is a no-op until its XHR ends.
const runtime = "https://webr.r-wasm.org/v0.6.0/";
importScripts(runtime + "webr-worker.js");
const receive = self.onmessage;
self.onmessage = (event) => {
  if (event.data?.type === "init") {
    event.data.data.config.baseUrl = runtime;
    self.onmessage = receive;
  }
  receive.call(self, event);
};
