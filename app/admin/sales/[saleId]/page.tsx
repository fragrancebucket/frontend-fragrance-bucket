"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";
type Product = {
  _id: string;
  name: string;
  brand?: string;
  quantity_ml: number;
  base_price: number;
  round_duration_seconds?: number;
  image_url?: string | null;
  status: string;
};
type Result = {
  _id: string;
  product_id: string;
  status: "sold" | "unsold";
  price: number | null;
  rounds_used: number;
  random_reason?: string | null;
  product?: { name: string; quantity_ml: number } | null;
  winner?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
};
type Sale = {
  _id: string;
  name: string;
  status: string;
  products: Product[];
  active_auction?: {
    round_number: number;
    ends_at?: string;
    product_id: string;
    status: "running";
  } | null;
  is_paused?: boolean;
  pause_description?: string;
  results: Result[];
};

export default function SalePage({
  params,
}: {
  params: Promise<{ saleId: string }>;
}) {
  const { data: session } = useSession();
  const [id, setId] = useState("");
  const [sale, setSale] = useState<Sale>();
  const [error, setError] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [ml, setMl] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [pauseFormOpen, setPauseFormOpen] = useState(false);
  const [pauseDescription, setPauseDescription] = useState("");
  const [productSaveState, setProductSaveState] = useState<
    "idle" | "uploading" | "saving"
  >("idle");
  const loadInFlight = useRef(false);
  useEffect(() => {
    params.then((value) => setId(value.saleId));
  }, [params]);
  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${session?.apiToken ?? ""}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(body.detail?.message ?? body.detail ?? "Request failed.");
    return body;
  }, [session?.apiToken]);
  const load = useCallback(async () => {
    if (!id || !session?.apiToken || loadInFlight.current) return;
    loadInFlight.current = true;
    try {
      setSale(await api(`/admin/sales/${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load sale.");
    } finally {
      loadInFlight.current = false;
    }
  }, [api, id, session?.apiToken]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!id || !session?.apiToken || sale?.status !== "live") return;
    const refreshEvery = sale.active_auction ? 1000 : 5000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, refreshEvery);
    return () => window.clearInterval(timer);
  }, [id, load, sale?.active_auction, sale?.status, session?.apiToken]);
  async function add(event: FormEvent) {
    event.preventDefault();
    if (productSaveState !== "idle") return;
    try {
      setError("");
      setProductSaveState(imageFile ? "uploading" : "saving");
      const uploadedImageUrl = await uploadImage();
      setProductSaveState("saving");
      await api(
        editing
          ? `/admin/products/${editing._id}`
          : `/admin/sales/${id}/products`,
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            name,
            brand: brand || null,
            quantity_ml: +ml,
            base_price: +price,
            round_duration_seconds: +duration,
            image_url: uploadedImageUrl || null,
          }),
        },
      );
      setName("");
      setBrand("");
      setMl("");
      setPrice("");
      setDuration("30");
      setImageUrl("");
      setImageFile(null);
      setImagePreview("");
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add product.");
    } finally {
      setProductSaveState("idle");
    }
  }
  function selectImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setImageFile(file);
    setImageUrl("");
    setImagePreview(URL.createObjectURL(file));
  }
  async function uploadImage() {
    if (!imageFile) return imageUrl.trim();
    const data = new FormData();
    data.append("file", imageFile);
    const response = await fetch(`${API}/admin/uploads/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.apiToken ?? ""}` },
      body: data,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail ?? "Could not upload image.");
    return body.url as string;
  }
  function beginEdit(product: Product) {
    setEditing(product);
    setName(product.name);
    setBrand(product.brand ?? "");
    setMl(String(product.quantity_ml));
    setPrice(String(product.base_price));
    setDuration(String(product.round_duration_seconds ?? 30));
  }
  async function action(path: string, body = {}, method = "POST") {
    try {
      await api(path, {
        method,
        body: method === "DELETE" ? undefined : JSON.stringify(body),
      });
      load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
      return false;
    }
  }
  async function pauseSale(event: FormEvent) {
    event.preventDefault();
    if (!pauseDescription.trim()) return;
    const paused = await action(`/admin/sales/${id}/pause`, {
      description: pauseDescription.trim(),
    });
    if (!paused) return;
    setPauseDescription("");
    setPauseFormOpen(false);
  }
  async function move(product: Product, direction: -1 | 1) {
    if (!sale) return;
    const list = sale.products.filter((item) => item.status === "prepared");
    const index = list.findIndex((item) => item._id === product._id);
    if (index + direction < 0 || index + direction >= list.length) return;
    [list[index], list[index + direction]] = [
      list[index + direction],
      list[index],
    ];
    await action(`/admin/sales/${id}/reorder`, {
      product_ids: list.map((item) => item._id),
    });
  }
  async function dropOn(targetId: string) {
    if (!sale || !draggedId || draggedId === targetId) return;
    const list = sale.products.filter((item) => item.status === "prepared");
    const from = list.findIndex((item) => item._id === draggedId);
    const to = list.findIndex((item) => item._id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setDraggedId(null);
    await action(`/admin/sales/${id}/reorder`, {
      product_ids: list.map((item) => item._id),
    });
  }
  if (!sale)
    return (
      <main className="grid min-h-screen place-items-center">
        Loading sale…
      </main>
    );
  const editable = sale.status === "draft" || sale.status === "ready";
  const prepared = sale.products.filter(
    (product) => product.status === "prepared",
  );
  const active = sale.products.find(
    (product) => product._id === sale.active_auction?.product_id,
  );
  const soldResults = sale.results.filter((result) => result.status === "sold");
  const revenue = soldResults.reduce(
    (total, result) => total + (result.price ?? 0),
    0,
  );
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <a href="/admin" className="text-sm text-muted-foreground">
        ← All sales
      </a>
      <header className="flex justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">SALE SETUP</p>
          <h1 className="text-3xl font-semibold">{sale.name}</h1>
          <p className="text-muted-foreground">{sale.status}</p>
        </div>
        <div className="flex gap-2">
          {sale.status === "draft" && (
            <Button onClick={() => action(`/admin/sales/${id}/ready`)}>
              Mark ready
            </Button>
          )}
          {sale.status === "ready" && (
            <Button
              onClick={() =>
                window.confirm("Start sale?") &&
                action(`/admin/sales/${id}/start`)
              }
            >
              Start sale
            </Button>
          )}
          {sale.status === "live" && !sale.active_auction && (
            <>
              {!sale.is_paused && (
                <Button
                  onClick={() =>
                    window.confirm("Start next auction?") &&
                    action(`/admin/sales/${id}/start-next`)
                  }
                >
                  Start next auction
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  window.confirm("End sale?") &&
                  action(`/admin/sales/${id}/complete`, { force: true })
                }
              >
                End sale
              </Button>
            </>
          )}
        </div>
      </header>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {sale.status === "live" && (
        <Card>
          <CardHeader>
            <CardTitle>Live control</CardTitle>
          </CardHeader>
          <CardContent>
            {active ? (
              <p>
                {active.name} · Round {sale.active_auction?.round_number} · Ends{" "}
                {sale.active_auction?.ends_at &&
                  new Date(sale.active_auction.ends_at).toLocaleTimeString(
                    "en-IN",
                    {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    },
                  )}{" "}
                IST
              </p>
            ) : sale.is_paused ? (
              <div>
                <p className="font-medium text-primary">Sale is on a break</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sale.pause_description}
                </p>
                <Button
                  className="mt-3"
                  onClick={() => action(`/admin/sales/${id}/resume`)}
                >
                  Resume sale
                </Button>
              </div>
            ) : (
              <div>
                <p>Waiting to start next auction.</p>
                {!pauseFormOpen ? (
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => setPauseFormOpen(true)}
                  >
                    Pause sale for a break
                  </Button>
                ) : (
                  <form
                    className="mt-3 max-w-lg space-y-2 rounded-lg border p-3"
                    onSubmit={pauseSale}
                  >
                    <label className="grid gap-1 text-sm font-medium">
                      Message for customers
                      <textarea
                        required
                        maxLength={300}
                        value={pauseDescription}
                        onChange={(event) =>
                          setPauseDescription(event.target.value)
                        }
                        placeholder="Example: Guys, we are on a tea break. We will be back in 15 minutes."
                        className="min-h-24 rounded-md border bg-background px-3 py-2 font-normal"
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button type="submit">Pause sale</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPauseFormOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
            <div className="mt-3 flex gap-4 text-sm underline">
              <a href={`/sales/${id}`}>Open customer page</a>
              <a href={`/admin/sales/${id}/live`}>Open CEO live dashboard</a>
            </div>
          </CardContent>
        </Card>
      )}
      {sale.status === "live" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">
              Open a product to see its status and auction details.
            </p>
          </div>
          <div className="grid gap-3">
            {sale.products.map((product) => (
              <a
                key={product._id}
                href={`/admin/sales/${id}/products/${product._id}`}
                className="block"
              >
                <Card className="transition-colors hover:bg-muted/60">
                  <CardContent className="flex gap-4 py-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="size-16 rounded-md border object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm capitalize text-muted-foreground">
                        {product.status}
                      </p>
                      <p className="mt-1 font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.quantity_ml}ml · ₹{product.base_price}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </section>
      )}
      {sale.status === "completed" && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Sale summary</h2>
            <p className="text-sm text-muted-foreground">
              Final auction results
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">Sold</p>
                <p className="text-2xl font-semibold">{soldResults.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">Unsold</p>
                <p className="text-2xl font-semibold">
                  {
                    sale.results.filter((result) => result.status === "unsold")
                      .length
                  }
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-semibold">₹{revenue}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="divide-y py-2">
              {sale.results.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No completed auctions.
                </p>
              ) : (
                sale.results.map((result) => (
                  <a
                    key={result._id}
                    href={`/admin/sales/${id}/products/${result.product_id}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div>
                      <p className="font-medium">
                        {result.product?.name ?? "Deleted product"}
                      </p>
                      <p className="text-muted-foreground">
                        {result.status === "sold"
                          ? `${result.rounds_used} round${result.rounds_used === 1 ? "" : "s"}`
                          : "No bids"}
                        {result.random_reason ? " · Random selection" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-medium">
                          {result.status === "sold"
                            ? `₹${result.price}`
                            : "Unsold"}
                        </p>
                        {result.winner && (
                          <p className="text-muted-foreground">
                            {result.winner.name || result.winner.email}
                            {result.winner.phone
                              ? ` · ${result.winner.phone}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </a>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      )}
      {editable && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing ? `Edit ${editing.name}` : "Add partial product"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="grid gap-3 sm:grid-cols-2">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Perfume name"
                aria-label="Perfume name"
              />
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand"
                aria-label="Brand"
              />
              <Input
                required
                type="number"
                min="1"
                value={ml}
                onChange={(e) => setMl(e.target.value)}
                placeholder="Partial ml"
                aria-label="Partial ml"
              />
              <Input
                required
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Base price ₹"
                aria-label="Base price"
              />
              <Input
                required
                type="number"
                min="5"
                max="600"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Round seconds"
                aria-label="Round seconds"
              />
              <div className="space-y-3 sm:col-span-2">
                <Input
                  value={imageUrl}
                  onChange={(event) => {
                    setImageUrl(event.target.value);
                    setImageFile(null);
                    setImagePreview(event.target.value);
                  }}
                  onPaste={(event) => {
                    const file = event.clipboardData.files[0];
                    if (file) {
                      event.preventDefault();
                      selectImage(file);
                    }
                  }}
                  placeholder="Paste direct image URL"
                  type="url"
                />
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    selectImage(event.dataTransfer.files[0]);
                  }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground hover:bg-muted/50"
                >
                  <span>Drop image here, or click to choose from computer</span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      selectImage(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="max-h-48 rounded-lg border object-contain"
                  />
                )}
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button disabled={productSaveState !== "idle"}>
                  {productSaveState === "uploading"
                    ? "Uploading image…"
                    : productSaveState === "saving"
                      ? editing
                        ? "Saving changes…"
                        : "Adding product…"
                      : editing
                        ? "Save changes"
                        : "Add product"}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setName("");
                      setBrand("");
                      setMl("");
                      setPrice("");
                      setDuration("30");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              {productSaveState === "uploading" && (
                <p
                  aria-live="polite"
                  className="text-sm text-muted-foreground sm:col-span-2"
                >
                  Uploading the image to ImageKit before the product is saved.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}
      {editable && sale.products.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">
              Drag prepared products to reorder. Click a card to open details.
            </p>
          </div>
          <div className="space-y-3">
            {sale.products.map((product) => {
              const canDrag = product.status === "prepared";
              return (
                <a
                  key={product._id}
                  href={`/admin/sales/${id}/products/${product._id}`}
                  draggable={canDrag}
                  onDragStart={() => setDraggedId(product._id)}
                  onDragOver={(event) => canDrag && event.preventDefault()}
                  onDragEnd={() => setDraggedId(null)}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropOn(product._id);
                  }}
                  className={canDrag ? "block cursor-grab" : "block"}
                >
                  <Card
                    className={`transition-colors hover:bg-muted/60 ${draggedId === product._id ? "opacity-50" : ""}`}
                  >
                    <CardContent className="flex items-center justify-between gap-4 py-4">
                      <div>
                        <p className="text-sm capitalize text-muted-foreground">
                          {product.status}
                        </p>
                        <p className="mt-1 font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity_ml}ml · ₹{product.base_price} ·{" "}
                          {product.round_duration_seconds ?? 30}s
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canDrag && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              action(
                                `/admin/products/${product._id}/duplicate`,
                              );
                            }}
                          >
                            Duplicate
                          </Button>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Open →
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
