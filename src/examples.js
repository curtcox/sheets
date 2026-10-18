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
  return { ...example, src: await response.text() };
}
