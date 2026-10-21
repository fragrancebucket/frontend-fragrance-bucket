"use client";
import { SessionProvider } from "next-auth/react";
import WhatsAppOnboarding from "@/components/whatsapp-onboarding";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <WhatsAppOnboarding />
    </SessionProvider>
  );
}
