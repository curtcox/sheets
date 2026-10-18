import { getExamples } from "./examples.js";
import { catalog } from "./formats/registry.js";
import { escapeHTML as e } from "./util.js";
const search = document.getElementById("search"),
  filter = document.getElementById("filter"),
  cards = document.getElementById("cards"),
  status = document.getElementById("gallery-status");
for (const f of catalog.filter((f) => f.id !== "text")) {
  const option = document.createElement("option");
  option.value = f.id;
  option.textContent = f.label;
  filter.append(option);
}
try {
  const examples = await getExamples();
  function update() {
    const query = search.value.toLowerCase(),
      visible = examples.filter(
        (item) =>
          (filter.value === "all" || filter.value === item.format) &&
          `${item.title} ${item.description} ${item.format} ${item.kind}`
            .toLowerCase()
            .includes(query),
      );
    cards.innerHTML = visible
      .map(
        (item) =>
          `<section class="card"><img class="card-cover" src="examples/covers/${encodeURIComponent(item.id)}.png" alt="" width="640" height="400" loading="lazy" decoding="async"><div class="card-content"><span class="tag">${e(catalog.find((f) => f.id === item.format)?.label)}</span><h2>${e(item.title)}</h2><p>${e(item.description)}</p><a href="index.html?example=${encodeURIComponent(item.id)}">Load in editor <span aria-hidden="true">↗</span></a></div></section>`,
      )
      .join("");
    status.textContent = visible.length
      ? `${visible.length} example${visible.length === 1 ? "" : "s"}`
      : "No examples match your search.";
  }
  search.oninput = update;
  filter.onchange = update;
  update();
} catch (error) {
  status.textContent = error.message;
}
