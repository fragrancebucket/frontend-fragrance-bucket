"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
type Dashboard = {
  saleName: string;
  saleStatus: string;
  liveConnections: number;
  progress: Record<string, number>;
  auction: null | {
    status: string;
    round: number;
    endsAt?: string;
    floor: number;
    participantCount: number;
    product: { name: string; quantity_ml: number; base_price: number; image_url?: string | null };
  };
  bids: {
    amount: number;
    updates: number;
    submittedAt: string;
    bidder: { name?: string; email?: string };
  }[];
  lastResult?: { status: string; product_name?: string; price?: number };
  pastResults: {
    productName: string;
    status: "sold" | "unsold";
    price?: number;
    winner?: { name?: string; email?: string; phone?: string };
  }[];
};

export default function LiveDashboard({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { data: session } = useSession();
  const [saleId, setSaleId] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [clockNow, setClockNow] = useState(Date.now());
  useEffect(() => {
    params.then(({ saleId }) => setSaleId(saleId));
  }, [params]);
  useEffect(() => {
    if (!saleId || !session?.apiToken) return;
    const load = () =>
      fetch(`${API}/admin/sales/${saleId}/live-dashboard`, {
        headers: { Authorization: `Bearer ${session.apiToken}` },
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => data && setDashboard(data));
    load();
    const timer = setInterval(load, 1000);
    return () => clearInterval(timer);
  }, [saleId, session?.apiToken]);
  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);
  if (!dashboard)
    return (
      <main className="grid min-h-screen place-items-center">
        Loading live dashboard…
      </main>
    );
  const seconds = dashboard.auction?.endsAt
    ? Math.max(
        0,
        Math.ceil((Date.parse(dashboard.auction.endsAt) - clockNow) / 1000),
      )
    : 0;
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <a
        className="text-sm text-muted-foreground"
        href={`/admin/sales/${saleId}`}
      >
        ← Back to sale
      </a>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-red-600">● CEO LIVE VIEW</p>
          <h1 className="mt-1 text-3xl font-semibold">{dashboard.saleName}</h1>
          <p className="text-muted-foreground capitalize">
            {dashboard.saleStatus}
          </p>
        </div>
        {dashboard.auction && (
          <p className="font-mono text-4xl font-semibold">{clock}</p>
        )}
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Live connections" value={dashboard.liveConnections} />
        <Metric
          label="Current bidders"
          value={dashboard.auction?.participantCount ?? 0}
        />
        <Metric label="Sold" value={dashboard.progress.sold ?? 0} />
        <Metric label="Unsold" value={dashboard.progress.unsold ?? 0} />
        <Metric label="Pending" value={dashboard.progress.prepared ?? 0} />
      </div>
      {dashboard.auction ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Live auction · Round {dashboard.auction.round} / 5
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-2xl font-semibold">
                {dashboard.auction.product.name}
              </h2>
              {dashboard.auction.product.image_url && <img src={dashboard.auction.product.image_url} alt={dashboard.auction.product.name} className="mt-4 max-h-72 w-full rounded-lg border object-contain" />}
              <p className="mt-1 text-muted-foreground">
                {dashboard.auction.product.quantity_ml}ml partial · Base ₹
                {dashboard.auction.product.base_price} · Floor ₹
                {dashboard.auction.floor}
              </p>
              <p className="mt-3 text-sm font-medium capitalize">
                {dashboard.auction.status}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Live bids</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {dashboard.bids.length ? (
                dashboard.bids.map((bid, index) => (
                  <div
                    className="flex items-center justify-between gap-4 py-3"
                    key={`${bid.bidder.email}-${index}`}
                  >
                    <div>
                      <p className="font-medium">
                        {bid.bidder.name ||
                          bid.bidder.email ||
                          "Unknown bidder"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {bid.bidder.email} · Updated {bid.updates} time
                        {bid.updates === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-xl font-semibold">₹{bid.amount}</p>
                  </div>
                ))
              ) : (
                <p className="py-4 text-muted-foreground">No bids yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="font-medium">No active auction.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard refreshes every second while waiting.
            </p>
            {dashboard.lastResult && (
              <p className="mt-4">
                Latest: {dashboard.lastResult.product_name} ·{" "}
                {dashboard.lastResult.status === "sold"
                  ? `Sold for ₹${dashboard.lastResult.price}`
                  : "Unsold"}
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Past products</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {dashboard.pastResults.length ? (
            dashboard.pastResults.map((result, index) => (
              <div
                key={`${result.productName}-${index}`}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <p className="font-medium">{result.productName}</p>
                  <p className="text-sm text-muted-foreground">
                  {result.status === "sold"
                    ? `Buyer: ${result.winner?.name || result.winner?.email || "Unknown"}${result.winner?.phone ? ` · ${result.winner.phone}` : ""}`
                      : "Unsold"}
                  </p>
                </div>
                <p className="font-semibold">
                  {result.status === "sold" ? `₹${result.price}` : "—"}
                </p>
              </div>
            ))
          ) : (
            <p className="py-4 text-muted-foreground">
              No past auction results yet.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
