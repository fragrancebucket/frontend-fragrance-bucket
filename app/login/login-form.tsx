"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [redirecting, setRedirecting] = useState(false);

  const beginGoogleSignIn = async () => {
    if (redirecting) return;
    setRedirecting(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setRedirecting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-sm font-medium text-muted-foreground">FRAGRANCE BUCKET</p>
        <CardTitle>Sign in to continue</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-sm text-muted-foreground">
          Use your Google account to join auctions or manage sales.
        </p>
        <Button className="w-full" disabled={redirecting} onClick={beginGoogleSignIn}>
          <CircleUserRound className="mr-2 size-4" />
          {redirecting ? "Redirecting to Google…" : "Continue with Google"}
        </Button>
      </CardContent>
    </Card>
  );
}
