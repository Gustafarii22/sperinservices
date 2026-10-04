import { estimate, type Selection, type Travel } from "./pricing";

export type EstimatePdfDetails = {
  customerName?: string;
  address?: string;
  postcode?: string;
};

type PdfRow = {
  quantity: number;
  description: string;
  detail: string;
  unitPrice: number | null;
  total: number | null;
};

type PdfDocument = {
  reference: string;
  prepared: string;
  details: EstimatePdfDetails;
  rows: PdfRow[];
  subtotal: number;
  travelAmount: number | null;
  travelMessage: string;
  total: number;
  totalLabel: "ESTIMATED TOTAL" | "PRICED SUBTOTAL";
  hasUnknown: boolean;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40;
const NAVY = [0.055, 0.11, 0.18] as const;
const BLUE = [0, 0.47, 0.78] as const;
const MUTED = [0.34, 0.39, 0.46] as const;
const PALE = [0.94, 0.965, 0.985] as const;
const LINE = [0.82, 0.86, 0.9] as const;
const WHITE = [1, 1, 1] as const;
type Colour = readonly [number, number, number];

const formatMoney = (value: number) => `£${value.toFixed(value % 1 ? 2 : 0)}`;

function normalise(value: unknown) {
  return String(value ?? "")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/•/g, "-")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e£]/g, "");
}

function pdfString(value: unknown) {
  return normalise(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/£/g, "\\243");
}

function colour(value: Colour, stroke = false) {
  return `${value.join(" ")} ${stroke ? "RG" : "rg"}`;
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill?: Colour,
  stroke?: Colour,
) {
  let command = "q\n";
  if (fill) command += `${colour(fill)}\n`;
  if (stroke) command += `${colour(stroke, true)}\n0.7 w\n`;
  command += `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${
    fill && stroke ? "B" : fill ? "f" : "S"
  }\nQ\n`;
  return command;
}

function rule(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: Colour = LINE,
  width = 0.7,
) {
  return `q\n${colour(stroke, true)}\n${width} w\n${x1} ${y1} m ${x2} ${y2} l S\nQ\n`;
}

function text(
  value: unknown,
  x: number,
  y: number,
  size = 10,
  font: "F1" | "F2" = "F1",
  fill: Colour = NAVY,
) {
  return `BT\n/${font} ${size} Tf\n${colour(fill)}\n1 0 0 1 ${x.toFixed(2)} ${y.toFixed(
    2,
  )} Tm\n(${pdfString(value)}) Tj\nET\n`;
}

function estimateWidth(value: unknown, size: number) {
  let units = 0;
  for (const char of normalise(value)) {
    if ("ilI1.,:;!|".includes(char)) units += 0.28;
    else if ("MW@%&".includes(char)) units += 0.86;
    else if (char === " ") units += 0.28;
    else units += 0.53;
  }
  return units * size;
}

function rightText(
  value: unknown,
  right: number,
  y: number,
  size = 10,
  font: "F1" | "F2" = "F1",
  fill: Colour = NAVY,
) {
  return text(value, right - estimateWidth(value, size), y, size, font, fill);
}

function wrap(value: unknown, maxWidth: number, size = 9) {
  const words = normalise(value).split(/\s+/).filter(Boolean);
  const output: string[] = [];
  let row = "";
  for (const word of words) {
    const candidate = row ? `${row} ${word}` : word;
    if (estimateWidth(candidate, size) <= maxWidth) {
      row = candidate;
      continue;
    }
    if (row) output.push(row);
    if (estimateWidth(word, size) <= maxWidth) {
      row = word;
      continue;
    }
    let piece = "";
    for (const char of word) {
      if (estimateWidth(piece + char, size) > maxWidth) {
        if (piece) output.push(piece);
        piece = char;
      } else piece += char;
    }
    row = piece;
  }
  if (row) output.push(row);
  return output.length ? output : [""];
}

function lightning(x: number, y: number, scale = 1) {
  return `q\n${colour(BLUE)}\n${(x + 16 * scale).toFixed(2)} ${(y + 38 * scale).toFixed(
    2,
  )} m\n${(x + 4 * scale).toFixed(2)} ${(y + 20 * scale).toFixed(2)} l\n${(
    x +
    13 * scale
  ).toFixed(2)} ${(y + 20 * scale).toFixed(2)} l\n${(x + 7 * scale).toFixed(2)} ${
    y +
    4 * scale
  } l\n${(x + 28 * scale).toFixed(2)} ${(y + 26 * scale).toFixed(2)} l\n${(
    x +
    18 * scale
  ).toFixed(2)} ${(y + 26 * scale).toFixed(2)} l\nh f\nQ\n`;
}

function header(page: number, document: PdfDocument) {
  let stream = "";
  stream += lightning(M, 756, 0.95);
  stream += text("SPERIN SERVICES", M + 36, 793, 17, "F2", NAVY);
  stream += text(
    "Electrical Installation | Inspection & Testing | EV Charging",
    M + 36,
    777,
    7.7,
    "F1",
    MUTED,
  );
  stream += text(
    "Augustine Sperin | 18 Dawson Street, Bearwood, Birmingham B66 4JB",
    M + 36,
    763,
    8,
    "F1",
    MUTED,
  );
  stream += text(
    "07817 360156 | info@sperinservices.co.uk | sperinservices.co.uk",
    M + 36,
    751,
    8,
    "F1",
    MUTED,
  );
  stream += rightText("ESTIMATE", PAGE_W - M, 794, 21, "F2", BLUE);
  stream += rightText(`Reference: ${document.reference}`, PAGE_W - M, 774, 8.5, "F1", NAVY);
  stream += rightText(`Prepared: ${document.prepared}`, PAGE_W - M, 761, 8.5, "F1", NAVY);
  stream += rule(M, 738, PAGE_W - M, 738, BLUE, 1.3);

  if (page === 1) {
    stream += rect(M, 674, 515, 50, PALE);
    const hasCustomer = Boolean(document.details.customerName);
    stream += text(hasCustomer ? "ESTIMATE FOR" : "ONLINE ESTIMATE", M + 14, 708, 8, "F2", BLUE);
    stream += text(
      document.details.customerName || "Customer-selected electrical work",
      M + 14,
      692,
      11,
      "F2",
      NAVY,
    );
    const location = [document.details.address, document.details.postcode].filter(Boolean).join(" | ");
    stream += text(
      location || "Final scope and fixed quotation confirmed after assessment.",
      M + 14,
      678,
      8.5,
      "F1",
      MUTED,
    );
    stream += text("DOCUMENT DETAILS", 340, 708, 8, "F2", BLUE);
    stream += text("Prepared by: Augustine Sperin", 340, 692, 8.5, "F1", NAVY);
    stream += text("Status: Estimate only - not a confirmed booking", 340, 678, 8.5, "F1", MUTED);
  }
  return stream;
}

function footer(page: number, pages: number) {
  let stream = rule(M, 34, PAGE_W - M, 34, LINE, 0.6);
  stream += text("Sperin Services | Estimate", M, 20, 7.5, "F1", MUTED);
  stream += rightText(`Page ${page} of ${pages}`, PAGE_W - M, 20, 7.5, "F1", MUTED);
  return stream;
}

function tableHeader(y: number, continued = false) {
  let stream = text(
    continued ? "DESCRIPTION OF WORK - CONTINUED" : "DESCRIPTION OF WORK",
    M,
    y + 17,
    9,
    "F2",
    BLUE,
  );
  y -= 2;
  stream += rect(M, y - 24, 515, 24, NAVY);
  stream += text("Qty", M + 10, y - 16, 8, "F2", WHITE);
  stream += text("Description", M + 55, y - 16, 8, "F2", WHITE);
  stream += rightText("Unit Price", PAGE_W - M - 75, y - 16, 8, "F2", WHITE);
  stream += rightText("Total", PAGE_W - M - 10, y - 16, 8, "F2", WHITE);
  return { stream, y: y - 24 };
}

function rowHeight(row: PdfRow) {
  const nameLines = wrap(row.description, 310, 9);
  const detailLines = wrap(row.detail, 310, 7.3);
  return Math.max(34, 12 + nameLines.length * 11 + (row.detail ? detailLines.length * 9 + 3 : 0));
}

function rowBlock(row: PdfRow, y: number, shade = false) {
  const height = rowHeight(row);
  const nameLines = wrap(row.description, 310, 9);
  const detailLines = wrap(row.detail, 310, 7.3);
  let stream = "";
  if (shade) stream += rect(M, y - height, 515, height, [0.978, 0.985, 0.992]);
  stream += rule(M, y - height, PAGE_W - M, y - height, LINE, 0.5);
  stream += text(String(row.quantity), M + 12, y - 18, 9, "F1", NAVY);
  let descriptionY = y - 17;
  for (const line of nameLines) {
    stream += text(line, M + 55, descriptionY, 9, "F2", NAVY);
    descriptionY -= 11;
  }
  if (row.detail) {
    descriptionY -= 1;
    for (const line of detailLines) {
      stream += text(line, M + 55, descriptionY, 7.3, "F1", MUTED);
      descriptionY -= 9;
    }
  }
  const unit = row.unitPrice == null ? "To assess" : formatMoney(row.unitPrice);
  const total = row.total == null ? "Not included" : formatMoney(row.total);
  stream += rightText(
    unit,
    PAGE_W - M - 75,
    y - 18,
    8.7,
    row.unitPrice == null ? "F2" : "F1",
    row.unitPrice == null ? BLUE : NAVY,
  );
  stream += rightText(
    total,
    PAGE_W - M - 10,
    y - 18,
    8.7,
    row.total == null ? "F2" : "F1",
    row.total == null ? BLUE : NAVY,
  );
  return { stream, height };
}

function totalsBlock(document: PdfDocument, y: number) {
  let stream = "";
  const x = 330;
  const width = 225;
  const rowHeight = 22;
  const rows: [string, string][] = [
    ["Subtotal", formatMoney(document.subtotal)],
    ["Travel", document.travelAmount == null ? "To confirm" : formatMoney(document.travelAmount)],
    ["VAT (not registered)", "£0.00"],
  ];
  for (const [label, value] of rows) {
    stream += rect(x, y - rowHeight, width, rowHeight, PALE, LINE);
    stream += text(label, x + 10, y - 15, 8.7, "F1", MUTED);
    stream += rightText(value, x + width - 10, y - 15, 8.7, "F2", NAVY);
    y -= rowHeight;
  }
  stream += rect(x, y - 32, width, 32, NAVY);
  stream += text(document.totalLabel, x + 10, y - 21, 9, "F2", WHITE);
  stream += rightText(formatMoney(document.total), x + width - 10, y - 23, 14, "F2", WHITE);
  return { stream, y: y - 32 };
}

function notesBlock(document: PdfDocument, y: number) {
  const noteLines: string[] = [];
  const notes = [
    "Estimate only. A fixed quotation is confirmed after assessment and before work starts.",
    "Weekday daytime prices assume suitable existing wiring, same-position replacements and normal safe access.",
    "No VAT is charged. Sperin Services is not VAT registered.",
  ];
  if (document.hasUnknown)
    notes.push("Work marked TO ASSESS is excluded from the priced subtotal.");
  if (document.travelAmount == null)
    notes.push(document.travelMessage || "Travel supplement remains to be confirmed before booking.");
  for (const note of notes) noteLines.push(...wrap(note, 245, 7.5), "");
  if (noteLines.at(-1) === "") noteLines.pop();
  const boxHeight = Math.max(82, 24 + noteLines.length * 9);
  let stream = text("TERMS / NOTES", M, y, 9, "F2", BLUE);
  y -= 10;
  stream += rect(M, y - boxHeight, 270, boxHeight, PALE);
  let lineY = y - 14;
  for (const line of noteLines) {
    if (!line) {
      lineY -= 2;
      continue;
    }
    stream += text(line, M + 10, lineY, 7.5, "F1", MUTED);
    lineY -= 9;
  }
  return { stream, y: y - boxHeight };
}

function makePdf(streams: string[]) {
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "";
  objects[3] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  const kids: number[] = [];
  let id = 5;
  for (const stream of streams) {
    const pageId = id++;
    const contentId = id++;
    kids.push(pageId);
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    const bytes = new TextEncoder().encode(stream);
    objects[contentId] = `<< /Length ${bytes.length} >>\nstream\n${stream}\nendstream`;
  }
  objects[2] = `<< /Type /Pages /Kids [${kids.map((kid) => `${kid} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let pdf = "%PDF-1.4\n%SperinServices\n";
  const offsets: number[] = [0];
  for (let index = 1; index < objects.length; index++) {
    offsets[index] = new TextEncoder().encode(pdf).length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const startXref = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index++)
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function estimatePdf(
  selection: Selection,
  travel?: Travel,
  reference = "DRAFT",
  details: EstimatePdfDetails = {},
): Uint8Array {
  const calculated = estimate(selection);
  const packageSelected = calculated.rows.some((row) => Boolean(row.group));
  const rows: PdfRow[] = calculated.rows.map((row) => {
    const unknown = calculated.unknown.includes(row.id);
    let detail = row.detail;
    if (!row.group && row.additional !== undefined) {
      detail += packageSelected
        ? " Same-visit rate; attendance is already included in the selected package."
        : " Same-visit rate; one attendance allowance is shown separately.";
    }
    return {
      quantity: row.quantity,
      description: row.name,
      detail,
      unitPrice: unknown ? null : row.group ? row.price : row.additional ?? row.price,
      total: unknown ? null : row.amount,
    };
  });
  if (calculated.visit > 0)
    rows.push({
      quantity: 1,
      description: "Single visit / attendance allowance",
      detail: "Applied once across the selected small jobs - not once per item.",
      unitPrice: calculated.visit,
      total: calculated.visit,
    });

  const travelAmount = travel?.charge ?? null;
  const hasUnknown = calculated.unknown.length > 0;
  const incomplete = hasUnknown || travelAmount == null;
  const document: PdfDocument = {
    reference,
    prepared: new Date().toLocaleDateString("en-GB"),
    details: {
      ...details,
      postcode: details.postcode || travel?.postcode,
    },
    rows,
    subtotal: calculated.subtotal,
    travelAmount,
    travelMessage: travel?.message || "Travel supplement remains to be confirmed before booking.",
    total: calculated.subtotal + (travelAmount || 0),
    totalLabel: incomplete ? "PRICED SUBTOTAL" : "ESTIMATED TOTAL",
    hasUnknown,
  };

  const pageRows: PdfRow[][] = [];
  let current: PdfRow[] = [];
  let y = 614;
  for (const row of rows) {
    const height = rowHeight(row);
    if (y - height < 130 && current.length) {
      pageRows.push(current);
      current = [];
      y = 674;
    }
    current.push(row);
    y -= height;
  }
  if (current.length || !pageRows.length) pageRows.push(current);

  let lastY = pageRows.length === 1 ? 614 : 674;
  for (const row of pageRows.at(-1) || []) lastY -= rowHeight(row);
  if (lastY < 250) pageRows.push([]);

  const streams: string[] = [];
  const pages = pageRows.length;
  for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
    let stream = header(pageIndex + 1, document);
    let rowY: number;
    if (pageRows[pageIndex].length) {
      const startY = pageIndex === 0 ? 640 : 700;
      const table = tableHeader(startY, pageIndex > 0);
      stream += table.stream;
      rowY = table.y;
      pageRows[pageIndex].forEach((row, index) => {
        const block = rowBlock(row, rowY, index % 2 === 1);
        stream += block.stream;
        rowY -= block.height;
      });
    } else {
      stream += text("ESTIMATE SUMMARY", M, 706, 9, "F2", BLUE);
      rowY = 680;
    }
    if (pageIndex === pages - 1) {
      rowY -= 12;
      stream += totalsBlock(document, rowY).stream;
      stream += notesBlock(document, rowY).stream;
    }
    stream += footer(pageIndex + 1, pages);
    streams.push(stream);
  }
  return makePdf(streams);
}
