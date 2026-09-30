import { SperinOwnerSignIn } from "@/components/SperinOwnerSignIn";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, EyeOff, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { GOOGLE_REVIEW_URL, type Review } from "@/lib/review-config";
export const Route = createFileRoute("/owner-reviews")({
  head: () => ({
    meta: [
      { title: "Review management | Sperin Services" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OwnerReviews,
});
async function api(path: string, body?: unknown) {
  const r = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data.error || "Request failed."), { status: r.status });
  return data;
}
function OwnerReviews() {
  const [independent, setIndependent] = useState(false);
  const [selectedReview, setSelectedReview] = useState("");
  const [ready, setReady] = useState(false),
    [signedIn, setSignedIn] = useState(false),
    [reviews, setReviews] = useState<Review[]>([]),
    [filter, setFilter] = useState<Review["status"]>("pending"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(""),
    [showPassword, setShowPassword] = useState(false);
  const load = async () => {
    const data = await api("/api/owner/reviews");
    setReviews(data.reviews);
    const selected = new URLSearchParams(window.location.search).get("review");
    const target = data.reviews.find((r: Review) => r.id === selected);
    if (target) {
      setFilter(target.status);
      setSelectedReview(target.id);
    }
  };
  useEffect(() => {
    let alive = true;
    api("/api/review-settings")
      .then((s) =>
        api("/api/owner/session")
          .then((session) => ({ ...session, independent: s.independent }))
          .catch(() => ({ independent: s.independent, signedOut: true })),
      )
      .then((session) => {
        if (alive) {
          setIndependent(session.independent);
          if (session.signedOut) return;
          setSignedIn(true);
          void load().catch((e) => setError(e.message));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("login");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/api/owner/login", { email: form.get("email"), password: form.get("password") });
      setSignedIn(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy("");
    }
  }
  async function update(review: Review, status: Review["status"], reply = review.reply) {
    setBusy(review.id);
    setError("");
    setNotice("");
    try {
      const data = await api(`/api/owner/reviews/${review.id}`, { status, reply });
      setReviews((rows) => rows.map((r) => (r.id === review.id ? { ...r, ...data.review } : r)));
      setNotice(
        status === "approved"
          ? "Review approved. It is now visible on the website."
          : status === "rejected"
            ? "Review hidden from the website. You can restore it at any time."
            : "Review returned to the pending queue.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update.");
    } finally {
      setBusy("");
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Review link copied.");
    } catch {
      setNotice(`Copy this link: ${value}`);
    }
  }
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <span className="eyebrow">Owner area</span>
      <h1 className="display-title mt-5 text-4xl sm:text-5xl">Your review desk.</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Read new feedback, approve it for the website or keep it private. Google reviews are managed
        separately on Google.
      </p>
      {!ready ? (
        <p className="mt-8" role="status">
          Checking your session…
        </p>
      ) : !signedIn && independent ? (
        <SperinOwnerSignIn
          onSignedIn={async () => {
            setSignedIn(true);
            await load();
          }}
        />
      ) : !signedIn ? (
        <form onSubmit={login} className="surface-raised mt-8 max-w-lg space-y-5 rounded-xl p-6">
          <ShieldCheck className="h-7 w-7 text-electric" />
          <h2 className="text-xl font-bold">Owner sign in</h2>
          <p className="text-sm text-muted-foreground">
            Use your existing EV Installer owner account. Only your verified account can access this
            review queue.
          </p>
          <label className="block text-sm font-semibold">
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              defaultValue="gussysperin@yahoo.co.uk"
              required
              className="mt-2 w-full rounded border border-white/20 bg-black/20 px-4 py-3 text-foreground"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded border border-white/20 bg-black/20 px-4 py-3 text-foreground"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-sm text-muted-foreground"
          >
            {showPassword ? "Hide" : "Show"} password
          </button>
          <button disabled={!!busy} className="button-primary w-full">
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-xs text-muted-foreground">
            Forgotten your password? Use the password reset in your EV Installer app, then return
            here.
          </p>
        </form>
      ) : (
        <>
          <div className="my-8 flex flex-wrap gap-3">
            <button
              className="button-secondary"
              disabled={!!busy}
              onClick={async () => {
                setBusy("refresh");
                try {
                  await load();
                  setNotice("Reviews refreshed.");
                } catch {
                  setError("Could not refresh reviews.");
                } finally {
                  setBusy("");
                }
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link to="/reviews" className="button-secondary">
              View public reviews
            </Link>
            <button
              className="button-secondary"
              onClick={async () => {
                try {
                  await api("/api/owner/logout", {});
                  setSignedIn(false);
                  setReviews([]);
                } catch {
                  setError("Could not sign out. Please try again.");
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
          <div className="border-y border-white/10 py-6">
            <h2 className="font-bold">Links for your customers</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="button-secondary"
                onClick={() => copy(`${window.location.origin}/leave-a-review`)}
              >
                <Copy className="h-4 w-4" />
                Copy website review link
              </button>
              <button className="button-secondary" onClick={() => copy(GOOGLE_REVIEW_URL)}>
                <Copy className="h-4 w-4" />
                Copy Google review link
              </button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {independent
                ? "New reviews are saved privately and queued for an email notification to your Sperin Services owner inbox. "
                : "Submissions are saved here directly. Email notifications are not enabled yet. "}
              Approvals appear without rebuilding the website. Moderate for authenticity and
              relevance, regardless of rating.
            </p>
          </div>
          {selectedReview && (
            <p role="status" className="mt-6 border-l-2 border-electric pl-4">
              The review from your email is shown first below.
            </p>
          )}
          <nav aria-label="Review status" className="my-6 flex flex-wrap gap-3">
            {(["pending", "approved", "rejected"] as const).map((status) => (
              <button
                key={status}
                aria-pressed={filter === status}
                className={filter === status ? "button-primary" : "button-secondary"}
                onClick={() => setFilter(status)}
              >
                {status === "rejected" ? "Hidden" : status[0].toUpperCase() + status.slice(1)} (
                {reviews.filter((r) => r.status === status).length})
              </button>
            ))}
          </nav>
          {!reviews.some((r) => r.status === filter) ? (
            <p className="border-t border-white/10 py-10 text-muted-foreground">
              No {filter === "rejected" ? "hidden" : filter} reviews.
            </p>
          ) : (
            reviews
              .filter((r) => r.status === filter)
              .sort((a, b) => Number(b.id === selectedReview) - Number(a.id === selectedReview))
              .map((review) => (
                <ReviewRow key={review.id} review={review} busy={!!busy} update={update} />
              ))
          )}
        </>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded border border-red-400/30 p-4 text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-6 break-words rounded border border-white/20 p-4">
          {notice}
        </p>
      )}
    </section>
  );
}
function ReviewRow({
  review,
  busy,
  update,
}: {
  review: Review;
  busy: boolean;
  update: (r: Review, s: Review["status"], reply?: string) => Promise<void>;
}) {
  const [reply, setReply] = useState(review.reply);
  return (
    <article className="border-t border-white/15 py-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold break-words">
          {review.name}{" "}
          <span className="text-base font-normal text-muted-foreground">
            {review.area && `· ${review.area}`}
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString("en-GB")} · {review.rating}/5 stars
        </p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {review.service}{" "}
        {review.job_reference && `· Private job reference: ${review.job_reference}`}
      </p>
      <p className="my-5 whitespace-pre-wrap break-words leading-relaxed">{review.text}</p>
      <label className="block text-sm font-semibold" htmlFor={`reply-${review.id}`}>
        Your public reply (optional)
      </label>
      <textarea
        id={`reply-${review.id}`}
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        maxLength={2000}
        rows={3}
        className="mt-2 w-full rounded border border-white/20 bg-black/20 px-4 py-3 text-foreground"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        {review.status !== "approved" && (
          <button
            disabled={busy}
            className="button-primary"
            onClick={() => update(review, "approved", reply)}
          >
            <Check className="h-4 w-4" />
            Approve & publish
          </button>
        )}
        {review.status === "approved" && (
          <button
            disabled={busy}
            className="button-primary"
            onClick={() => update(review, "approved", reply)}
          >
            Save reply
          </button>
        )}
        {review.status !== "rejected" && (
          <button
            disabled={busy}
            className="button-secondary"
            onClick={() => update(review, "rejected", reply)}
          >
            <EyeOff className="h-4 w-4" />
            {review.status === "approved" ? "Unpublish" : "Keep private"}
          </button>
        )}
        {review.status === "rejected" && (
          <button
            disabled={busy}
            className="button-secondary"
            onClick={() => update(review, "pending", reply)}
          >
            Return to pending
          </button>
        )}
      </div>
    </article>
  );
}
