import { NextResponse } from "next/server";
import { StanfordAddressClusterer, BlockchainTransaction } from "@/lib/analytics/clustering";

/**
 * POST /api/analytics/cluster
 *
 * Stanford SNAP co-spend address clustering.
 * Body: { transactions: BlockchainTransaction[] }
 * Returns: ClusteredEntity[]
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transactions: BlockchainTransaction[] = body.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: "transactions array is required and must be non-empty" },
        { status: 400 }
      );
    }

    const clusterer = new StanfordAddressClusterer();
    const clusters = clusterer.processTransactions(transactions);

    return NextResponse.json({
      clusterCount: clusters.length,
      clusters,
      methodology: "Stanford SNAP CS224W Multi-Input Co-Spend Heuristic",
    });
  } catch (err: any) {
    console.error("Cluster API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to run address clustering" },
      { status: 500 }
    );
  }
}
