import { estimate, type Selection, type Travel } from "./pricing";

export type EstimatePdfDetails = {
  customerName?: string;
  address?: string;
  postcode?: string;
};

type PdfRow = {
  description: string;
  detail: string;
  cost: number | null;
  costLabel?: string;
};

type PdfDocument = {
  reference: string;
  prepared: string;
  details: EstimatePdfDetails;
  rows: PdfRow[];
  subtotal: number;
  travelAmount: number | null;
  total: number;
  totalLabel: "ESTIMATED TOTAL" | "PRICED SUBTOTAL";
  hasUnknown: boolean;
  travelMessage: string;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 42;
const RIGHT = PAGE_W - M;
const NAVY = [0.055, 0.11, 0.18] as const;
const BLUE = [0, 0.47, 0.78] as const;
const MUTED = [0.34, 0.39, 0.46] as const;
const PALE = [0.955, 0.97, 0.985] as const;
const PALE_ALT = [0.982, 0.987, 0.993] as const;
const LINE = [0.82, 0.86, 0.9] as const;
const WHITE = [1, 1, 1] as const;
type Colour = readonly [number, number, number];

const money = (value: number) => `£${value.toFixed(value % 1 ? 2 : 0)}`;

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

function rect(x: number, y: number, width: number, height: number, fill?: Colour, stroke?: Colour) {
  let command = "q\n";
  if (fill) command += `${colour(fill)}\n`;
  if (stroke) command += `${colour(stroke, true)}\n0.7 w\n`;
  command += `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${
    fill && stroke ? "B" : fill ? "f" : "S"
  }\nQ\n`;
  return command;
}

function rule(x1: number, y1: number, x2: number, y2: number, stroke: Colour = LINE, width = 0.7) {
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
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (estimateWidth(next, size) <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
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

function letterhead(page: number, pages: number, document: PdfDocument) {
  let stream = "";
  stream += lightning(M, 752, 1.08);
  stream += text("SPERIN SERVICES", M + 42, 797, 23, "F2", NAVY);
  stream += text("Electrical Installation  |  Inspection & Testing  |  EV Charging", M + 42, 778, 8.3, "F1", MUTED);
  stream += text("Augustine Sperin  |  18 Dawson Street, Bearwood, Birmingham B66 4JB", M + 42, 762, 8.2, "F1", MUTED);
  stream += text("07817 360156  |  info@sperinservices.co.uk  |  sperinservices.co.uk", M + 42, 748, 8.2, "F1", MUTED);

  stream += rightText("ESTIMATE", RIGHT, 798, 23, "F2", BLUE);
  stream += rightText(`Reference: ${document.reference}`, RIGHT, 775, 8.5, "F1", NAVY);
  stream += rightText(`Date: ${document.prepared}`, RIGHT, 761, 8.5, "F1", NAVY);
  stream += rightText(`Page ${page} of ${pages}`, RIGHT, 747, 8, "F1", MUTED);
  stream += rule(M, 731, RIGHT, 731, BLUE, 1.4);
  return stream;
}

function customerPanel(document: PdfDocument) {
  let stream = rect(M, 666, RIGHT - M, 48, PALE);
  stream += text(document.details.customerName ? "ESTIMATE FOR" : "ONLINE ESTIMATE", M + 14, 699, 8, "F2", BLUE);
  stream += text(document.details.customerName || "Customer-selected electrical work", M + 14, 683, 11, "F2", NAVY);
  const location = [document.details.address, document.details.postcode].filter(Boolean).join("  |  ");
  stream += text(
    location || "Final scope and fixed quotation confirmed after assessment.",
    M + 14,
    670,
    8.2,
    "F1",
    MUTED,
  );
  return stream;
}

function tableHeader(y: number, continued: boolean) {
  let stream = "";
  if (continued) stream += text("DESCRIPTION OF WORK - CONTINUED", M, y + 17, 9, "F2", BLUE);
  stream += rect(M, y - 26, RIGHT - M, 26, NAVY);
  stream += text("DESCRIPTION OF WORK", M + 12, y - 18, 9, "F2", WHITE);
  stream += rightText("COST", RIGHT - 12, y - 18, 9, "F2", WHITE);
  return { stream, y: y - 26 };
}

function rowHeight(row: PdfRow) {
  const title = wrap(row.description, 385, 9.3);
  const detail = wrap(row.detail, 385, 7.6);
  return Math.max(42, 14 + title.length * 12 + (row.detail ? detail.length * 9 + 5 : 0));
}

function rowBlock(row: PdfRow, y: number, shade: boolean) {
  const height = rowHeight(row);
  const title = wrap(row.description, 385, 9.3);
  const detail = wrap(row.detail, 385, 7.6);
  let stream = "";
  if (shade) stream += rect(M, y - height, RIGHT - M, height, PALE_ALT);
  stream += rule(M, y - height, RIGHT, y - height, LINE, 0.5);

  let ty = y - 18;
  for (const line of title) {
    stream += text(line, M + 12, ty, 9.3, "F2", NAVY);
    ty -= 12;
  }
  if (row.detail) {
    ty -= 1;
    for (const line of detail) {
      stream += text(line, M + 12, ty, 7.6, "F1", MUTED);
      ty -= 9;
    }
  }
  const cost = row.cost == null ? row.costLabel || "TO ASSESS" : money(row.cost);
  stream += rightText(cost, RIGHT - 12, y - 20, row.cost == null ? 8.5 : 10, "F2", row.cost == null ? BLUE : NAVY);
  return { stream, height };
}

function summaryBlock(document: PdfDocument, y: number) {
  let stream = "";
  const x = 326;
  const width = RIGHT - x;
  const h = 24;
  const rows: [string, string][] = [
    ["SUBTOTAL", money(document.subtotal)],
    ["TRAVEL", document.travelAmount == null ? "TO CONFIRM" : money(document.travelAmount)],
    ["VAT (not registered)", "£0.00"],
  ];
  for (const [label, value] of rows) {
    stream += rect(x, y - h, width, h, PALE, LINE);
    stream += text(label, x + 10, y - 16, 8.5, label === "SUBTOTAL" ? "F2" : "F1", MUTED);
    stream += rightText(value, RIGHT - 10, y - 16, 9, "F2", NAVY);
    y -= h;
  }
  stream += rect(x, y - 36, width, 36, NAVY);
  stream += text(document.totalLabel, x + 10, y - 23, 9, "F2", WHITE);
  stream += rightText(money(document.total), RIGHT - 10, y - 25, 15, "F2", WHITE);
  return { stream, y: y - 36 };
}

function notesBlock(document: PdfDocument, y: number) {
  const notes = [
    "This is an estimate only. A fixed quotation is confirmed after assessment and before work starts.",
    "Prices assume suitable existing wiring, same-position replacement where applicable and normal safe access.",
    "Sperin Services is not VAT registered. No VAT is charged.",
  ];
  if (document.hasUnknown) notes.push("Any work marked TO ASSESS is excluded from the priced subtotal.");
  if (document.travelAmount == null)
    notes.push(document.travelMessage || "Travel supplement will be confirmed before booking.");

  const lines = notes.flatMap((note) => wrap(note, 470, 7.6));
  const height = 28 + lines.length * 10;
  let stream = text("TERMS / NOTES", M, y, 9, "F2", BLUE);
  y -= 11;
  stream += rect(M, y - height, RIGHT - M, height, PALE);
  let ty = y - 15;
  for (const line of lines) {
    stream += text(line, M + 11, ty, 7.6, "F1", MUTED);
    ty -= 10;
  }
  return { stream, y: y - height };
}

function footer(page: number, pages: number) {
  let stream = rule(M, 34, RIGHT, 34, LINE, 0.6);
  stream += text("Sperin Services  |  Electrical Installation  |  Inspection & Testing  |  EV Charging", M, 20, 7.1, "F1", MUTED);
  stream += rightText(`${page} / ${pages}`, RIGHT, 20, 7.1, "F1", MUTED);
  return stream;
}

function makePdf(streams: string[]) {
  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  const kids: number[] = [];
  let id = 5;

  for (const stream of streams) {
    const pageId = id++;
    const contentId = id++;
    kids.push(pageId);
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    const byteLength = new TextEncoder().encode(stream).length;
    objects[contentId] = `<< /Length ${byteLength} >>\nstream\n${stream}\nendstream`;
  }
  objects[2] = `<< /Type /Pages /Kids [${kids.map((kid) => `${kid} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let pdf = "%PDF-1.4\n%SperinServicesEstimateV2\n";
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
  const rows: PdfRow[] = calculated.rows.map((row) => {
    const unknown = calculated.unknown.includes(row.id);
    const prefix = row.quantity > 1 ? `${row.quantity} x ` : "";
    return {
      description: `${prefix}${row.name}`,
      detail: row.detail,
      cost: unknown ? null : row.amount,
    };
  });

  if (calculated.visit > 0)
    rows.push({
      description: "Single visit / attendance allowance",
      detail: "Applied once to the selected small works - not once per item.",
      cost: calculated.visit,
    });

  const travelAmount = travel?.charge ?? null;
  const hasUnknown = calculated.unknown.length > 0;
  rows.push({
    description: "Travel",
    detail: travel?.message || "Travel supplement to be confirmed before booking.",
    cost: travelAmount,
    costLabel: travelAmount == null ? "TO CONFIRM" : undefined,
  });

  const document: PdfDocument = {
    reference,
    prepared: new Date().toLocaleDateString("en-GB"),
    details: { ...details, postcode: details.postcode || travel?.postcode },
    rows,
    subtotal: calculated.subtotal,
    travelAmount,
    total: calculated.subtotal + (travelAmount || 0),
    totalLabel: hasUnknown || travelAmount == null ? "PRICED SUBTOTAL" : "ESTIMATED TOTAL",
    hasUnknown,
    travelMessage: travel?.message || "Travel supplement to be confirmed before booking.",
  };

  const pageRows: PdfRow[][] = [];
  let current: PdfRow[] = [];
  let y = 628;
  for (const row of rows) {
    const h = rowHeight(row);
    if (y - h < 88 && current.length) {
      pageRows.push(current);
      current = [];
      y = 688;
    }
    current.push(row);
    y -= h;
  }
  if (current.length || !pageRows.length) pageRows.push(current);

  let finalY = pageRows.length === 1 ? 602 : 662;
  for (const row of pageRows.at(-1) || []) finalY -= rowHeight(row);
  if (finalY < 250) pageRows.push([]);

  const pages = pageRows.length;
  const streams: string[] = [];
  for (let pageIndex = 0; pageIndex < pages; pageIndex++) {
    let stream = letterhead(pageIndex + 1, pages, document);
    let y: number;
    if (pageIndex === 0) {
      stream += customerPanel(document);
      y = 642;
    } else {
      y = 704;
    }

    if (pageRows[pageIndex].length) {
      const header = tableHeader(y, pageIndex > 0);
      stream += header.stream;
      y = header.y;
      pageRows[pageIndex].forEach((row, index) => {
        const block = rowBlock(row, y, index % 2 === 1);
        stream += block.stream;
        y -= block.height;
      });
    } else {
      stream += text("ESTIMATE SUMMARY", M, y - 10, 9, "F2", BLUE);
      y -= 36;
    }

    if (pageIndex === pages - 1) {
      y -= 18;
      stream += summaryBlock(document, y).stream;
      const notesY = Math.min(y, 238);
      stream += notesBlock(document, notesY).stream;
    }

    stream += footer(pageIndex + 1, pages);
    streams.push(stream);
  }

  return makePdf(streams);
}
