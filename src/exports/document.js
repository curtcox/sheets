import { modelText } from "./model.js";
export async function markdown(snapshot) {
  const [{ default: Turndown }, { gfm }] = await Promise.all([
    import("../../vendor/turndown.js"),
    import("../../vendor/turndown-plugin-gfm.js"),
  ]);
  const service = new Turndown({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  service.use(gfm);
  service.addRule("math", {
    filter: (node) => node.nodeName.toLowerCase() === "math",
    replacement: (_, node) => {
      const tex =
        node.querySelector('annotation[encoding="application/x-tex"]')
          ?.textContent || node.textContent;
      return node.getAttribute("display") === "block"
        ? `\n\n$$\n${tex}\n$$\n\n`
        : `$${tex}$`;
    },
  });
  service.addRule("svg", {
    filter: (node) => node.nodeName.toLowerCase() === "svg",
    replacement: (_, node) =>
      `\n\n[Diagram: ${(node.textContent || "Diagram").trim()}]\n\n`,
  });
  return {
    text: service.turndown(snapshot.fragment) + "\n",
    diagnostics: [
      "Markdown diagrams become text descriptions. Complex tables, spans and styling may be flattened. Embedded picture data stays in the Markdown file.",
    ],
  };
}
export function richText(snapshot) {
  const escape = (text) =>
    text
      .replace(/[\\{}]/g, "\\$&")
      .replace(
        /[^\x00-\x7f]/g,
        (ch) =>
          `\\u${ch.charCodeAt(0) > 32767 ? ch.charCodeAt(0) - 65536 : ch.charCodeAt(0)}?`,
      )
      .replace(/\n/g, "\\par\n");
  return {
    text:
      "{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs22\n" +
      escape(modelText(snapshot.model)) +
      "}",
    diagnostics: [
      "Rich text preserves readable content; tables, equations and pictures become text.",
    ],
  };
}
export async function word(snapshot) {
  const D = await import("../../vendor/docx.js");
  const diagnostics = [];
  const runs = (nodes, style = {}) =>
    nodes.flatMap((n) => {
      if (n.type === "text" || n.type === "math")
        return [new D.TextRun({ text: n.text, ...style })];
      if (n.type === "break") return [new D.TextRun({ break: 1 })];
      if (n.type === "image") {
        const match = /^data:image\/(png|jpeg);base64,(.*)$/s.exec(n.src);
        if (match) {
          const data = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
          return [
            new D.ImageRun({
              type: match[1] === "jpeg" ? "jpg" : "png",
              data,
              transformation: {
                width: n.width || 500,
                height: n.height || 300,
              },
              altText: { title: n.alt, description: n.alt, name: n.alt },
            }),
          ];
        }
        diagnostics.push(
          "Some pictures were replaced by descriptions because their bytes were not included.",
        );
        return [new D.TextRun({ text: `[${n.alt}]`, italics: true })];
      }
      if (n.type === "svg")
        return [new D.TextRun({ text: `[${n.alt}]`, italics: true })];
      if (n.type === "link" && /^https?:|^mailto:/i.test(n.href))
        return [
          new D.ExternalHyperlink({
            link: n.href,
            children: runs(n.children, { ...style, style: "Hyperlink" }),
          }),
        ];
      return runs(n.children || [], {
        ...style,
        ...(["strong", "em", "strike", "inlineCode"].includes(n.type)
          ? {
              [{
                strong: "bold",
                em: "italics",
                strike: "strike",
                inlineCode: "font",
              }[n.type]]: n.type === "inlineCode" ? "Courier New" : true,
            }
          : {}),
      });
    });
  const paragraph = (nodes, options = {}) =>
    new D.Paragraph({ ...options, children: runs(nodes) });
  const blocks = (nodes) =>
    nodes.flatMap((n) => {
      if (n.type === "table") {
        const rows = [];
        const collect = (nodes) => {
          for (const v of nodes)
            if (v.type === "row") rows.push(v);
            else collect(v.children || []);
        };
        collect(n.children || []);
        if (!rows.length) return [];
        return [
          new D.Table({
            width: { size: 100, type: D.WidthType.PERCENTAGE },
            rows: rows.map(
              (row) =>
                new D.TableRow({
                  children: (row.children || [])
                    .filter((c) => c.type === "cell")
                    .map(
                      (c) =>
                        new D.TableCell({
                          columnSpan: c.colspan || 1,
                          ...(row.shaded ? { shading: { fill: "FAFBF8" } } : {}),
                          children: [paragraph(c.children || [])],
                        }),
                    ),
                }),
            ),
          }),
        ];
      }
      if (n.type === "heading")
        return [
          paragraph(n.children, {
            heading: D.HeadingLevel[`HEADING_${n.level}`],
          }),
        ];
      if (n.type === "list")
        return (n.children || []).flatMap((item) =>
          item.type === "item"
            ? [
                paragraph(item.children || [], {
                  ...(n.ordered
                    ? { numbering: { reference: "list", level: 0 } }
                    : { bullet: { level: 0 } }),
                }),
              ]
            : blocks([item]),
        );
      if (["paragraph", "quote", "code", "item"].includes(n.type))
        return [
          paragraph(n.children, {
            ...(n.type === "code" ? { style: "Code" } : {}),
            spacing: { after: 140 },
          }),
        ];
      if (n.type === "group") return blocks(n.children || []);
      if (n.type === "text" && !n.text.trim()) return [];
      return [paragraph([n])];
    });
  const doc = new D.Document({
    title: snapshot.title,
    creator: "Sheets",
    description: "Evaluated Sheets document",
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Code", name: "Code", run: { font: "Courier New", size: 18 } },
      ],
    },
    numbering: {
      config: [
        {
          reference: "list",
          levels: [
            {
              level: 0,
              format: D.LevelFormat.DECIMAL,
              text: "%1.",
              alignment: D.AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [{ children: blocks(snapshot.model) }],
  });
  const blob = await D.Packer.toBlob(doc);
  return {
    bytes: await blob.arrayBuffer(),
    diagnostics: [
      ...new Set(diagnostics),
      "Word preserves editable prose and tables. Equations use readable text; diagrams use pictures. Complex page layout may differ.",
    ],
  };
}
