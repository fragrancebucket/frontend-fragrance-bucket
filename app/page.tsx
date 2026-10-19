"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, LogOut, Menu, UserRound } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import MobileNav from "@/components/mobile-nav";
import {
  HomeLiveCard,
  HomeLiveCardSkeleton,
  type LiveSaleCardData,
} from "@/components/home-live-card";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const HeroBottle = dynamic(() => import("@/components/hero-bottle"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="h-full w-full rounded-full bg-[radial-gradient(circle_at_50%_45%,hsl(var(--primary)/.28),transparent_58%)]"
    />
  ),
});

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export default function Home() {
  const { data: session, status } = useSession();
  const [sales, setSales] = useState<LiveSaleCardData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.apiToken) return;
    let mounted = true;
    setLoading(true);

    fetch(`${API}/sales/live`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (mounted) setSales(data);
      })
      .catch(() => {
        if (mounted) setSales([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session?.apiToken]);

  const explore = () =>
    document.getElementById("live-auctions")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

  return (
    <main className="min-h-dvh overflow-hidden bg-background pb-28 text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <a
          href="/"
          className="text-base font-semibold tracking-[-0.04em] transition-opacity hover:opacity-70"
        >
          Fragrance Bucket
        </a>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {session ? (
            <>
              <a
                href="/my-auctions"
                className="grid size-11 overflow-hidden place-items-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Open profile and my auctions"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound aria-hidden="true" className="size-[18px]" />
                )}
              </a>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Log out"
              >
                <LogOut aria-hidden="true" className="size-[18px]" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="min-h-11 rounded-full px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
            aria-label="Open navigation"
            onClick={explore}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </div>
      </header>
      <div
        id="main-content"
        className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12"
      >
        <section className="relative overflow-hidden border-y border-border/80 py-8 lg:grid lg:min-h-[640px] lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-16">
          <div className="relative z-10 max-w-[20rem] sm:max-w-md">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              The live perfume room
            </p>
            <h1 className="mt-5 text-balance text-[clamp(3.35rem,13vw,7.25rem)] font-semibold leading-[0.82] tracking-[-0.085em]">
              A better way
              <span className="block pl-[0.12em] font-normal italic text-muted-foreground">
                to wear scent.
              </span>
            </h1>
            <p className="mt-7 max-w-[29rem] text-base leading-7 text-muted-foreground sm:text-lg">
              Bid live on bottles and partials worth keeping close.
            </p>
            <div className="mt-10 hidden flex-wrap items-center gap-3 lg:flex">
              <Button
                type="button"
                onClick={
                  session
                    ? explore
                    : () => signIn("google", { callbackUrl: "/" })
                }
                className="min-h-12 rounded-full px-5 text-[15px] shadow-none"
              >
                {session ? "Explore live auctions" : "Join the room"}
                <ArrowDown aria-hidden="true" className="ml-2 size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                New rooms appear as they go live.
              </span>
            </div>
          </div>
          <div className="relative mx-auto mt-5 h-[310px] w-full max-w-[300px] sm:h-[390px] sm:max-w-[420px] lg:absolute lg:top-1/2 lg:right-0 lg:mt-0 lg:h-[500px] lg:w-[500px] lg:max-w-none lg:-translate-y-1/2">
            <div className="pointer-events-none absolute inset-[10%] rounded-full border border-primary/20" />
            <div className="pointer-events-none absolute inset-[23%] rounded-full border border-border" />
            <div className="absolute inset-[4%] opacity-90">
              <HeroBottle />
            </div>
          </div>
          <div className="relative z-10 mt-10 flex flex-wrap items-center gap-3 lg:hidden">
            <Button
              type="button"
              onClick={
                session ? explore : () => signIn("google", { callbackUrl: "/" })
              }
              className="min-h-12 rounded-full px-5 text-[15px] shadow-none"
            >
              {session ? "Explore live auctions" : "Join the room"}
              <ArrowDown aria-hidden="true" className="ml-2 size-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              New rooms appear as they go live.
            </span>
          </div>
          <p className="relative mt-7 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:absolute lg:bottom-5 lg:left-0 lg:mt-0">
            <span className="size-1.5 rounded-full bg-primary" />
            Server-timed auctions
          </p>
        </section>
        <section id="live-auctions" className="scroll-mt-5 py-12 sm:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                Live now
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
                Enter a room.
              </h2>
            </div>
            {session && (
              <p
                aria-live="polite"
                className="pb-1 text-sm text-muted-foreground"
              >
                {sales.length} {sales.length === 1 ? "room" : "rooms"}
              </p>
            )}
          </div>
          <div className="mt-7 flex snap-x gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {status === "loading" || loading ? (
              <>
                <HomeLiveCardSkeleton />
                <HomeLiveCardSkeleton />
              </>
            ) : !session ? (
              <div className="w-full border-y border-border py-8 sm:max-w-lg">
                <p className="text-lg font-medium tracking-[-0.03em]">
                  Sign in to see the rooms that are live.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="mt-5 min-h-11 rounded-full px-4"
                >
                  Sign in with Google
                  <ArrowUpRight aria-hidden="true" className="ml-2 size-4" />
                </Button>
              </div>
            ) : sales.length ? (
              sales.map((sale) => <HomeLiveCard key={sale.id} sale={sale} />)
            ) : (
              <div className="w-full border-y border-border py-8 sm:max-w-lg">
                <p className="text-lg font-medium tracking-[-0.03em]">
                  The room is quiet for now.
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  A sale will appear here the moment it goes live.
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="border-t border-border py-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            A focused place for people who notice the small things in a scent.
          </p>
          <a
            href="#live-auctions"
            className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary sm:mt-0"
          >
            Browse live auctions
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </a>
        </section>
      </div>
      <MobileNav />
    </main>
  );
}
