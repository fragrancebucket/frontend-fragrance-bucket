import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.apiToken) redirect("/login?callbackUrl=/profile");
  return <ProfileClient />;
}
