import { modelText } from "./model.js";
self.onmessage = async ({ data: { id, snapshot, valuesOnly } }) => {
  try {
    let result;
    if (id === "txt")
      result = {
        text:
          modelText(snapshot.model)
            .replace(/\n{3,}/g, "\n\n")
            .trim() + "\n",
      };
    else if (id === "md")
      result = await (await import("./document.js")).markdown(snapshot);
    else if (id === "docx")
      result = await (await import("./document.js")).word(snapshot);
    else if (id === "rtf")
      result = (await import("./document.js")).richText(snapshot);
    else if (id === "xlsx" || id === "ods")
      result = await (
        await import("./workbook.js")
      ).workbookBytes(snapshot, id, { valuesOnly });
    else throw Error("Unknown export target.");
    self.postMessage(result, result.bytes ? [result.bytes] : []);
  } catch (error) {
    self.postMessage({ error: error.message || String(error) });
  }
};
