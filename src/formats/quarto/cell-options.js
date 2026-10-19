// Omitted error retains Sheets' existing continue-after-error contract. Explicit
// false stops the affected interpreter's remaining cells, including hidden ones.
export function cellOptions(metadata, part) {
  const defaults = typeof metadata.execute === "object" ? metadata.execute : {};
  const options = {
    error: true,
    ...defaults,
    ...part.options,
  };
  // knitr always stops on a hidden chunk's error, even with error:true.
  if (part.language === "r" && options.include === false) options.error = false;
  const width =
      part.language === "r"
        ? (part.options["fig-width"] ?? metadata["fig-width"])
        : metadata["fig-width"],
    height =
      part.language === "r"
        ? (part.options["fig-height"] ?? metadata["fig-height"])
        : metadata["fig-height"];
  if (width !== undefined || height !== undefined)
    options.figureSize = { width: width ?? 7, height: height ?? 5 };
  return options;
}
