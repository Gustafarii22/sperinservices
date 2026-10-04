import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MessageSquareQuote, Star } from "lucide-react";
import type { GoogleReview, Review } from "@/lib/review-config";

type GoogleFeed = {
  configured: boolean;
  reviews: GoogleReview[];
  averageRating?: number | null;
  totalReviewCount?: number | null;
};

export function ReviewPreview() {
  const [website, setWebsite] = useState<Review[]>([]);
  const [google, setGoogle] = useState<GoogleFeed>({ configured: false, reviews: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      fetch("/api/reviews").then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch("/api/google-reviews").then((r) => (r.ok ? r.json() : Promise.reject())),
    ]).then(([site, googleResult]) => {
      if (!alive) return;
      if (site.status === "fulfilled") setWebsite(site.value.reviews || []);
      if (googleResult.status === "fulfilled" && googleResult.value.configured)
        setGoogle(googleResult.value);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(
    () =>
      [
        ...website.map((review) => ({
          key: `site-${review.id}`,
          rating: review.rating,
          text: review.text,
          name: review.name,
          source: "Website",
          date: review.created_at,
        })),
        ...google.reviews.map((review) => ({
          key: `google-${review.id}`,
          rating: review.rating,
          text: review.text || `Rated Sperin Services ${review.rating} out of 5 on Google.`,
          name: review.reviewer,
          source: "Google",
          date: review.created_at,
        })),
      ]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .slice(0, 3),
    [website, google.reviews],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="flex items-end justify-between gap-5 border-b border-white/10 pb-5">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">What customers say.</p>
        </div>
        <Link
          to="/reviews"
          className="hidden items-center gap-2 text-sm font-bold text-electric sm:inline-flex"
        >
          All reviews <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {!ready ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3" aria-label="Loading reviews">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-md bg-white/[0.035]" />
          ))}
        </div>
      ) : items.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.key} className="surface p-5">
              <div className="flex gap-1" aria-label={`${item.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n < item.rating ? "fill-current text-electric" : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/88">
                {item.text}
              </p>
              <p className="mt-4 text-xs font-semibold text-muted-foreground">
                {item.name} · {item.source}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4 border border-white/10 bg-white/[0.018] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-electric" />
            <div>
              <p className="font-semibold">Genuine reviews only.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Approved website reviews and Google Business Profile reviews appear here
                automatically as they become available.
              </p>
            </div>
          </div>
          <Link to="/reviews" className="text-sm font-bold text-electric">
            Reviews <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      )}

      {google.configured &&
      typeof google.averageRating === "number" &&
      typeof google.totalReviewCount === "number" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Google rating:{" "}
          <strong className="text-foreground">{google.averageRating.toFixed(1)} / 5</strong>
          {" · "}
          {google.totalReviewCount} reviews
        </p>
      ) : null}
    </section>
  );
}
