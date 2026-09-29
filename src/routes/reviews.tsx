import { useEffect, useState } from "react";
import { GOOGLE_REVIEW_URL, type Review } from "@/lib/review-config";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareQuote, ShieldCheck, Star } from "lucide-react";
import { CTA } from "@/components/CTA";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://sperinservices.co.uk/reviews" }],
    meta: [
      { title: "Customer Reviews | Sperin Services" },
      {
        name: "description",
        content: "Genuine customer feedback for Sperin Services electrical and installation work.",
      },
    ],
  }),
  component: Reviews,
});

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/reviews")
      .then(async (r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        if (alive) setReviews(data.reviews);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-12 lg:px-8 lg:pt-18">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="eyebrow">Customer reviews</span>
            <h1 className="display-title mt-5 text-5xl sm:text-6xl lg:text-7xl">
              Your experience matters.
            </h1>
            <p className="mt-5 max-w-2xl text-muted-foreground">
              Only genuine, approved customer reviews will appear here. New submissions are held for
              moderation before publication.
            </p>
            <Link to="/leave-a-review" className="button-primary mt-7">
              Leave a review <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="button-secondary mt-3 sm:ml-3"
            >
              Review us on Google ↗
            </a>
          </div>
          <aside className="surface-raised rounded-2xl p-7">
            <ShieldCheck className="h-7 w-7 text-electric" />
            <h2 className="mt-5 text-2xl font-bold">Feedback from the people we work for.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We check each submission against the work completed before publishing it. Ratings and
              totals are based only on genuine, approved reviews.
            </p>
          </aside>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {loading ? (
          <p role="status">Loading customer feedback…</p>
        ) : error ? (
          <p role="alert">Reviews are temporarily unavailable. Please refresh to try again.</p>
        ) : reviews.length === 0 ? (
          <div className="surface rounded-2xl p-8 text-center sm:p-12">
            <MessageSquareQuote className="mx-auto h-8 w-8 text-electric" />
            <h2 className="mt-5 text-3xl font-bold">The review book starts with real customers.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Customer feedback will appear here after it has been checked and approved. Had work
              completed by Sperin Services? We’d welcome your experience.
            </p>
            <Link to="/leave-a-review" className="button-secondary mt-6">
              Be the first to leave feedback
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {reviews.map((r) => (
              <article key={r.id} className="surface rounded-2xl p-6">
                <div className="flex gap-1" aria-label={`${r.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, n) => (
                    <Star
                      key={n}
                      className={`h-4 w-4 ${n < r.rating ? "fill-current text-electric" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words">{r.text}</p>
                {r.reply && (
                  <blockquote className="mt-5 border-l border-electric/50 pl-4 text-sm text-muted-foreground">
                    <strong>Sperin Services replies</strong>
                    <p className="mt-2 whitespace-pre-wrap">{r.reply}</p>
                  </blockquote>
                )}
                <div className="mt-5 text-sm font-bold">
                  {r.name} · {r.area}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.service} · {new Date(r.created_at).toLocaleDateString("en-GB")}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <CTA
        title="Ready to discuss your job?"
        subtitle="Tell us what you need and we’ll come back with the right next step."
      />
    </>
  );
}
