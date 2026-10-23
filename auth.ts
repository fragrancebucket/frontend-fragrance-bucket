import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

declare module "next-auth" { interface Session { apiToken?: string; role?: string; } }
declare module "@auth/core/jwt" { interface JWT { apiToken?: string; role?: string; } }

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const THIRTY_DAYS = 30 * 24 * 60 * 60;
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt", maxAge: THIRTY_DAYS },
  jwt: { maxAge: THIRTY_DAYS },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        let response: Response;
        try {
          response = await fetch(`${API}/auth/google/exchange`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Exchange-Secret": process.env.BACKEND_EXCHANGE_SECRET ?? "",
            },
            body: JSON.stringify({ email: profile.email, name: profile.name, image: profile.picture }),
            cache: "no-store",
            signal: AbortSignal.timeout(60_000),
          });
        } catch (error) {
          console.error("Backend identity exchange request failed", {
            api: API,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
        if (!response.ok) {
          console.error("Backend identity exchange was rejected", {
            api: API,
            status: response.status,
          });
          throw new Error("Backend identity exchange failed.");
        }
        const identity = await response.json() as { accessToken: string; role: string };
        token.apiToken = identity.accessToken; token.role = identity.role;
      }
      return token;
    },
    async session({ session, token }) { session.apiToken = token.apiToken; session.role = token.role; return session; },
  },
});
