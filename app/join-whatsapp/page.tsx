import type { Metadata } from "next";
import { ArrowUpRight, Check, MessageCircle, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Join the Fragrance Bucket community",
  description: "Get first access to live perfume auctions and fragrance drops.",
};

const communityUrl = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL;

export default function JoinWhatsAppPage() {
  const canJoin = Boolean(communityUrl);

  return (
    <main className="min-h-dvh overflow-hidden bg-[#101510] text-[#f7f5ee]">
      <div className="relative mx-auto min-h-dvh max-w-6xl px-5 pb-10 pt-5 sm:px-8 sm:pt-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-12">
        <div className="pointer-events-none absolute -left-28 top-24 size-[22rem] rounded-full bg-[#c6e88f]/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 bottom-0 size-[24rem] rounded-full bg-[#b7b268]/10 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between lg:col-span-2">
          <a href="/" className="text-sm font-semibold tracking-[-0.03em] transition-opacity hover:opacity-75">
            Fragrance Bucket
          </a>
          <a
            href="/"
            className="inline-flex min-h-11 items-center text-sm text-[#d6d9cf] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6e88f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101510]"
          >
            Explore auctions
          </a>
        </header>

        <section className="relative z-10 pt-14 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#d9e7bf]/20 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#d7e9b6]">
            <span className="size-1.5 rounded-full bg-[#b9ee6b] shadow-[0_0_12px_#b9ee6b]" />
            The fragrance inner circle
          </p>
          <h1 className="mt-6 max-w-xl text-balance text-5xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            Get the best perfume deals before they&apos;re gone.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#c8cbc3] sm:text-lg">
            Join the Fragrance Bucket WhatsApp community for first access to live perfume auctions, sought-after partials, and special fragrance drops.
          </p>

          {canJoin ? (
            <div className="mt-6">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#c6ef8a]">
                Free to join
              </p>
              <a
                href={communityUrl}
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex min-h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#ecffc8] bg-[#b9ee6b] px-6 text-base font-extrabold text-[#14200e] ring-4 ring-[#b9ee6b]/15 shadow-[0_20px_65px_rgba(185,238,107,0.35)] transition duration-200 hover:-translate-y-1 hover:bg-[#d2fa91] hover:shadow-[0_24px_75px_rgba(185,238,107,0.46)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7ffbc] focus-visible:ring-offset-4 focus-visible:ring-offset-[#101510] sm:w-auto"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/90" />
                <MessageCircle aria-hidden="true" className="relative size-5" />
                <span className="relative">Join WhatsApp community</span>
                <ArrowUpRight aria-hidden="true" className="relative size-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          ) : (
            <div className="mt-9 max-w-md rounded-2xl border border-[#d9e7bf]/20 bg-white/5 p-4 text-sm leading-6 text-[#d9ddd3]">
              Add your WhatsApp Community invite URL to <code className="rounded bg-black/25 px-1.5 py-0.5 text-[#d7e9b6]">NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL</code> to activate the join button.
            </div>
          )}

          <div className="mt-9 grid gap-3 text-sm text-[#d0d4ca] sm:grid-cols-3">
            {["Live auction alerts", "Fresh fragrance drops", "Community updates"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#b9ee6b]/15 text-[#c6ef8a]">
                  <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section aria-hidden="true" className="relative mx-auto mt-14 flex h-[330px] w-full max-w-[390px] items-center justify-center lg:mt-0 lg:h-[540px] lg:max-w-none">
          <div className="absolute inset-[8%] rounded-full border border-[#dde7cb]/15" />
          <div className="absolute inset-[20%] rounded-full border border-[#dde7cb]/10" />
          <div className="absolute inset-x-[24%] bottom-[14%] h-[52%] rounded-[2.5rem_2.5rem_3.25rem_3.25rem] border border-white/20 bg-[linear-gradient(135deg,rgba(220,240,193,.4),rgba(32,48,28,.6)_35%,rgba(13,20,12,.94)_72%)] shadow-[inset_0_0_30px_rgba(231,255,188,.16),0_35px_70px_rgba(0,0,0,.42)]" />
          <div className="absolute bottom-[60%] h-[18%] w-[34%] rounded-t-[1.4rem] border border-white/25 bg-[linear-gradient(90deg,#192318,#43533a_48%,#172017)] shadow-[0_-8px_30px_rgba(197,238,127,.15)]" />
          <div className="absolute bottom-[56%] h-[6%] w-[42%] rounded-full border border-[#dff5b8]/25 bg-[#57694c]" />
          <div className="absolute bottom-[28%] left-[24%] right-[24%] h-px bg-[#e5f7c4]/30" />
          <div className="absolute bottom-[18%] max-w-[11rem] text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d7e9b6]/80">
            Fragrance Bucket
          </div>
          <div className="absolute right-[10%] top-[16%] grid size-14 place-items-center rounded-full border border-[#dcebc9]/20 bg-[#182015]/75 text-[#c6ef8a] shadow-xl backdrop-blur-sm lg:size-16">
            <Sparkles className="size-5 lg:size-6" />
          </div>
        </section>

        <p className="relative z-10 mt-4 text-center text-xs leading-5 text-[#959b90] lg:col-span-2 lg:mt-0">
          No spam. Just the drops worth knowing about.
        </p>
      </div>
    </main>
  );
}
