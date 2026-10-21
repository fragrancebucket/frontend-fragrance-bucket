"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import MobileNav from "@/components/mobile-nav";
import ProfileAvatar from "@/components/profile-avatar";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

type Profile = { name?: string | null; email?: string | null; image?: string | null; phone?: string | null };

export default function ProfileClient() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile>();
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session?.apiToken) return;
    fetch(`${API}/me`, { cache: "no-store", headers: { Authorization: `Bearer ${session.apiToken}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        setProfile(data);
        setPhone(data.phone ?? "");
      });
  }, [session?.apiToken]);

  async function savePhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.apiToken) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`${API}/me/phone`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.apiToken}` },
        body: JSON.stringify({ phone }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.detail ?? "Could not save your WhatsApp number.");
        return;
      }
      setProfile((current) => ({ ...current, phone }));
      setMessage("WhatsApp number updated.");
      window.dispatchEvent(new Event("fragrance-bucket:phone-saved"));
    } catch {
      setMessage("Could not save your WhatsApp number. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <main className="grid min-h-screen place-items-center">Loading profile…</main>;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-5 py-8 app-safe-bottom sm:px-6 sm:py-12">
      <a href="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</a>
      <header className="mt-7 flex items-center gap-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary/10 text-primary">
          <ProfileAvatar name={profile.name} image={profile.image} className="text-xl" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.14em] text-primary">YOUR PROFILE</p>
          <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">{profile.name || "Fragrance Bucket member"}</h1>
        </div>
      </header>

      <section className="mt-8 space-y-4">
        <a
          href="/my-auctions"
          className="flex min-h-14 items-center justify-between rounded-2xl bg-primary px-5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          View my auctions
          <ArrowUpRight aria-hidden="true" className="size-5" />
        </a>
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground"><Mail aria-hidden="true" className="size-5" /><p className="text-sm font-medium">Email address</p></div>
          <p className="mt-3 break-all text-base font-semibold">{profile.email}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Your Google email cannot be changed here.</p>
        </div>

        <form onSubmit={savePhone} className="rounded-2xl border bg-card p-5">
          <div className="flex items-center gap-3 text-muted-foreground"><MessageCircle aria-hidden="true" className="size-5" /><label htmlFor="profile-phone" className="text-sm font-medium">WhatsApp number</label></div>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="mt-4 min-h-12 w-full rounded-xl border bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="e.g. +91 98765 43210"
            required
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">We use this only to contact you if you win an auction.</p>
          <button type="submit" disabled={saving || !phone.trim()} className="mt-5 min-h-12 w-full rounded-xl bg-primary px-4 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Saving…" : "Save WhatsApp number"}
          </button>
          {message && <p role="status" className="mt-3 text-sm font-medium text-muted-foreground">{message}</p>}
        </form>
      </section>
      <MobileNav />
    </main>
  );
}
