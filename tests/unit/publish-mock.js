import { HashBinDocuments, HashBinStore } from "../../src/hashbin.js";
/** A store whose mock SDK takes the redirect path, as when the approval popup is blocked. */
export async function redirectStore() {
  const data = new Map();
  let clientState;
  const store = new HashBinStore({
    clientId: "public",
    transactionStorage: {
      setItem: (k, v) => data.set(k, v),
      getItem: (k) => data.get(k) ?? null,
      removeItem: (k) => data.delete(k),
    },
    loadSDK: async () => ({
      HashBinClient: class {
        publish(_content, options) {
          clientState = options.clientState;
          return Promise.resolve({ redirected: true });
        }
        async handlePublishCallback({ hash }) {
          if (hash.includes("error=")) throw new Error("access_denied");
          return { cid: "AAAAAAABeA", clientState };
        }
      },
    }),
  });
  await store.init();
  return store;
}
/** The snapshots a redirect save restores after approval and after cancellation. */
export async function redirectSnapshots(snapshot) {
  const store = await redirectStore(),
    restored = [];
  for (const hash of [
    "#hashbin_publish=t&cid=AAAAAAABeA",
    "#hashbin_publish=t&error=access_denied",
  ]) {
    await store.publish(HashBinDocuments.serialize(snapshot), snapshot);
    restored.push((await store.published(hash)).snapshot);
  }
  return restored;
}
