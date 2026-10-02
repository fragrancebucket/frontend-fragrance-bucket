import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ saleId: string }> }) {
  const session = await auth();
  const { saleId } = await params;
  if (!session) redirect(`/login?callbackUrl=/sales/${saleId}`);
  return children;
}
