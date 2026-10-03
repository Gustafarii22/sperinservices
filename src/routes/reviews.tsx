import { useEffect, useMemo, useState } from "react";
import { GOOGLE_REVIEW_URL, type GoogleReview, type Review } from "@/lib/review-config";
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
        content:
          "Genuine customer feedback for Sperin Services, including approved website reviews and Google reviews.",
      },
      { property: "og:title", content: "Customer Reviews | Sperin Services" },
      {
        property: "og:description",
        content:
          "Read genuine customer feedback for Sperin Services and leave a review after completed work.",
      },
      { property: "og:url", content: "https://sperinservices.co.uk/reviews" },
    ],
  }),
  component: Reviews,
});

type GoogleFeed = {
  configured: boolean;
  reviews: GoogleReview[];
  averageRating?: number | null;
  totalReviewCount?: number | null;
};

function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [google, setGoogle] = useState<GoogleFeed>({ configured: false, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      fetch("/api/reviews").then(async (response) => {
        if (!response.ok) throw Error("Website reviews unavailable");
        return response.json() as Promise<{ reviews: Review[] }>;
      }),
      fetch("/api/google-reviews").then(async (response) => {
        if (!response.ok) throw Error("Google reviews unavailable");
        return response.json() as Promise<GoogleFeed>;
      }),
    ])
      .then(([websiteResult, googleResult]) => {
        if (!alive) return;
        if (websiteResult.status === "fulfilled") setReviews(websiteResult.value.reviews);
        else setError(true);
        if (googleResult.status === "fulfilled" && googleResult.value.configured)
          setGoogle(googleResult.value);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const combined = useMemo(
    () =>
      [
        ...reviews.map((review) => ({
          key: `website-${review.id}`,
          source: "website" as const,
          date: review.created_at,
          review,
        })),
        ...google.reviews.map((review) => ({
          key: `google-${review.id}`,
          source: "google" as const,
          date: review.created_at,
          review,
        })),
      ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [google.reviews, reviews],
  );

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
              Genuine feedback appears here from approved Sperin Services submissions and, once
              connected, directly from our verified Google Business Profile.
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
              Reviews submitted through this website are checked before publication. Google reviews
              are imported from the verified Sperin Services Business Profile and clearly labelled
              as Google reviews.
            </p>
            {google.configured &&
            typeof google.averageRating === "number" &&
            typeof google.totalReviewCount === "number" ? (
              <div className="rule mt-5 pt-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-electric">
                  Google rating
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {google.averageRating.toFixed(1)} / 5
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    from {google.totalReviewCount} reviews
                  </span>
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {loading ? (
          <p role="status">Loading customer feedback…</p>
        ) : error && combined.length === 0 ? (
          <p role="alert">Reviews are temporarily unavailable. Please refresh to try again.</p>
        ) : combined.length === 0 ? (
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
            {combined.map((item) =>
              item.source === "google" ? (
                <GoogleReviewCard key={item.key} review={item.review} />
              ) : (
                <WebsiteReviewCard key={item.key} review={item.review} />
              ),
            )}
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

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${
            n < rating ? "fill-current text-electric" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function WebsiteReviewCard({ review }: { review: Review }) {
  return (
    <article className="surface rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Sperin website
        </span>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words">{review.text}</p>
      {review.reply && (
        <blockquote className="mt-5 border-l border-electric/50 pl-4 text-sm text-muted-foreground">
          <strong>Sperin Services replies</strong>
          <p className="mt-2 whitespace-pre-wrap">{review.reply}</p>
        </blockquote>
      )}
      <div className="mt-5 text-sm font-bold">
        {review.name}
        {review.area ? ` · ${review.area}` : ""}
      </div>
      <div className="text-xs text-muted-foreground">
        {review.service} · {new Date(review.created_at).toLocaleDateString("en-GB")}
      </div>
    </article>
  );
}

function GoogleReviewCard({ review }: { review: GoogleReview }) {
  return (
    <article className="surface rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        <span className="rounded-full border border-electric/25 bg-electric/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-electric">
          Google review
        </span>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words">
        {review.text || `Rated Sperin Services ${review.rating} out of 5 on Google.`}
      </p>
      <div className="mt-5 text-sm font-bold">{review.reviewer}</div>
      <div className="text-xs text-muted-foreground">
        Google · {new Date(review.created_at).toLocaleDateString("en-GB")}
      </div>
    </article>
  );
}
