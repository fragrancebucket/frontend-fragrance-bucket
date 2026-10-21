"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
type Entry = { auctionId: string; status: "participating" | "won" | "lost"; product: { name: string; quantity_ml: number; image_url?: string | null }; myHighestBid: number; finalPrice?: number };

export default function MyAuctionsPage() {
  const { data: session, status } = useSession(); const [entries, setEntries] = useState<Entry[]>([]); const [error, setError] = useState("");
  useEffect(() => { if (!session?.apiToken) return; fetch(`${API}/me/auctions`, { headers: { Authorization: `Bearer ${session.apiToken}` } }).then(async response => response.ok ? setEntries(await response.json()) : setError("Could not load your auction history.")).catch(() => setError("Could not load your auction history.")); }, [session?.apiToken]);
  if (status === "loading") return <main className="grid min-h-screen place-items-center">Loading…</main>;
  if (!session) return <main className="grid min-h-screen place-items-center">Sign in to view your auctions.</main>;
  return <main className="mx-auto max-w-3xl space-y-6 px-6 py-12"><a className="text-sm text-muted-foreground hover:underline" href="/">← Home</a><header><p className="text-sm font-medium text-red-600">FRAGRANCE BUCKET</p><h1 className="text-3xl font-semibold">My auctions</h1><p className="mt-2 text-muted-foreground">Your private bid and result history.</p></header>{error && <p className="text-sm text-red-600">{error}</p>}{entries.length === 0 ? <Card><CardContent className="py-8 text-muted-foreground">You have not joined an auction yet.</CardContent></Card> : entries.map(entry => <Card key={entry.auctionId}><CardHeader className="flex-row gap-4"><>{entry.product.image_url && <img src={entry.product.image_url} alt={entry.product.name} className="size-16 rounded-md border object-cover" />}</><div><CardTitle>{entry.product.name}</CardTitle><p className="text-sm text-muted-foreground">{entry.product.quantity_ml}ml Partial</p></div></CardHeader><CardContent className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Your highest bid</p><p className="font-semibold">₹{entry.myHighestBid}</p></div><div className="text-right"><p className={`font-medium ${entry.status === "won" ? "text-green-700" : ""}`}>{entry.status === "participating" ? "Auction running" : entry.status === "won" ? "Won" : "Lost"}</p>{entry.status === "won" && entry.finalPrice && <p className="text-sm text-muted-foreground">Final price ₹{entry.finalPrice}</p>}</div></CardContent></Card>)}</main>;
}
