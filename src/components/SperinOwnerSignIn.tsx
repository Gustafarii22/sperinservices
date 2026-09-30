import { useState, type FormEvent } from "react";
import { Mail, ShieldCheck } from "lucide-react";
export function SperinOwnerSignIn({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(sent ? "/api/owner/verify-code" : "/api/owner/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.error || "Please try again.");
      if (sent) await onSignedIn();
      else setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={send} className="surface-raised mt-8 max-w-lg space-y-5 rounded-xl p-6">
      <ShieldCheck className="h-7 w-7 text-electric" />
      <h2 className="text-xl font-bold">Sperin Services owner sign-in</h2>
      <p className="text-sm text-muted-foreground">
        {sent
          ? "Check your inbox for your Sperin Services sign-in code."
          : "We’ll email you a one-time code to open your private review desk. No other app account or password is needed."}
      </p>
      <label className="block text-sm font-semibold">
        Owner email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          readOnly={sent}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded border border-white/20 bg-black/20 px-4 py-3"
        />
      </label>
      {sent && (
        <label className="block text-sm font-semibold">
          Email code
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-2 w-full rounded border border-white/20 bg-black/20 px-4 py-3"
          />
        </label>
      )}
      <button disabled={busy} className="button-primary w-full">
        <Mail className="h-4 w-4" />
        {busy ? "Please wait…" : sent ? "Open my review desk" : "Email my sign-in code"}
      </button>
      {sent && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setSent(false);
            setCode("");
            setError("");
          }}
          className="text-sm underline"
        >
          Use another email or request a new code
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
