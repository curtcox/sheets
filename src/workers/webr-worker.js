// Classic worker source for webR in a HashBin SDK sandbox (webr-client.js). Closing
// the controller removes the sandbox frame, which also cancels a pending CDN download.
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
