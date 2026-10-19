"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
type Detail = {
  product: {
    name: string;
    brand?: string;
    quantity_ml: number;
    base_price: number;
    round_duration_seconds?: number;
    status: string;
    image_url?: string | null;
  };
  result?: {
    status: "sold" | "unsold";
    price?: number;
    rounds_used?: number;
    random_reason?: string;
  } | null;
  winner?: { name?: string; email?: string; phone?: string } | null;
  manual_buyer_phone?: string | null;
  payment_request?: {
    id: string;
    recipient?: string | null;
    amount: number;
    qr_url?: string | null;
    dispatch_status: "queued" | "sending" | "sent" | "failed";
    delivery_status?: string | null;
    payment_status: "pending" | "paid" | "cancelled";
    attempts: number;
    last_error?: string | null;
  } | null;
  bid_history?: {
    round: number;
    amount: number;
    submitted_at: string;
    bidder: { name?: string; email?: string };
  }[];
};

export default function ProductDetail({
  params,
}: {
  params: Promise<{ saleId: string; productId: string }>;
}) {
  const { data: session } = useSession();
  const [ids, setIds] = useState<{ saleId: string; productId: string }>();
  const [detail, setDetail] = useState<Detail>();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [ml, setMl] = useState("");
  const [duration, setDuration] = useState("30");
  const [imageUrl, setImageUrl] = useState("");
  const [correctingOutcome, setCorrectingOutcome] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState<"sold" | "unsold">(
    "unsold",
  );
  const [outcomePrice, setOutcomePrice] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [outcomeError, setOutcomeError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  useEffect(() => {
    params.then(setIds);
  }, [params]);
  useEffect(() => {
    if (!ids || !session?.apiToken) return;
    fetch(`${API}/admin/products/${ids.productId}`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then(setDetail);
  }, [ids, session?.apiToken]);
  async function action(path: string, method = "POST") {
    if (!session?.apiToken) return;
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Bearer ${session.apiToken}` },
    });
    if (response.ok) window.location.href = `/admin/sales/${ids?.saleId}`;
  }
  function startEdit() {
    if (!detail) return;
    setName(detail.product.name);
    setPrice(String(detail.product.base_price));
    setBrand(detail.product.brand ?? "");
    setMl(String(detail.product.quantity_ml));
    setDuration(String(detail.product.round_duration_seconds ?? 30));
    setImageUrl(detail.product.image_url ?? "");
    setEditing(true);
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!ids || !session?.apiToken) return;
    const response = await fetch(`${API}/admin/products/${ids.productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.apiToken}`,
      },
      body: JSON.stringify({
        name,
        brand: brand || null,
        quantity_ml: +ml,
        base_price: +price,
        round_duration_seconds: +duration,
        image_url: imageUrl || null,
      }),
    });
    if (response.ok) window.location.reload();
  }
  async function saveOutcome(event: FormEvent) {
    event.preventDefault();
    if (!ids || !session?.apiToken) return;
    setOutcomeError("");
    const response = await fetch(
      `${API}/admin/products/${ids.productId}/outcome`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.apiToken}`,
        },
        body: JSON.stringify({
          status: outcomeStatus,
          price: outcomeStatus === "sold" ? Number(outcomePrice) : null,
          buyer_phone: outcomeStatus === "sold" ? buyerPhone : null,
        }),
      },
    );
    const body = await response.json();
    if (response.ok) window.location.reload();
    else
      setOutcomeError(body.detail ?? "Could not update the product outcome.");
  }
  async function updatePayment(path: string, body?: Record<string, string>) {
    if (!session?.apiToken) return;
    setPaymentBusy(true);
    setPaymentError("");
    const response = await fetch(`${API}${path}`, {
      method: body ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${session.apiToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    setPaymentBusy(false);
    if (response.ok) window.location.reload();
    else setPaymentError(payload.detail ?? "Could not update payment status.");
  }
  if (!detail || !ids)
    return (
      <main className="grid min-h-screen place-items-center">
        Loading product…
      </main>
    );
  const {
    product,
    result,
    winner,
    bid_history: bids = [],
    payment_request: paymentRequest,
  } = detail;
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <a
        className="text-sm text-muted-foreground"
        href={`/admin/sales/${ids.saleId}`}
      >
        ← Back to sale
      </a>
      <header>
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          {product.status}
        </p>
        <h1 className="mt-1 text-3xl font-semibold">{product.name}</h1>
        <p className="text-muted-foreground">
          {product.brand && `${product.brand} · `}
          {product.quantity_ml}ml partial
        </p>
      </header>
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="max-h-80 w-full rounded-xl border object-contain"
        />
      )}
      {(product.status === "prepared" || product.status === "skipped") && (
        <div className="flex gap-2">
          {product.status === "prepared" && (
            <Button
              variant="outline"
              onClick={() =>
                action(`/admin/products/${ids.productId}/duplicate`)
              }
            >
              Duplicate product
            </Button>
          )}
          {product.status === "prepared" && (
            <Button
              variant="outline"
              onClick={() =>
                window.confirm("Skip this product?") &&
                action(`/admin/products/${ids.productId}/skip`)
              }
            >
              Skip product
            </Button>
          )}
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={() =>
              window.confirm("Delete this product? This cannot be undone.") &&
              action(`/admin/products/${ids.productId}`, "DELETE")
            }
          >
            Delete product
          </Button>
        </div>
      )}
      {product.status === "prepared" && (
        <Button variant="outline" onClick={startEdit}>
          Edit product
        </Button>
      )}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveEdit} className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Perfume name
                <Input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Brand
                <Input
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Partial ml
                <Input
                  required
                  type="number"
                  min="1"
                  value={ml}
                  onChange={(event) => setMl(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Base price ₹
                <Input
                  required
                  type="number"
                  min="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Round seconds
                <Input
                  required
                  type="number"
                  min="5"
                  max="600"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Image URL
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                />
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <Button>Save</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Base price</p>
            <p className="font-semibold">₹{product.base_price}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Round timer</p>
            <p className="font-semibold">
              {product.round_duration_seconds ?? 30}s
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold capitalize">{product.status}</p>
          </div>
        </CardContent>
      </Card>
      {result && (result.status === "sold" || result.status === "unsold") && (
        <Card>
          <CardHeader>
            <CardTitle>Correct product outcome</CardTitle>
          </CardHeader>
          <CardContent>
            {!correctingOutcome ? (
              <Button
                variant="outline"
                onClick={() => {
                  setOutcomeStatus(result.status);
                  setOutcomePrice(result.price ? String(result.price) : "");
                  setBuyerPhone(
                    detail.manual_buyer_phone ?? winner?.phone ?? "",
                  );
                  setCorrectingOutcome(true);
                }}
              >
                Change sold / unsold status
              </Button>
            ) : (
              <form onSubmit={saveOutcome} className="grid gap-3 sm:max-w-md">
                <label className="grid gap-1 text-sm">
                  Product status
                  <select
                    value={outcomeStatus}
                    onChange={(event) =>
                      setOutcomeStatus(event.target.value as "sold" | "unsold")
                    }
                    className="h-10 rounded-md border bg-background px-3"
                  >
                    <option value="sold">Sold</option>
                    <option value="unsold">Unsold</option>
                  </select>
                </label>
                {outcomeStatus === "sold" && (
                  <>
                    <label className="grid gap-1 text-sm">
                      Sale price ₹
                      <Input
                        required
                        type="number"
                        min="0"
                        value={outcomePrice}
                        onChange={(event) =>
                          setOutcomePrice(event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1 text-sm">
                      Buyer phone number
                      <Input
                        required
                        type="tel"
                        value={buyerPhone}
                        onChange={(event) => setBuyerPhone(event.target.value)}
                      />
                    </label>
                  </>
                )}
                {outcomeError && (
                  <p className="text-sm text-red-600">{outcomeError}</p>
                )}
                <div className="flex gap-2">
                  <Button>Save corrected outcome</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCorrectingOutcome(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
      {result?.status === "sold" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Winner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {winner?.name ||
                  winner?.email ||
                  (detail.manual_buyer_phone
                    ? "Manual sale"
                    : "Unknown winner")}
              </p>
              <p className="text-sm text-muted-foreground">{winner?.email}</p>
              <p className="text-sm text-muted-foreground">
                {detail.manual_buyer_phone || winner?.phone}
              </p>
              <p className="mt-3">
                Final price: <strong>₹{result.price}</strong> ·{" "}
                {result.rounds_used} round{result.rounds_used === 1 ? "" : "s"}
                {result.random_reason ? " · Random selection" : ""}
              </p>
            </CardContent>
          </Card>
          {paymentRequest && (
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp payment request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                  <span className="rounded-full bg-muted px-3 py-1">
                    Send: {paymentRequest.dispatch_status}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1">
                    Payment: {paymentRequest.payment_status}
                  </span>
                  {paymentRequest.delivery_status && (
                    <span className="rounded-full bg-muted px-3 py-1">
                      WhatsApp: {paymentRequest.delivery_status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  To {paymentRequest.recipient || "invalid phone number"} · ₹
                  {paymentRequest.amount} · {paymentRequest.attempts} send
                  attempt
                  {paymentRequest.attempts === 1 ? "" : "s"}
                </p>
                {paymentRequest.qr_url && (
                  <img
                    src={paymentRequest.qr_url}
                    alt="Payment QR code sent to the winner"
                    className="size-36 rounded-lg border bg-white object-contain p-2"
                  />
                )}
                {paymentRequest.last_error && (
                  <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                    {paymentRequest.last_error}
                  </p>
                )}
                {paymentError && (
                  <p role="alert" className="text-sm text-red-600">
                    {paymentError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {paymentRequest.payment_status === "pending" && (
                    <>
                      <Button
                        disabled={paymentBusy}
                        onClick={() =>
                          updatePayment(
                            `/admin/payment-requests/${paymentRequest.id}/payment-status`,
                            { payment_status: "paid" },
                          )
                        }
                      >
                        Mark paid
                      </Button>
                      <Button
                        variant="outline"
                        disabled={paymentBusy}
                        onClick={() =>
                          updatePayment(
                            `/admin/payment-requests/${paymentRequest.id}/payment-status`,
                            { payment_status: "cancelled" },
                          )
                        }
                      >
                        Mark cancelled
                      </Button>
                      <Button
                        variant="outline"
                        disabled={paymentBusy}
                        onClick={() =>
                          updatePayment(
                            `/admin/payment-requests/${paymentRequest.id}/resend`,
                          )
                        }
                      >
                        Resend WhatsApp
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Bid history</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              {bids.map((bid, index) => (
                <div
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                  key={`${bid.round}-${index}`}
                >
                  <div>
                    <p className="font-medium">
                      {bid.bidder.name || bid.bidder.email || "Unknown bidder"}{" "}
                      · Round {bid.round}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(bid.submitted_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      IST
                    </p>
                  </div>
                  <p className="font-semibold">₹{bid.amount}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
      {result?.status === "unsold" && (
        <Card>
          <CardContent className="py-6">Auction ended unsold.</CardContent>
        </Card>
      )}
      {!result && (
        <Card>
          <CardContent className="py-6 text-muted-foreground">
            No completed auction yet.
          </CardContent>
        </Card>
      )}
    </main>
  );
}
