"use client";

import { useState } from "react";

export default function Home() {
  const [entry, setEntry] = useState("");
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!entry.trim() || loading) return;

    setLoading(true);
    setError("");
    setReflection("");

    try {
      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setReflection(data.reflection);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="eyebrow">
        <span className="dot" />
        Nothing you write is saved
      </div>
      <h1 className="wordmark">Mindtrace</h1>
      <p className="tagline">
        Write how today actually went. Mindtrace reads it once and reflects
        back what it notices — no diagnosis, no advice, just a second pair of eyes.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="entry-label" htmlFor="entry">
          Today's entry
        </label>
        <div className="entry-wrap">
          <textarea
            id="entry"
            className="entry"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Slept badly, headache by mid-afternoon, skipped lunch again..."
            maxLength={4000}
          />
        </div>

        <div className="controls">
          <span className="hint">
            {entry.length}/4000 &middot; processed once, then forgotten
          </span>
          <button
            type="submit"
            className="reflect"
            disabled={!entry.trim() || loading}
          >
            {loading ? "Reading..." : "Reflect"}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {reflection && (
        <div className="note">
          <div className="note-label">What Mindtrace noticed</div>
          <div className="note-body">{reflection}</div>
        </div>
      )}

      <div className="footer">
        This is an early build of Mindtrace. Entries are sent to Claude for a
        one-time reflection and are not stored anywhere, by this app or by
        Anthropic beyond standard API processing. Mindtrace doesn't diagnose
        or treat anything — if you're struggling, a licensed therapist or, in
        the US, the 988 Suicide &amp; Crisis Lifeline (call or text 988) can
        help in ways this can't.
      </div>
    </main>
  );
}
