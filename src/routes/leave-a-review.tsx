import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useState, useRef, useEffect } from "react";
import { CheckCircle2, Star } from "lucide-react";
import {
  GOOGLE_REVIEW_URL,
  REVIEW_DATABASE_URL,
  REVIEW_PUBLIC_KEY,
  REVIEW_ANON_JWT,
} from "@/lib/review-config";

export const Route = createFileRoute("/leave-a-review")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/leave-a-review" }],
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
  const requestId = useRef("");
  const confirmation = useRef<HTMLHeadingElement>(null);
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (sent) {
      confirmation.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [sent]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return;
    setSending(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const response = await fetch(`${REVIEW_DATABASE_URL}/functions/v1/sperin-review-submit`, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          apikey: REVIEW_PUBLIC_KEY,
          Authorization: `Bearer ${REVIEW_ANON_JWT}`,
        },
        body: JSON.stringify({
          request_id: requestId.current,
          rating,
          name: data.get("name"),
          area: data.get("area"),
          service: data.get("service"),
          job_reference: data.get("job"),
          text: data.get("review"),
          consent: data.get("consent") === "yes",
          website: data.get("website") || "",
        }),
      });
      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== "true"))
        throw new Error(result.error || "We could not save your review. Please try again.");
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name !== "TimeoutError"
          ? cause.message
          : "The connection timed out. Your review is still here. Please try again; it will not be saved twice.",
      );
    } finally {
      setSending(false);
    }
  }
  if (sent)
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-electric" />
        <h1 ref={confirmation} tabIndex={-1} className="mt-5 text-4xl font-bold">
          Thank you.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your review has been saved and is awaiting approval. It will only appear publicly after
          Gus has checked it.
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
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noreferrer"
        className="button-secondary mt-5"
      >
        Prefer Google? Leave a Google review ↗
      </a>
      <form onSubmit={submit} className="surface-raised mt-8 space-y-5 rounded-2xl p-6 sm:p-8">
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div>
          <p className="text-sm font-bold">Rating</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
                aria-pressed={rating === n}
              >
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
        maxLength={100}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-4 outline-none focus:border-electric/50"
      />
    </div>
  );
}
