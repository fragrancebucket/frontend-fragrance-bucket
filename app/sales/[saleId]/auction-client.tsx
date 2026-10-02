"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2, MessageCircle } from "lucide-react";
import MobileNav from "@/components/mobile-nav";

type Snapshot = {
  state: string;
  saleName: string;
  lastResult?: {
    status: string;
    price?: number;
    productName?: string;
    quantityMl?: number;
    myOutcome: "won" | "lost";
    randomReason?: string;
    tiedCount?: number;
  };
  pastResults: Array<{
    productId: string;
    name: string;
    quantityMl?: number;
    imageUrl?: string | null;
    status: "sold" | "unsold";
    price?: number;
    completedAt: string;
  }>;
  transition?: {
    product: { name: string; quantity_ml: number };
    nextRound: number;
    participantCount: number;
    endsAt: string;
  };
  auction?: {
    id: string;
    round: number;
    endsAt: string;
    floor: number;
    myBid: number | null;
    participantCount: number;
    eligible: boolean;
    product: {
      name: string;
      quantity_ml: number;
      base_price: number;
      image_url?: string | null;
    };
  };
};
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

function PastResults({ results }: { results: Snapshot["pastResults"] }) {
  if (!results.length) return null;

  return (
    <section className="mt-7 border-t pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Completed lots</h2>
        <p className="text-xs text-muted-foreground">Past products only</p>
      </div>
      <div className="mt-4 space-y-3">
        {results.map((result) => (
          <article
            key={result.productId}
            className="flex gap-3 rounded-2xl border bg-card p-3"
          >
            {result.imageUrl ? (
              <img
                src={result.imageUrl}
                alt=""
                className="size-16 rounded-xl bg-muted object-contain"
              />
            ) : (
              <div className="size-16 rounded-xl bg-muted" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{result.name}</p>
              {result.quantityMl && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {result.quantityMl}ml partial
                </p>
              )}
              <p className="mt-2 text-sm font-medium">
                {result.status === "sold"
                  ? `Sold · ₹${result.price}`
                  : "Unsold"}
              </p>
              {result.status === "unsold" && (
                <a
                  href={`https://wa.me/919082721077?text=${encodeURIComponent(`Hi, I would like to claim the unsold ${result.name} from Fragrance Bucket.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-xs font-bold text-[#102319] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Claim on WhatsApp
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PhoneModal({
  phone,
  setPhone,
  savePhone,
}: {
  phone: string;
  setPhone: (value: string) => void;
  savePhone: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <p className="text-sm font-semibold text-red-600">ONE-TIME STEP</p>
        <h1 className="mt-2 text-2xl font-semibold">Add your phone number</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We use this only to contact you if you win an auction.
        </p>
        <input
          className="mt-5 w-full rounded-md border bg-background px-3 py-2"
          type="tel"
          autoComplete="tel"
          placeholder="Phone number, e.g. +91 9876543210"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <button
          className="mt-3 w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
          disabled={!phone.trim()}
          onClick={savePhone}
        >
          Save and continue
        </button>
      </div>
    </main>
  );
}

export default function AuctionClient({ saleId }: { saleId: string }) {
  const [sale, setSale] = useState<Snapshot>();
  const [selectedIncrease, setSelectedIncrease] = useState(0);
  const [message, setMessage] = useState("");
  const [clockNow, setClockNow] = useState(Date.now());
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);
  const [phone, setPhone] = useState("");
  const [confirmingBid, setConfirmingBid] = useState(false);
  const { data: session } = useSession();
  async function load() {
    const response = await fetch(`${API}/sales/${saleId}`, {
      headers: { Authorization: `Bearer ${session?.apiToken ?? ""}` },
    });
    if (response.ok) setSale(await response.json());
  }
  useEffect(() => {
    load();
    const timer = setInterval(load, 1000);
    return () => clearInterval(timer);
  }, [saleId, session?.apiToken]);
  useEffect(() => {
    if (!session?.apiToken) return;
    fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) => profile && setHasPhone(profile.hasPhone));
  }, [session?.apiToken]);
  useEffect(() => {
    if (!sale?.auction) return;
    const timer = setInterval(() => setClockNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [sale?.auction?.endsAt]);
  useEffect(() => {
    if (!session?.apiToken) return;
    const ws = new WebSocket(
      `${API.replace(/^http/, "ws")}/ws/sales/${saleId}?token=${encodeURIComponent(session.apiToken)}`,
    );
    ws.onmessage = () => load();
    return () => ws.close();
  }, [saleId, session?.apiToken]);
  const bidBase = sale?.auction
    ? Math.max(sale.auction.floor, sale.auction.myBid ?? 0)
    : 0;
  const amount = bidBase + selectedIncrease;
  useEffect(
    () => setSelectedIncrease(0),
    [sale?.auction?.id, sale?.auction?.round, sale?.auction?.myBid],
  );
  async function savePhone() {
    const response = await fetch(`${API}/me/phone`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.apiToken ?? ""}`,
      },
      body: JSON.stringify({ phone }),
    });
    const body = await response.json();
    if (response.ok) {
      setHasPhone(true);
      setMessage("Phone number saved. You can now bid.");
    } else setMessage(body.detail ?? "Could not save phone number.");
  }
  async function submit() {
    if (!sale?.auction || !hasPhone) return;
    setConfirmingBid(false);
    const response = await fetch(`${API}/auctions/${sale.auction.id}/bids`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.apiToken ?? ""}`,
      },
      body: JSON.stringify({ amount, client_bid_id: crypto.randomUUID() }),
    });
    const body = await response.json();
    setMessage(
      response.ok
        ? `Bid placed: ₹${body.amount}`
        : (body.detail ?? "Bid rejected."),
    );
    if (response.ok) load();
  }
  if (!sale)
    return (
      <main className="grid min-h-screen place-items-center">
        Loading sale…
      </main>
    );
  if (hasPhone === false)
    return (
      <PhoneModal phone={phone} setPhone={setPhone} savePhone={savePhone} />
    );
  if (sale.state === "transition" && sale.transition)
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 py-12">
        <div className="text-center">
          <p className="text-sm font-medium text-red-600">ROUND COMPLETE</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {sale.transition.product.name}
          </h1>
          <p className="mt-4 text-lg">
            {sale.transition.participantCount} people entered a bid this round.
          </p>
          <p className="mt-2 text-muted-foreground">
            Moving eligible bidders to Round {sale.transition.nextRound}…
          </p>
        </div>
        <PastResults results={sale.pastResults} />
      </main>
    );
  if (sale.state !== "running")
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="max-w-md text-center">
          <p className="text-sm font-medium text-red-600">FRAGRANCE BUCKET</p>
          <h1 className="mt-2 text-3xl font-semibold">{sale.saleName}</h1>
          {sale.lastResult && (
            <div className="mt-6 rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">LATEST AUCTION</p>
              <h2 className="mt-1 text-xl font-semibold">
                {sale.lastResult.productName}
              </h2>
              {sale.lastResult.status === "unsold" ? (
                <p className="mt-3">
                  This product did not receive a winning bid.
                </p>
              ) : sale.lastResult.myOutcome === "won" ? (
                <div className="mt-4 rounded-2xl border border-emerald-600/30 bg-emerald-50 p-4 text-left text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-6 text-emerald-600"
                    />
                    <p className="text-lg font-bold">
                      Congratulations — you won!
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6">
                    {sale.lastResult.randomReason === "round_5_tie"
                      ? `You were randomly selected after ${sale.lastResult.tiedCount} people tied in Round 5.`
                      : `Your winning bid was ₹${sale.lastResult.price}.`}
                  </p>
                </div>
              ) : (
                <p className="mt-3">
                  {sale.lastResult.randomReason === "round_5_tie"
                    ? `Sorry — ${sale.lastResult.tiedCount} people tied after Round 5, so winner was selected randomly.`
                    : `Auction ended. Winning bid: ₹${sale.lastResult.price}.`}
                </p>
              )}
            </div>
          )}
          <p className="mt-5 text-muted-foreground">
            {sale.state === "completed"
              ? "Sale has ended. Thank you for participating."
              : "Waiting for the next product…"}
          </p>
          <PastResults results={sale.pastResults} />
        </div>
      </main>
    );
  const auction = sale.auction!;
  const deadline = Date.parse(auction.endsAt);
  const seconds = Number.isFinite(deadline)
    ? Math.max(0, Math.ceil((deadline - clockNow) / 1000))
    : 0;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <main className="mx-auto max-w-xl space-y-3 px-3 py-3 app-safe-bottom sm:px-6">
      <header className="flex items-center justify-between rounded-xl bg-card px-3 py-2 shadow-sm">
        <p className="text-xs font-bold tracking-[.18em] text-red-700">
          ● LIVE AUCTION
        </p>
        <p className="rounded-lg bg-red-900 px-3 py-1 font-mono text-xl font-bold text-white">
          {clock}
        </p>
      </header>
      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {auction.product.image_url && (
          <img
            src={auction.product.image_url}
            alt={auction.product.name}
            className="aspect-[16/10] w-full bg-muted object-contain"
          />
        )}
        <div className="p-4">
          <p className="text-xs font-bold tracking-[.14em] text-primary">
            ROUND {auction.round} / 5
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {auction.product.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {auction.product.quantity_ml}ml Partial
          </p>
          <p
            role="status"
            aria-atomic="true"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary"
          >
            <span className="relative flex size-3" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500/70" />
              <span className="relative inline-flex size-3 rounded-full bg-red-600 ring-2 ring-red-100" />
            </span>
            {auction.participantCount} people placed a bid
          </p>
          {auction.myBid && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-600/25 bg-emerald-50 p-3 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100"
            >
              <CheckCircle2
                aria-hidden="true"
                className="size-6 shrink-0 text-emerald-600"
              />
              <div>
                <p className="text-sm font-bold">Your bid is accepted</p>
                <p className="text-sm">
                  You are bidding ₹{auction.myBid} in this round.
                </p>
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 text-sm">
            <div>
              <p className="text-muted-foreground">Starting price</p>
              <p className="text-lg font-semibold">
                ₹{auction.product.base_price}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Bid floor</p>
              <p className="text-lg font-semibold">₹{auction.floor}</p>
            </div>
          </div>
          {auction.eligible ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Tap preset buttons repeatedly to build your bid.
              </p>
              <p>
                Select bid: <strong className="text-xl">₹{amount}</strong>
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[20, 30, 50, 100].map((value) => (
                  <button
                    className="min-h-12 rounded-xl border bg-background px-2 py-3 text-sm font-bold hover:bg-muted"
                    key={value}
                    onClick={() =>
                      setSelectedIncrease((current) => current + value)
                    }
                  >
                    +₹{value}
                  </button>
                ))}
              </div>
              <button
                className="w-full rounded-md border px-4 py-2 text-sm"
                disabled={selectedIncrease === 0}
                onClick={() => setSelectedIncrease(0)}
              >
                Reset selection
              </button>
              <button
                className="fixed inset-x-3 bottom-18 z-30 min-h-12 rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow-xl md:static md:w-full"
                disabled={seconds === 0}
                onClick={() => setConfirmingBid(true)}
              >
                {seconds === 0 ? "Round closed" : `Submit ₹${amount}`}
              </button>
            </div>
          ) : (
            <p className="mt-6 rounded-md bg-muted p-3 text-sm">
              You are not eligible for this tie-break round.
            </p>
          )}
        </div>
      </section>
      {confirmingBid && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-bid-title"
          className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 sm:place-items-center"
        >
          <div className="w-full max-w-sm rounded-3xl border bg-card p-5 shadow-2xl">
            <p className="text-xs font-bold tracking-[0.14em] text-primary">
              CONFIRM YOUR BID
            </p>
            <h2 id="confirm-bid-title" className="mt-2 text-2xl font-semibold">
              Submit ₹{amount}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Your bid will be entered for {auction.product.name} in the current
              round.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmingBid(false)}
                className="min-h-12 rounded-xl border px-4 text-sm font-semibold"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={submit}
                className="min-h-12 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
              >
                Confirm bid
              </button>
            </div>
          </div>
        </div>
      )}
      <PastResults results={sale.pastResults} />
      {message && <p className="text-center text-sm">{message}</p>}
      <MobileNav />
    </main>
  );
}
