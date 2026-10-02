"use client";

import { useState } from "react";

export default function HeroBottle() {
  const [spray, setSpray] = useState(0);

  return (
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={() => setSpray((count) => count + 1)}
        aria-label="Spray the perfume"
        className="group absolute inset-0 grid place-items-center touch-manipulation rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <img
          src="/hero-bottle-nozzle.png"
          alt="Unbranded dark navy perfume bottle"
          className="h-[91%] w-[91%] object-contain drop-shadow-[0_26px_20px_rgba(20,27,42,0.22)] transition-transform duration-300 group-active:scale-[0.97]"
        />
        <img
          key={`cap-${spray}`}
          src="/hero-bottle.png"
          alt=""
          aria-hidden="true"
          className={
            spray
              ? "hero-bottle-cap hero-bottle-cap-spraying"
              : "hero-bottle-cap"
          }
        />
        {spray > 0 && (
          <>
            <span
              key={`mist-main-${spray}`}
              aria-hidden="true"
              className="perfume-spray perfume-spray-main"
            />
            <span
              key={`mist-left-${spray}`}
              aria-hidden="true"
              className="perfume-spray perfume-spray-left"
            />
            <span
              key={`mist-right-${spray}`}
              aria-hidden="true"
              className="perfume-spray perfume-spray-right"
            />
            <span
              key={`mist-near-${spray}`}
              aria-hidden="true"
              className="perfume-spray perfume-spray-near"
            />
          </>
        )}
      </button>
      <span className="pointer-events-none absolute bottom-[11%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/80 bg-background/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground opacity-85 backdrop-blur">
        Tap to spray
      </span>
    </div>
  );
}
