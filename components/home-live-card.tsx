import { ArrowUpRight, Radio } from "lucide-react";

export type LiveSaleCardData = { id: string; name: string; saleDate?: string };

export function HomeLiveCard({ sale }: { sale: LiveSaleCardData }) {
  return (
    <a
      href={`/sales/${sale.id}`}
      className="group block min-w-[276px] snap-start rounded-[1.5rem] border bg-card p-5 shadow-sm transition duration-200 active:scale-[.98] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[.15em] text-red-700">
          <Radio aria-hidden="true" className="size-3" />
          LIVE
        </span>
        <ArrowUpRight
          aria-hidden="true"
          className="size-5 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
      <h3 className="mt-10 text-2xl font-semibold leading-tight">
        {sale.name}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the live auction room
      </p>
      <span className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
        Join auction
      </span>
    </a>
  );
}

export function HomeLiveCardSkeleton() {
  return (
    <div className="min-w-[276px] animate-pulse rounded-[1.5rem] border bg-card p-5">
      <div className="h-3 w-14 rounded bg-muted" />
      <div className="mt-10 h-7 w-44 rounded bg-muted" />
      <div className="mt-3 h-4 w-32 rounded bg-muted" />
      <div className="mt-6 h-5 w-24 rounded bg-muted" />
    </div>
  );
}
