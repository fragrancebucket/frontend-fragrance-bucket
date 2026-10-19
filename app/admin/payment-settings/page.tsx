"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

export default function PaymentSettingsPage() {
  const { data: session, status } = useSession();
  const [qrUrl, setQrUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!session?.apiToken) return;
    fetch(`${API}/admin/payment-settings`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.qr_url) {
          setQrUrl(data.qr_url);
          setPreview(data.qr_url);
        }
      });
  }, [session?.apiToken]);

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setMessage("Choose an image file for the payment QR.");
      return;
    }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setMessage("");
  }

  async function uploadQr() {
    if (!file) return qrUrl.trim();
    const data = new FormData();
    data.append("file", file);
    const response = await fetch(`${API}/admin/uploads/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.apiToken ?? ""}` },
      body: data,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(payload.detail ?? "Could not upload the QR image.");
    return payload.url as string;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const uploadedUrl = await uploadQr();
      if (!uploadedUrl) throw new Error("Add a QR image or public image URL.");
      const response = await fetch(`${API}/admin/payment-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.apiToken ?? ""}`,
        },
        body: JSON.stringify({ qr_url: uploadedUrl }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload.detail ?? "Could not save payment settings.");
      setQrUrl(uploadedUrl);
      setPreview(uploadedUrl);
      setFile(null);
      setMessage(
        "Payment QR saved. New auction winners can now receive it on WhatsApp.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save payment settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading")
    return (
      <main className="grid min-h-screen place-items-center">
        Loading payment settings…
      </main>
    );
  if (session?.role !== "admin")
    return (
      <main className="grid min-h-screen place-items-center">
        Admin access required.
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
      <header>
        <p className="text-sm font-semibold text-muted-foreground">PAYMENTS</p>
        <h1 className="mt-1 text-3xl font-semibold">Payment QR</h1>
        <p className="mt-2 text-muted-foreground">
          This image is sent in the approved WhatsApp payment template for every
          new auction winner.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Static payment QR</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-5">
            <label className="grid gap-2 text-sm font-medium">
              Upload QR image
              <Input type="file" accept="image/*" onChange={selectFile} />
              <span className="text-xs font-normal text-muted-foreground">
                PNG or JPG, up to 10 MB. Uploading replaces the QR for future
                payment requests.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Or enter a direct image URL
              <Input
                value={qrUrl}
                onChange={(event) => {
                  setQrUrl(event.target.value);
                  if (!file) setPreview(event.target.value);
                }}
                placeholder="https://.../payment-qr.png"
              />
            </label>
            {preview && (
              <img
                src={preview}
                alt="Current payment QR preview"
                className="size-52 rounded-xl border bg-white object-contain p-3"
              />
            )}
            {message && (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save payment QR"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
