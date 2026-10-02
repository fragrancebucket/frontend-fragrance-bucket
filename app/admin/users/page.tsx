"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: "admin" | "customer";
  createdAt?: string | null;
  lastLoginAt?: string | null;
};

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.apiToken) return;
    fetch(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load users.");
        return response.json();
      })
      .then(setUsers)
      .catch((reason) => setError(reason.message));
  }, [session?.apiToken]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone, user.role]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle)),
    );
  }, [query, users]);

  if (status === "loading") {
    return (
      <main className="grid min-h-screen place-items-center text-muted-foreground">
        Loading users…
      </main>
    );
  }
  if (session?.role !== "admin") {
    return (
      <main className="grid min-h-screen place-items-center">
        Admin access required.
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            ADMINISTRATION
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-muted-foreground">
            Registered accounts and contact details.
          </p>
        </div>
        <div className="rounded-xl border bg-card px-4 py-3 text-right">
          <p className="text-2xl font-semibold">{users.length}</p>
          <p className="text-xs text-muted-foreground">registered users</p>
        </div>
      </header>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" /> All users
          </CardTitle>
          <label className="relative block w-full sm:w-72">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone"
              className="pl-9"
            />
          </label>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Last login</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {user.name || "Unnamed user"}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          {user.email || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">{user.phone || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.lastLoginAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  No users match this search.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
