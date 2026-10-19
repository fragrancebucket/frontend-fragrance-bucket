"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  Gavel,
  LogOut,
  PlusCircle,
  QrCode,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-card transition-all ${open ? "w-64" : "w-16"}`}
      >
        <div className="flex h-16 items-center justify-between border-b px-3">
          <a
            href="/admin"
            className="flex items-center gap-2 overflow-hidden font-semibold"
          >
            <Gavel className="size-5 shrink-0" />
            {open && <span>Fragrance Bucket</span>}
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle sidebar"
          >
            {open ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <a
            href="/admin"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <PlusCircle className="size-4 shrink-0" />
            {open && "Partial Sales"}
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Users className="size-4 shrink-0" />
            {open && "Users"}
          </a>
          <a
            href="/admin/payment-settings"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <QrCode className="size-4 shrink-0" />
            {open && "Payment settings"}
          </a>
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4 shrink-0" />
            {open && "Log out"}
          </Button>
        </div>
      </aside>
      <div className={`transition-[margin] ${open ? "ml-64" : "ml-16"}`}>
        {children}
      </div>
    </div>
  );
}
