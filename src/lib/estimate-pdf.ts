// Small, dependency-free, paginated PDF writer. WinAnsi-compatible plain text.
export function estimatePdf(lines: string[]): Uint8Array {
  const ascii = (s: string) =>
    s
      .replace(/£/g, "GBP ")
      .replace(/[–—]/g, "-")
      .normalize("NFKD")
      .replace(/[^\x20-\x7e]/g, "");
  const wrapped = lines.flatMap((line) => {
    const words = ascii(line).split(" ");
    const output: string[] = [];
    let row = "";
    for (const word of words) {
      if ((row + " " + word).length > 86) {
        output.push(row);
        row = "";
      }
      row += (row ? " " : "") + word;
    }
    output.push(row);
    return output;
  });
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += 45) pages.push(wrapped.slice(i, i + 45));
  if (!pages.length) pages.push(["Sperin Services"]);
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  const kids: number[] = [];
  pages.forEach((page, index) => {
    const pageId = objects.length + 1,
      streamId = pageId + 1;
    kids.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`,
    );
    const escape = (s: string) => s.replace(/[\\()]/g, "\\$&");
    const stream = `BT /F1 11 Tf 15 TL 40 795 Td ${page.map((line, i) => `${i ? "T* " : ""}(${escape(line)}) Tj`).join("\n")} ET\nBT /F1 9 Tf 40 28 Td (Sperin Services - estimate only - page ${index + 1} of ${pages.length}) Tj ET`;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const start = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
