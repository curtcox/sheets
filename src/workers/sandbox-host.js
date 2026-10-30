// Creates one HashBin SDK sandbox for the Sheets page that framed this one and relays its
// messages over the port that page sent (sandbox.js).
import { loadHashBinSDK } from "../sandbox.js";
let started = false;
addEventListener("message", async (event) => {
  const port = event.ports[0];
  if (
    started ||
    event.source !== parent ||
    event.origin !== location.origin ||
    event.data?.type !== "sheets:sandbox:start" ||
    !port
  )
    return;
  started = true;
  try {
    const { createSandbox } = await loadHashBinSDK();
    const sandbox = createSandbox({
      source: event.data.source,
      base: event.data.base,
    });
    sandbox.onmessage = ({ data }) => port.postMessage(data);
    sandbox.onerror = ({ message }) =>
      port.postMessage({ type: "sheets:sandbox:error", message });
    port.onmessage = ({ data }) => sandbox.postMessage(data);
  } catch (error) {
    port.postMessage({ type: "sheets:sandbox:error", message: error.message });
  }
});
parent.postMessage({ type: "sheets:sandbox:ready" }, location.origin);
