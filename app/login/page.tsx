import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session) redirect("/");
  const { callbackUrl } = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-muted p-6"><LoginForm callbackUrl={callbackUrl?.startsWith("/") ? callbackUrl : "/"} /></main>;
}
