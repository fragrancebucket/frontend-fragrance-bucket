import AuctionClient from "./auction-client";

export default async function SalePage({ params }: { params: Promise<{ saleId: string }> }) { const { saleId } = await params; return <AuctionClient saleId={saleId} />; }
