import { createHash, createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";
import { JOBS, estimate, estimateLines, travelCharge, type Travel } from "./pricing";
import { estimatePdf } from "./estimate-pdf";
import { sendSperinEmail } from "./sperin-review-email.server";
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
const postcodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/, "Enter a full UK postcode.");
const pdfSchema = z.object({
  selection: z.record(z.number().int().min(0).max(20)),
  postcode: z.string().trim().max(10).optional().default(""),
  reference: z.string().uuid(),
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(30),
  postcode: postcodeSchema,
  address: z.string().trim().min(3).max(300),
  timing: z.string().trim().min(1).max(150),
  notes: z.string().max(2500),
  selection: z.record(z.number().int().min(0).max(20)),
  consent: z.literal(true),
  overlapConfirmed: z.boolean(),
  website: z.string().max(0),
  reference: z.string().uuid(),
  photos: z
    .array(
      z.object({
        name: z.string().max(100),
        type: z.enum(["image/jpeg", "image/png", "image/webp"]),
        content: z.string().max(1500000),
      }),
    )
    .max(3),
});
export async function lookupTravel(raw: string): Promise<Travel> {
  const postcode = postcodeSchema.parse(raw).replace(/\s/g, "");
  const coordinates = await Promise.all(
    ["B664JB", postcode].map(async (p) => {
      const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(p)}`, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      });
      const data = await r.json();
      if (!r.ok || !data.result) throw Error("Postcode unavailable");
      return [Number(data.result.longitude), Number(data.result.latitude)] as [number, number];
    }),
  );

  const finish = (
    minutes: number,
    source: NonNullable<Travel["source"]>,
    approximate = false,
  ): Travel => {
    const rounded = Math.max(0, Math.ceil(minutes));
    const charge = travelCharge(rounded);
    const prefix = approximate ? "Approx." : "About";
    return {
      postcode,
      minutes: rounded,
      charge,
      source,
      message:
        charge === null
          ? `${prefix} ${rounded} minutes each way — longer journey, price agreed before booking.`
          : charge === 0
            ? `${prefix} ${rounded} minutes each way — travel included.`
            : `${prefix} ${rounded} minutes each way — £${charge} per visit travel supplement.`,
    };
  };

  if (process.env.SPERIN_ROUTING_API_KEY) {
    try {
      const r = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/json", {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: process.env.SPERIN_ROUTING_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ coordinates }),
      });
      const data = await r.json();
      const seconds = data.routes?.[0]?.summary?.duration;
      if (r.ok && typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0)
        return finish(seconds / 60, "openrouteservice");
    } catch {
      // Fall through to the no-key router below.
    }
  }

  try {
    const route = coordinates.map(([lon, lat]) => `${lon},${lat}`).join(";");
    const r = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${route}?overview=false&steps=false`,
      {
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "application/json",
          "User-Agent": "SperinServices/1.0 (info@sperinservices.co.uk)",
        },
      },
    );
    const data = await r.json();
    const seconds = data.routes?.[0]?.duration;
    if (r.ok && data.code === "Ok" && typeof seconds === "number" && Number.isFinite(seconds))
      return finish(seconds / 60, "osrm");
  } catch {
    // Fall through to a conservative postcode-distance estimate.
  }

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const [from, to] = coordinates;
  const lat1 = toRadians(from[1]);
  const lat2 = toRadians(to[1]);
  const dLat = lat2 - lat1;
  const dLon = toRadians(to[0] - from[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const straightKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // Conservative road approximation used only if live routing is unavailable.
  const estimatedRoadKm = straightKm * 1.3;
  const estimatedMinutes = (estimatedRoadKm / 48) * 60 + 5;
  return finish(estimatedMinutes, "fallback", true);
}

export async function bookingApi(req: Request): Promise<Response | null> {
  const url = new URL(req.url);
  if (url.pathname === "/api/pricing/travel-preview" && req.method === "GET") {
    const raw = url.searchParams.get("postcode") || "WV15 5EG";
    try {
      return json(await lookupTravel(raw));
    } catch {
      return json({ error: "Travel preview failed." }, 400);
    }
  }
  if (url.pathname === "/api/pricing/pdf-preview" && req.method === "GET") {
    const travel = await lookupTravel("WV15 5EG");
    const bytes = estimatePdf(
      { fcu: 1, pendant: 2, fan: 1, alarm: 1, doorbell: 1, board10: 1 },
      travel,
      "SS-PREVIEW",
      { postcode: "WV15 5EG" },
    );
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"Sperin-estimate-preview.pdf\"",
        "Cache-Control": "no-store",
      },
    });
  }
  if (!["/api/pricing/travel", "/api/pricing/pdf", "/api/pricing/booking"].includes(url.pathname))
    return null;
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  if (req.headers.get("origin") !== url.origin)
    return json({ error: "Request origin not allowed." }, 403);
  if (Number(req.headers.get("content-length")) > 3500000)
    return json({ error: "Photos are too large. Please choose smaller files." }, 413);
  try {
    const reader = req.body?.getReader();
    if (!reader) return json({ error: "Missing request." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 3500000) {
        await reader.cancel();
        return json({ error: "Photos are too large." }, 413);
      }
      chunks.push(value);
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return json({ error: "Invalid request." }, 400);
    }
    if (url.pathname.endsWith("/travel")) {
      const parsed = postcodeSchema.safeParse((body as { postcode?: unknown })?.postcode);
      if (!parsed.success) return json({ error: "Enter a full UK postcode." }, 400);
      try {
        return json(await lookupTravel(parsed.data));
      } catch {
        return json(
          { error: "We could not calculate travel for that postcode. Check it and try again." },
          400,
        );
      }
    }
    if (url.pathname.endsWith("/pdf")) {
      const parsed = pdfSchema.safeParse(body);
      if (!parsed.success) return json({ error: "Choose valid work for the estimate." }, 400);
      const p = parsed.data;
      const selected = JOBS.filter((job) => p.selection[job.id] > 0);
      if (!selected.length || Object.keys(p.selection).some((id) => !JOBS.some((job) => job.id === id)))
        return json({ error: "Choose a listed job." }, 400);
      for (const group of ["eicr", "board"])
        if (
          selected.filter((job) => job.group === group).length > 1 ||
          selected.some((job) => job.group === group && p.selection[job.id] !== 1)
        )
          return json({ error: "Choose one circuit range per package." }, 400);
      const travel = p.postcode
        ? await lookupTravel(postcodeSchema.parse(p.postcode))
        : undefined;
      const reference = `SS-${p.reference.slice(0, 8).toUpperCase()}`;
      const bytes = estimatePdf(p.selection, travel, reference, {
        postcode: p.postcode || undefined,
      });
      return new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${reference}-estimate.pdf"`,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return json(
        { error: "Please check your contact details, selected work and photographs." },
        400,
      );
    const p = parsed.data;
    const selected = JOBS.filter((j) => p.selection[j.id] > 0);
    if (!selected.length || Object.keys(p.selection).some((id) => !JOBS.some((j) => j.id === id)))
      return json({ error: "Choose a listed job." }, 400);
    for (const group of ["eicr", "board"])
      if (
        selected.filter((j) => j.group === group).length > 1 ||
        selected.some((j) => j.group === group && p.selection[j.id] !== 1)
      )
        return json({ error: "Choose one circuit range per package." }, 400);
    const total = estimate(p.selection);
    if (total.overlap && !p.overlapConfirmed)
      return json({ error: "Please confirm that you want a separate EICR assessed." }, 400);
    let bytes = 0;
    const attachments = p.photos.map((photo, index) => {
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(photo.content)) throw Error("photo");
      const file = Buffer.from(photo.content, "base64");
      bytes += file.length;
      const valid =
        photo.type === "image/jpeg"
          ? file[0] === 255 && file[1] === 216 && file[2] === 255
          : photo.type === "image/png"
            ? file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : file.toString("ascii", 0, 4) === "RIFF" && file.toString("ascii", 8, 12) === "WEBP";
      if (!valid || file.length > 1000000 || file.length < 12) throw Error("photo");
      return {
        filename: `job-photo-${index + 1}.${photo.type === "image/jpeg" ? "jpg" : photo.type.split("/")[1]}`,
        content: photo.content,
      };
    });
    if (bytes > 2200000)
      return json({ error: "Please keep all photographs below 2 MB in total." }, 413);
    const database = process.env.SPERIN_DATABASE_URL;
    if (!database || !process.env.SPERIN_RESEND_API_KEY)
      return json(
        { error: "Online requests are temporarily unavailable. Please call 07817 360156." },
        503,
      );
    const sql = neon(database, { fetchOptions: { signal: AbortSignal.timeout(10000) } });
    const fingerprint = createHmac("sha256", database)
      .update(
        "pricing:" +
          (req.headers.get("x-vercel-forwarded-for") ||
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "unknown"),
      )
      .digest("hex");
    const [limit] = await sql`select public.sperin_auth_attempt(${fingerprint},5) as allowed`;
    if (!limit?.allowed)
      return json({ error: "Too many attempts. Please try later or call us." }, 429);
    const travel = await lookupTravel(p.postcode);
    const reference = `SS-${p.reference.slice(0, 8).toUpperCase()}`;
    const lines = estimateLines(p.selection, travel, reference);
    attachments.push({
      filename: `${reference}-estimate.pdf`,
      content: Buffer.from(
        estimatePdf(p.selection, travel, reference, {
          customerName: p.name,
          address: p.address,
          postcode: p.postcode,
        }),
      ).toString("base64"),
    });
    const text = [
      `New booking request — ${reference}`,
      "Not a confirmed appointment.",
      `Name: ${p.name}`,
      `Email: ${p.email}`,
      `Phone: ${p.phone}`,
      `Address: ${p.address}`,
      `Postcode: ${p.postcode}`,
      `Preferred timing: ${p.timing}`,
      `Notes: ${p.notes}`,
      `Photographs: ${p.photos.length}`,
      ...lines,
    ].join("\n");
    const escaped = text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
    const digest = createHash("sha256").update(JSON.stringify(p)).digest("hex");
    await sendSperinEmail(
      "info@sperinservices.co.uk",
      {
        subject: `Sperin booking request ${reference}`,
        text,
        html: `<div style="font-family:Arial,sans-serif"><h1>Sperin Services</h1><pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escaped}</pre></div>`,
        reply_to: p.email,
        attachments,
      },
      `sperin-booking-${digest}`,
    );
    return json({ success: true, reference });
  } catch (error) {
    if (error instanceof Error && error.message === "photo")
      return json({ error: "Choose valid JPG, PNG or WebP photographs, up to 1 MB each." }, 400);
    console.error(
      "Sperin booking request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      {
        error:
          "We could not send your request. Your estimate is still here. Please retry or call 07817 360156.",
      },
      503,
    );
  }
}
