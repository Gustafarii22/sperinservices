import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/leave-a-review")({
  head: () => ({
    meta: [
      { title: "Leave a Review | Sperin Services" },
      {
        name: "description",
        content: "Share genuine feedback about work completed by Sperin Services.",
      },
    ],
  }),
  component: LeaveReview,
});

function LeaveReview() {
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return;
    setSending(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Customer review awaiting moderation",
          _template: "table",
          rating,
          name: data.get("name"),
          area: data.get("area"),
          service: data.get("service"),
          job_reference: data.get("job"),
          review: data.get("review"),
          consent: data.get("consent"),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error("Delivery failed");
      setSent(true);
    } catch {
      setError("We could not send your review. Please try again or contact us directly.");
    } finally {
      setSending(false);
    }
  }
  if (sent)
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-electric" />
        <h1 className="mt-5 text-4xl font-bold">Thank you.</h1>
        <p className="mt-3 text-muted-foreground">
          Your review has been delivered for manual review. It will only appear publicly if
          approved.
        </p>
        <Link to="/reviews" className="button-primary mt-7">
          Back to reviews
        </Link>
      </section>
    );
  return (
    <section className="mx-auto max-w-3xl px-4 py-14 lg:px-8">
      <span className="eyebrow">Customer feedback</span>
      <h1 className="display-title mt-5 text-5xl sm:text-6xl">Leave a review.</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        If Sperin Services completed work for you, you can send your feedback here. Reviews are
        checked manually before publication.
      </p>
      <form onSubmit={submit} className="surface-raised mt-8 space-y-5 rounded-2xl p-6 sm:p-8">
        <div>
          <label className="text-sm font-bold">Rating</label>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star
                  className={`h-8 w-8 ${n <= rating ? "fill-current text-electric" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required />
          <Field label="Town / area" name="area" />
          <Field label="Service used" name="service" required />
          <Field label="Job reference (if known)" name="job" />
        </div>
        <div>
          <label className="text-sm font-bold" htmlFor="review">
            Your review
          </label>
          <textarea
            id="review"
            name="review"
            required
            minLength={20}
            className="mt-2 min-h-36 w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"
          />
        </div>
        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input type="checkbox" name="consent" value="yes" required className="mt-1" /> I confirm
          this is my genuine experience and consent to the review being displayed publicly after
          approval.
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        <button disabled={!rating || sending} className="button-primary disabled:opacity-40">
          {sending ? "Sending…" : "Submit review"}
        </button>
      </form>
    </section>
  );
}
function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-bold" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        required={required}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"
      />
    </div>
  );
}
