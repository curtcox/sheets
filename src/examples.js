import { parseProjectFile } from "./project-state.js";
let catalogPromise;
export function getExamples(fetchSource = fetch) {
  return (catalogPromise ??= fetchSource(
    new URL("../examples/catalog.json", import.meta.url),
  )
    .then((r) => {
      if (!r.ok) throw new Error("The example catalog could not be loaded.");
      return r.json();
    })
    .catch((error) => {
      catalogPromise = null;
      throw error;
    }));
}
export async function loadExample(id, fetchSource = fetch) {
  const catalog = await getExamples(fetchSource),
    example = catalog.find((e) => e.id === id);
  if (!example || !/^examples\/[a-z]+\/[\w.-]+$/.test(example.path))
    throw new Error("That example was not found.");
  const response = await fetchSource(
    new URL("../" + example.path, import.meta.url),
  );
  if (!response.ok) throw new Error("The example source could not be loaded.");
  const text = await response.text();
  return { ...example, ...(example.path.endsWith(".sheets.json") ? parseProjectFile(text) : { src: text }) };
}
/** Shown when the address holds no document. */
export const starter =
  "# Notes that do the math\n\nA sheet is a small document with a little more power. Write on the left; see the result on the right.\n\n## Start with an idea\n\n| Item | Quantity | Unit cost |\n| :--- | ---: | ---: |\n| Notebooks | 12 | $4 |\n| Pencils | 24 | $1 |\n| Good ideas | ∞ | Free |\n\nThe area of a circle is $A = \\pi r^2$.\n\n> [!TIP]\n> Choose a calculation format above to turn expressions into answers. Visit the **[gallery](gallery.html)** for examples in all nine formats.\n\n- [x] Write something useful\n- [ ] Make it calculate\n- [ ] Share the link\n";
