"use client";
import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
type Sale = { _id: string; name: string; sale_date: string; status: string; product_count: number };

export default function AdminPage() {
  const { data: session, status } = useSession(); const [sales, setSales] = useState<Sale[]>([]); const [name, setName] = useState(""); const [date, setDate] = useState(""); const [error, setError] = useState("");
  async function load() { if (!session?.apiToken) return; const response = await fetch(`${API}/admin/sales`, { headers: { Authorization: `Bearer ${session.apiToken}` } }); if (response.ok) setSales(await response.json()); else setError("Could not load admin sales."); }
  useEffect(() => { load(); }, [session?.apiToken]);
  async function createSale(event: FormEvent) { event.preventDefault(); setError(""); const response = await fetch(`${API}/admin/sales`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.apiToken ?? ""}` }, body: JSON.stringify({ name, sale_date: date }) }); if (!response.ok) { const body = await response.json().catch(() => ({})); setError(body.detail ?? "Could not create sale."); return; } setName(""); setDate(""); load(); }
  if (status === "loading") return <main className="grid min-h-screen place-items-center text-muted-foreground">Loading admin panel…</main>;
  if (session?.role !== "admin") return <main className="grid min-h-screen place-items-center">Admin access required.</main>;
  return <main className="mx-auto max-w-5xl space-y-8 px-6 py-12"><header><p className="text-sm font-medium text-muted-foreground">FRAGRANCE BUCKET</p><h1 className="text-3xl font-semibold tracking-tight">Partial Sales</h1><p className="mt-2 text-muted-foreground">Prepare sales. Products remain private until auctions start.</p></header><Card><CardHeader><CardTitle>Create sale</CardTitle></CardHeader><CardContent><form onSubmit={createSale} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"><Input required value={name} onChange={event => setName(event.target.value)} placeholder="Sale name, e.g. 26-Oct Sale" /><Input required type="date" value={date} onChange={event => setDate(event.target.value)} /><Button type="submit">Create sale</Button></form>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</CardContent></Card><section className="space-y-3"><h2 className="text-xl font-semibold">Your sales</h2>{sales.length === 0 ? <Card><CardContent className="py-8 text-muted-foreground">No sales yet. Create first sale above.</CardContent></Card> : sales.map(sale => <a key={sale._id} href={`/admin/sales/${sale._id}`}><Card className="transition-colors hover:bg-muted"><CardContent className="flex items-center justify-between gap-4 py-5"><div><h3 className="font-medium">{sale.name}</h3><p className="text-sm text-muted-foreground">{sale.sale_date} · {sale.product_count} products</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase">{sale.status}</span></CardContent></Card></a>)}</section></main>;
}
