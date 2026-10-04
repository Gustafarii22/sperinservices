import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Travel } from "@/lib/pricing";

export function HomeTravelChecker() {
  const [postcode, setPostcode] = useState("");
  const [travel, setTravel] = useState<Travel>();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    setChecking(true);
    setError("");
    setTravel(undefined);
    try {
      const response = await fetch("/api/pricing/travel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode }),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Could not check that postcode.");
      setTravel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check that postcode.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-9 lg:px-8">
      <div className="grid gap-5 border-y border-white/10 py-6 md:grid-cols-[.8fr_1.2fr] md:items-center">
        <div>
          <span className="eyebrow">Travel checker</span>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Check your postcode.</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            See whether travel is included or if a visit supplement applies.
          </p>
        </div>

        <div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-electric" />
              <input
                aria-label="Postcode"
                autoComplete="postal-code"
                maxLength={10}
                placeholder="Enter postcode"
                value={postcode}
                onChange={(event) => {
                  setPostcode(event.target.value.toUpperCase());
                  setTravel(undefined);
                  setError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && postcode.trim()) check();
                }}
                className="h-12 w-full rounded-md border border-white/15 bg-white/[0.025] pl-10 pr-3 text-base uppercase outline-none transition focus:border-electric/50 focus:ring-2 focus:ring-electric/20"
              />
            </div>
            <button
              type="button"
              onClick={check}
              disabled={checking || !postcode.trim()}
              className="button-primary !min-h-12 shrink-0 !px-5 disabled:opacity-50"
            >
              {checking ? "Checking…" : "Check"}
            </button>
          </div>

          {travel ? (
            <div role="status" className="mt-3 border-l-2 border-electric bg-electric/[0.06] px-4 py-3">
              <p className="font-semibold">
                {travel.charge === 0
                  ? "Travel included — £0"
                  : travel.charge !== null
                    ? `Travel supplement — +£${travel.charge} per visit`
                    : "Longer journey — price confirmed before booking"}
              </p>
              {travel.minutes !== undefined ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  About {travel.minutes} minutes each way, without live traffic.
                </p>
              ) : null}
            </div>
          ) : error ? (
            <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Up to 35 minutes included · 36–50 +£15 · 51–65 +£25 · longer journeys agreed first.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
