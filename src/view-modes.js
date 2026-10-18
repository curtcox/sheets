export function setupViews({
  workspace,
  divider,
  onChange,
  onResize = () => {},
}) {
  let view = "split",
    size = 50;
  const narrow = () => matchMedia("(max-width:759px)").matches;
  function resize(value) {
    size = Math.max(20, Math.min(80, value));
    workspace.style.setProperty("--split", `${size}%`);
    if (narrow())
      workspace.style.gridTemplateRows =
        view === "split"
          ? `minmax(0,${size}fr) 9px minmax(0,${100 - size}fr)`
          : "1fr";
    divider.setAttribute("aria-valuenow", Math.round(size));
    onResize();
  }
  function setView(next, notify = true) {
    view = ["split", "source", "preview"].includes(next) ? next : "split";
    workspace.dataset.view = view;
    document
      .querySelectorAll("[data-view]:not(#workspace)")
      .forEach((button) =>
        button.setAttribute("aria-pressed", button.dataset.view === view),
      );
    divider.setAttribute(
      "aria-orientation",
      narrow() ? "horizontal" : "vertical",
    );
    workspace.style.gridTemplateRows = "";
    resize(size);
    if (notify) onChange(view);
  }
  document
    .querySelectorAll("button[data-view]")
    .forEach((button) => (button.onclick = () => setView(button.dataset.view)));
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.altKey && ["1", "2", "3"].includes(event.key)) {
      event.preventDefault();
      setView(["source", "split", "preview"][Number(event.key) - 1]);
    }
  });
  divider.addEventListener("pointerdown", (event) => {
    divider.setPointerCapture(event.pointerId);
  });
  divider.addEventListener("pointermove", (event) => {
    if (!divider.hasPointerCapture(event.pointerId)) return;
    const box = workspace.getBoundingClientRect();
    resize(
      narrow()
        ? ((event.clientY - box.top) / box.height) * 100
        : ((event.clientX - box.left) / box.width) * 100,
    );
  });
  divider.addEventListener("keydown", (event) => {
    if (
      [
        "ArrowLeft",
        "ArrowDown",
        "ArrowRight",
        "ArrowUp",
        "Home",
        "End",
      ].includes(event.key)
    ) {
      event.preventDefault();
      resize(
        event.key === "Home"
          ? 20
          : event.key === "End"
            ? 80
            : size + (["ArrowRight", "ArrowDown"].includes(event.key) ? 5 : -5),
      );
    }
  });
  window.addEventListener("resize", () => setView(view, false));
  return { setView, getView: () => view };
}
