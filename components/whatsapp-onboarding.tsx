"use client";

import { LoaderCircle, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export default function WhatsAppOnboarding() {
  const { data: session, status } = useSession();
  const [needsPhone, setNeedsPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !session?.apiToken) return;
    let active = true;
    fetch(`${API}/me`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => {
        if (active) setNeedsPhone(Boolean(profile && !profile.hasPhone));
      });
    return () => {
      active = false;
    };
  }, [session?.apiToken, status]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.apiToken || !phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/me/phone`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.apiToken}`,
        },
        body: JSON.stringify({ phone }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.detail ?? "We could not save that number. Please try again.");
        return;
      }
      setNeedsPhone(false);
      window.dispatchEvent(new Event("fragrance-bucket:phone-saved"));
    } catch {
      setError("We could not save that number. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!needsPhone) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-onboarding-title"
      className="fixed inset-0 z-[100] grid place-items-end bg-black/50 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl sm:p-7"
      >
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <MessageCircle aria-hidden="true" className="size-6" />
        </div>
        <p className="mt-5 text-xs font-bold tracking-[0.14em] text-primary">
          ONE-TIME SETUP
        </p>
        <h1 id="whatsapp-onboarding-title" className="mt-2 text-2xl font-semibold tracking-tight">
          Add your WhatsApp number
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Our team will contact you on WhatsApp if you win an auction, so we can help with the next steps.
        </p>
        <div className="mt-6">
          <label htmlFor="whatsapp-number" className="text-sm font-semibold">
            WhatsApp number
          </label>
          <input
            id="whatsapp-number"
            className="mt-2 min-h-12 w-full rounded-xl border bg-background px-4 text-base outline-none transition focus-visible:ring-2 focus-visible:ring-primary"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            aria-describedby="whatsapp-help whatsapp-error"
            required
            autoFocus
          />
          <p id="whatsapp-help" className="mt-2 text-xs leading-5 text-muted-foreground">
            Include your country code. We use this only for auction follow-up.
          </p>
          {error && (
            <p id="whatsapp-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />}
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
