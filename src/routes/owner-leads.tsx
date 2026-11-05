import { SperinOwnerSignIn } from "@/components/SperinOwnerSignIn";
import {
  parseHamuchLead,
  recommendHamuchLead,
  prepareHamuchReply,
  type HamuchLead,
} from "@/lib/hamuch-leads";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ClipboardPaste, Copy, Mail, RefreshCw, Send, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/owner-leads")({
  head: () => ({
    meta: [
      { title: "Private HaMuch Lead Desk | Sperin Services" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: OwnerLeads,
});

const blankLead: HamuchLead = { name: "", email: "", phone: "", postcode: "", description: "" };
const field =
  "mt-2 w-full rounded-md border border-border bg-muted px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-electric";

function OwnerLeads() {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [raw, setRaw] = useState("");
  const [lead, setLead] = useState<HamuchLead>(blankLead);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const recommendation = recommendHamuchLead(lead);

  useEffect(() => {
    let alive = true;
    fetch("/api/owner/session", { credentials: "same-origin" })
      .then((r) => {
        if (alive) setSignedIn(r.ok);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  function readJob() {
    const extracted = parseHamuchLead(raw);
    setLead(extracted);
    const prepared = prepareHamuchReply(extracted, recommendHamuchLead(extracted));
    setSubject(prepared.subject);
    setMessage(prepared.message);
    setApproved(false);
    setNotice("");
    setError("");
  }

  function setDetail(fieldName: keyof HamuchLead, value: string) {
    setLead((prev) => ({ ...prev, [fieldName]: value }));
    setApproved(false);
  }

  function regenerate() {
    const prepared = prepareHamuchReply(lead, recommendation);
    setSubject(prepared.subject);
    setMessage(prepared.message);
    setApproved(false);
    setNotice("Updated draft using the current job details and pricing.");
  }

  async function copyReply() {
    try {
      await navigator.clipboard.writeText("Subject: " + subject + "\n\n" + message);
      setNotice("Reply copied. You can paste it into your email or HaMuch.");
    } catch {
      setError("Copy unavailable on this device. Select and copy the reply text instead.");
    }
  }

  async function sendApproved() {
    setError("");
    setNotice("");
    if (!approved || busy || !subject.trim() || !message.trim()) return;
    if (!window.confirm("Send this exact email to " + lead.email + "?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/owner/hamuch/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: lead.email, subject, message, approved: true }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Email was not sent.");
      setNotice(
        "Email accepted by the sending provider. The customer can reply to your business address.",
      );
      setApproved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send the email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <span className="eyebrow">Private owner area</span>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">HaMuch lead desk</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Turn an enquiry into a sensible estimate and a ready-to-send customer reply. Every price is
        indicative until you confirm the scope. Nothing is sent without your approval.
      </p>
      {!ready ? (
        <p className="mt-8" role="status">
          Checking your owner sign-in…
        </p>
      ) : !signedIn ? (
        <SperinOwnerSignIn onSignedIn={async () => setSignedIn(true)} />
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck size={18} className="text-electric" />
              Owner-only. Enquiry details are not saved to this browser or published.
            </span>
            <Link to="/owner-reviews" className="underline text-electric">
              Review desk
            </Link>
          </div>
          <div className="mt-6 rounded-xl border border-border bg-foreground/[0.025] p-4 sm:p-6">
            <label htmlFor="hamuch-raw" className="block font-semibold">
              1. Paste the HaMuch job email
            </label>
            <textarea
              id="hamuch-raw"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className={field}
              rows={7}
              maxLength={16000}
              placeholder="New job: Customer Name, B93 8LE ... Fit a wired smart doorbell ..."
            />
            <button
              type="button"
              onClick={readJob}
              disabled={!raw.trim()}
              className="button-primary mt-3 disabled:opacity-40"
            >
              <ClipboardPaste size={18} /> Read enquiry & prepare reply
            </button>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-xl font-semibold">2. Check customer details</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="col-span-2 text-sm font-medium">
                  Name
                  <input
                    className={field}
                    value={lead.name}
                    onChange={(e) => setDetail("name", e.target.value)}
                    maxLength={80}
                  />
                </label>
                <label className="col-span-2 text-sm font-medium">
                  Customer email
                  <input
                    type="email"
                    className={field}
                    value={lead.email}
                    onChange={(e) => setDetail("email", e.target.value)}
                    maxLength={254}
                    autoComplete="off"
                  />
                </label>
                <label className="text-sm font-medium">
                  Postcode
                  <input
                    className={field}
                    value={lead.postcode}
                    onChange={(e) => setDetail("postcode", e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </label>
                <label className="text-sm font-medium">
                  Phone
                  <input
                    className={field}
                    value={lead.phone}
                    onChange={(e) => setDetail("phone", e.target.value)}
                    maxLength={30}
                  />
                </label>
                <label className="col-span-2 text-sm font-medium">
                  Work requested
                  <textarea
                    className={field}
                    rows={5}
                    value={lead.description}
                    onChange={(e) => setDetail("description", e.target.value)}
                    maxLength={1300}
                  />
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-border p-4 sm:p-6">
              <h2 className="text-xl font-semibold">3. Recommended approach</h2>
              <p className="mt-5 text-sm text-muted-foreground">{recommendation.category}</p>
              <p className="mt-2 text-2xl font-semibold">{recommendation.price}</p>
              <p className="mt-4 text-sm leading-relaxed">{recommendation.rationale}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {recommendation.guidance}
              </p>
              <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
                Standard weekday: £60 first hour · £40 each additional hour · £300 day. EICR from
                £160 · consumer units from £650. Travel and materials assessed separately.
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">4. Review your reply</h2>
              <button type="button" className="button-secondary" onClick={regenerate}>
                <RefreshCw size={16} /> Regenerate from details
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium">
              Subject
              <input
                className={field}
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setApproved(false);
                }}
                maxLength={160}
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Email text (edit before sending)
              <textarea
                className={field}
                rows={13}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setApproved(false);
                }}
                maxLength={5000}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="button-secondary"
                disabled={!message.trim()}
                onClick={copyReply}
              >
                <Copy size={17} /> Copy reply
              </button>
            </div>
            <label className="mt-6 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={approved}
                onChange={(e) => setApproved(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              <span>
                I have checked the customer's address, job details, estimated price and wording. I
                approve sending this email to the customer.
              </span>
            </label>
            <button
              type="button"
              className="button-primary mt-4 disabled:opacity-40"
              disabled={
                !approved ||
                busy ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) ||
                !message.trim() ||
                !subject.trim()
              }
              onClick={sendApproved}
            >
              {busy ? <RefreshCw size={18} /> : <Send size={18} />}
              {busy ? "Sending…" : "Approve & send email"}
            </button>
            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Mail size={15} className="shrink-0" />
              Emails are sent using your existing Sperin Services provider, with replies directed to
              info@sperinservices.co.uk. Incoming HaMuch emails are not connected automatically yet.
            </p>
            {notice && (
              <p
                role="status"
                className="mt-4 flex items-start gap-2 text-sm text-green-600 dark:text-green-400"
              >
                <Check size={17} /> {notice}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-500">
                {error}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
