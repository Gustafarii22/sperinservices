import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Download, ArrowRight, Check, MapPin } from "lucide-react";
import {
  JOBS,
  estimate,
  money,
  CONDITIONS,
  type Selection,
  type Travel,
} from "@/lib/pricing";
export const Route = createFileRoute("/pricing")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/pricing" }],
    meta: [
      { title: "Electrical Prices & Estimate Calculator | Sperin Services" },
      {
        name: "description",
        content:
          "Clear electrical prices in Birmingham and the West Midlands. Build an estimate, download a PDF and request a visit with job photographs.",
      },
      { property: "og:title", content: "Clear prices. Considered work. | Sperin Services" },
      { property: "og:url", content: "https://sperinservices.co.uk/pricing" },
    ],
  }),
  component: Pricing,
});
const field =
  "mt-2 w-full rounded-md border border-white/20 bg-black/20 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-electric";
type Photo = { name: string; type: "image/jpeg"; content: string };
async function preparePhoto(file: File): Promise<Photo> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15000000)
    throw Error(
      "Choose JPG, PNG or WebP images up to 15 MB each. Convert HEIC photographs to JPG first.",
    );
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw Error("Photo processing unavailable. Please try another browser.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Re-encoding reduces mobile uploads and removes camera metadata.
  const content = canvas.toDataURL("image/jpeg", 0.72).split(",")[1];
  if (content.length > 1000000)
    throw Error("This image is too detailed. Please use a smaller photograph.");
  return { name: file.name, type: "image/jpeg", content };
}
function Pricing() {
  const [selection, setSelection] = useState<Selection>({});
  const [postcode, setPostcode] = useState("");
  const [travel, setTravel] = useState<Travel>();
  const [checking, setChecking] = useState(false);
  const [travelError, setTravelError] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [overlapConfirmed, setOverlapConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [reference, setReference] = useState("");
  const e = estimate(selection);
  const total = e.subtotal + (travel?.charge || 0);
  const incomplete = !!e.unknown.length || travel?.charge == null;
  function ref() {
    if (reference) return reference;
    const next = crypto.randomUUID();
    setReference(next);
    return next;
  }
  function change(id: string, delta: number) {
    setSent("");
    setOverlapConfirmed(false);
    setSelection((current) => {
      const job = JOBS.find((j) => j.id === id)!;
      const next = { ...current };
      if (job.group && delta > 0)
        JOBS.filter((j) => j.group === job.group).forEach((j) => delete next[j.id]);
      next[id] = Math.max(0, Math.min(job.group ? 1 : 20, (current[id] || 0) + delta));
      return next;
    });
  }
  async function checkTravel() {
    setChecking(true);
    setTravelError("");
    setTravel(undefined);
    try {
      const response = await fetch("/api/pricing/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setTravel(data);
    } catch (err) {
      setTravelError(
        err instanceof Error
          ? err.message
          : "Could not check travel. We will confirm before booking.",
      );
    } finally {
      setChecking(false);
    }
  }
  async function download() {
    if (!e.count || pdfBusy) return;
    const id = ref();
    setPdfBusy(true);
    setPdfError("");
    try {
      const response = await fetch("/api/pricing/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selection,
          postcode: postcode.trim().toUpperCase(),
          reference: id,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw Error(result.error || "Could not create the estimate PDF.");
      }
      const blob = await response.blob();
      if (blob.type !== "application/pdf" || blob.size < 500)
        throw Error("The estimate PDF was not created correctly.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sperin-Services-estimate-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : "Could not create the PDF. Please try again.",
      );
    } finally {
      setPdfBusy(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent("");
    if (!e.count) return setError("Choose at least one job above.");
    const data = new FormData(event.currentTarget);
    setSending(true);
    try {
      const response = await fetch("/api/pricing/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          address: data.get("address"),
          postcode,
          timing: data.get("timing"),
          notes: data.get("notes"),
          website: data.get("website"),
          consent: data.get("consent") === "on",
          selection,
          photos,
          reference: ref(),
          overlapConfirmed,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw Error(result.error || "Request could not be sent.");
      setSent(result.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send. Please call 07817 360156.");
    } finally {
      setSending(false);
    }
  }
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 lg:px-8 lg:pt-20">
        <span className="eyebrow">Sperin / Prices & planning</span>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <h1 className="display-title max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
            Clear prices.
            <br />
            <span className="text-electric">Considered work.</span>
          </h1>
          <div className="max-w-lg">
            <p className="text-lg leading-relaxed text-muted-foreground">
              Know where you stand before you get in touch. Choose the work you need, keep a copy of
              your estimate and send us the details.
            </p>
            <p className="mt-4 text-sm">No VAT added — Sperin Services is not VAT registered.</p>
          </div>
        </div>
        <div className="mt-10 grid divide-y divide-white/15 border-y border-white/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["£75", "First hour on site", "Local weekday visit, including attendance."],
            ["£50", "Each further hour", "Billed at £25 per started half-hour."],
            ["£350", "Eight-hour day", "Pre-booked electrician. Mate +£200/day."],
          ].map(([price, title, detail]) => (
            <div key={title} className="py-6 sm:px-6 first:sm:pl-0">
              <div className="text-4xl font-semibold tracking-tight">{price}</div>
              <h2 className="mt-2 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Fault finding uses the same hourly rates. Evenings from 7pm and all Saturday/Sunday
          visits:{" "}
          <strong className="text-foreground">£140 for the first hour, then £70/hour</strong>.
          Availability and scope agreed before booking. A day rate replaces hourly attendance
          charges.
        </p>
      </section>
      <section id="estimate" className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">01 / Choose your work</span>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Build your estimate</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Weekday daytime guide prices. Multiple small jobs share one visit allowance — you don’t
            pay a call-out for every item.
          </p>
        </div>
        <div className="grid items-start gap-10 xl:grid-cols-[1fr_370px]">
          <div>
            {["replacements", "packages"].map((group) => (
              <div key={group} className="mb-10">
                <h3 className="border-b border-white/20 pb-4 text-xl font-semibold">
                  {group === "replacements"
                    ? "Straightforward replacements"
                    : "Inspection & consumer units"}
                </h3>
                {JOBS.filter((j) => (group === "packages" ? !!j.group : !j.group)).map((j) => (
                  <article key={j.id} className="border-b border-white/10 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="font-semibold leading-snug">{j.name}</h4>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                          {j.detail}
                        </p>
                        <p className="mt-3 text-sm">
                          <strong>From {money(j.price)}</strong>
                          {j.additional !== undefined && (
                            <span className="text-muted-foreground">
                              {" "}
                              · additional same visit from {money(j.additional)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {j.group ? "One package per circuit range" : "Quantity"}
                      </span>
                      <div className="flex items-center rounded-md border border-white/20">
                        <button
                          type="button"
                          aria-label={`Remove ${j.name}`}
                          disabled={!selection[j.id]}
                          onClick={() => change(j.id, -1)}
                          className="p-3 disabled:opacity-30 hover:bg-white/10"
                        >
                          <Minus size={18} />
                        </button>
                        <output
                          aria-label={`${j.name} quantity`}
                          className="min-w-10 text-center font-semibold"
                        >
                          {selection[j.id] || 0}
                        </output>
                        <button
                          type="button"
                          aria-label={`Add ${j.name}`}
                          disabled={selection[j.id] >= (j.group ? 1 : 20)}
                          onClick={() => change(j.id, 1)}
                          className="p-3 disabled:opacity-30 hover:bg-white/10"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
            <p className="text-sm leading-relaxed text-muted-foreground">
              Consumer-unit replacements need assessment first. Existing faults, bonding upgrades
              and moving the board cost extra. New circuits, new socket positions, rewires, larger
              installations and commercial inspections need a{" "}
              <Link to="/contact" className="underline text-foreground">
                tailored quotation
              </Link>
              .
            </p>
          </div>
          <aside
            className="border border-white/15 bg-white/[0.035] p-5 sm:p-7 xl:sticky xl:top-28"
            aria-label="Your estimate"
          >
            <span className="eyebrow">02 / Your estimate</span>
            <h3 className="mt-3 text-2xl font-semibold">The work, itemised.</h3>
            {!e.count ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Use the quantity buttons to add your jobs. Your breakdown will appear here.
              </p>
            ) : (
              <ul className="mt-6 space-y-4 text-sm">
                {e.rows.map((j) => (
                  <li key={j.id} className="flex justify-between gap-4">
                    <span>
                      {j.quantity} × {j.name}
                    </span>
                    <span className="shrink-0 font-semibold">
                      {e.unknown.includes(j.id) ? "Assess" : money(j.amount)}
                    </span>
                  </li>
                ))}
                {e.visit > 0 && (
                  <li className="flex justify-between gap-4 text-muted-foreground">
                    <span>Single visit allowance</span>
                    <span>{money(e.visit)}</span>
                  </li>
                )}
              </ul>
            )}
            {e.overlap && (
              <label className="mt-5 flex items-start gap-3 border-l-2 border-electric pl-3 text-sm">
                <input
                  type="checkbox"
                  checked={overlapConfirmed}
                  onChange={(event) => setOverlapConfirmed(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  A consumer-unit package already includes its installation testing and certificate.
                  I would also like a <strong>separate whole-property EICR</strong> assessed. Gus
                  will confirm whether both are needed.
                </span>
              </label>
            )}
            <div className="mt-6 border-t border-white/15 pt-5">
              <label htmlFor="travel-postcode" className="flex items-center gap-2 font-semibold">
                <MapPin size={16} />
                Check travel
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="travel-postcode"
                  name="postcode"
                  autoComplete="postal-code"
                  maxLength={10}
                  placeholder="Your postcode"
                  className={`${field} min-w-0 !mt-0 uppercase`}
                  value={postcode}
                  onChange={(event) => {
                    setPostcode(event.target.value.toUpperCase());
                    setTravel(undefined);
                    setSent("");
                  }}
                />
                <button
                  type="button"
                  onClick={checkTravel}
                  disabled={checking || !postcode.trim()}
                  className="button-secondary !px-3 text-sm disabled:opacity-50"
                >
                  {checking ? "Checking…" : "Check"}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Up to 35 minutes included; 36–50 minutes +£15; 51–65 minutes +£25 per visit. Longer
                journeys agreed individually.
              </p>
              <p role="status" className="mt-3 text-sm">
                {travel?.message}
              </p>
              {travelError && (
                <p role="alert" className="mt-2 text-sm text-red-300">
                  {travelError}
                </p>
              )}
              {travel?.minutes !== undefined && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Estimated road journey, without live traffic. Routing: openrouteservice /
                  OpenStreetMap contributors.
                </p>
              )}
            </div>
            <div
              className="mt-6 border-t border-white/15 pt-5"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-sm text-muted-foreground">
                {incomplete ? "Estimated priced subtotal" : "Estimated total"}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{money(total)}</p>
              {e.unknown.length > 0 && (
                <p className="mt-3 text-sm text-amber-200">
                  Items marked “Assess” are not included. We’ll price these together after checking
                  the job.
                </p>
              )}
              {travel?.charge == null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Travel supplement, if applicable, still to be confirmed.
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                No VAT added. Final fixed quotation after assessment.
              </p>
            </div>
            <button
              type="button"
              disabled={!e.count || pdfBusy}
              onClick={download}
              className="button-secondary mt-6 w-full disabled:opacity-40"
            >
              <Download size={17} />
              {pdfBusy ? "Creating letterheaded PDF…" : "Download estimate PDF"}
            </button>
            {pdfError && (
              <p role="alert" className="mt-2 text-sm text-red-300">
                {pdfError}
              </p>
            )}
            <a href="#booking" className="button-primary mt-3 w-full">
              Request this booking <ArrowRight size={17} />
            </a>
          </aside>
        </div>
      </section>
      <section id="booking" className="mx-auto mt-16 max-w-7xl scroll-mt-28 px-4 lg:px-8">
        <div className="grid gap-10 border-t border-white/20 pt-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="eyebrow">03 / Send the details</span>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Let’s check the job.</h2>
            <p className="mt-4 text-muted-foreground">
              Send your selected work and optional photographs. Gus will confirm the scope, price
              and availability before you commit.
            </p>
            <ul className="mt-7 space-y-4 text-sm text-muted-foreground">
              {CONDITIONS.slice(0, 4).map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            {(
              [
                ["name", "Your name", "text", "name"],
                ["email", "Email", "email", "email"],
                ["phone", "Phone", "tel", "tel"],
                ["address", "Job address", "text", "street-address"],
              ] as const
            ).map(([name, label, type, auto]) => (
              <label key={name} className="text-sm font-semibold">
                {label}
                <input
                  className={field}
                  name={name}
                  type={type}
                  autoComplete={auto}
                  required
                  maxLength={name === "address" ? 300 : 100}
                />
              </label>
            ))}
            <label className="text-sm font-semibold">
              Job postcode
              <input
                className={field}
                value={postcode}
                onChange={(event) => {
                  setPostcode(event.target.value.toUpperCase());
                  setTravel(undefined);
                }}
                required
                autoComplete="postal-code"
                maxLength={10}
              />
            </label>
            <label className="text-sm font-semibold">
              Preferred timing
              <input
                className={field}
                name="timing"
                required
                maxLength={150}
                placeholder="e.g. Weekday mornings, flexible"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              Anything else we should know?{" "}
              <span className="font-normal text-muted-foreground">Optional</span>
              <textarea
                className={field}
                name="notes"
                rows={4}
                maxLength={2500}
                placeholder="Access, existing fittings, or a preferred evening/weekend visit. Out-of-hours work is priced separately."
              />
            </label>
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold">
                Job photographs{" "}
                <span className="font-normal text-muted-foreground">Optional — up to three</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={photoBusy || sending}
                  className={`${field} text-sm`}
                  onChange={async (event) => {
                    const files = Array.from(event.target.files || []);
                    setPhotoError("");
                    setPhotos([]);
                    if (files.length > 3) {
                      setPhotoError("Choose up to three photographs.");
                      event.target.value = "";
                      return;
                    }
                    setPhotoBusy(true);
                    try {
                      setPhotos(await Promise.all(files.map(preparePhoto)));
                    } catch (err) {
                      setPhotoError(
                        err instanceof Error ? err.message : "Could not prepare photographs.",
                      );
                    } finally {
                      setPhotoBusy(false);
                    }
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG, PNG or WebP. Photographs are resized before sending and remain private. Avoid
                including people or sensitive documents.
              </p>
              <p role="status" className="mt-2 text-sm">
                {photoBusy
                  ? "Preparing photographs…"
                  : photos.length
                    ? `${photos.length} photograph(s) ready to attach.`
                    : ""}
              </p>
              {photoError && (
                <p role="alert" className="text-sm text-red-300">
                  {photoError}
                </p>
              )}
              {photos.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotos([]);
                    const input = document.querySelector<HTMLInputElement>("input[type=file]");
                    if (input) input.value = "";
                  }}
                  className="mt-2 text-sm underline"
                >
                  Remove photographs
                </button>
              )}
            </div>
            <label className="absolute -left-[10000px]" aria-hidden="true">
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input name="consent" type="checkbox" required className="mt-1" />
              <span>
                I understand this is an estimate and a booking request. Please use my details and
                photographs to assess the job and contact me.{" "}
                <Link to="/privacy" className="underline">
                  Privacy policy
                </Link>
                .
              </span>
            </label>
            <div className="sm:col-span-2">
              <p className="mb-4 text-sm">
                {e.count} selected item(s) · {money(total)}{" "}
                {incomplete ? "priced subtotal" : "estimated total"}
              </p>
              <button
                type="submit"
                disabled={
                  sending ||
                  photoBusy ||
                  !!photoError ||
                  !e.count ||
                  !!sent ||
                  (e.overlap && !overlapConfirmed)
                }
                className="button-primary w-full sm:w-auto disabled:opacity-40"
              >
                {sending ? "Sending request…" : "Request this booking"}
                <ArrowRight size={17} />
              </button>
            </div>
            {error && (
              <p role="alert" className="text-red-300 sm:col-span-2">
                {error}
              </p>
            )}
            {sent && (
              <div role="status" className="border-l-2 border-green-400 pl-4 sm:col-span-2">
                <p className="font-semibold">Request sent — {sent}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your estimate and photographs have been sent to Sperin Services. Gus will reply to
                  confirm the details and availability. Your appointment is not yet booked.
                </p>
              </div>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
