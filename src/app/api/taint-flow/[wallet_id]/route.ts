import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ wallet_id: string }> }) {
  const params = await context.params;
  const { wallet_id } = params;

  // Real data traversal: BFS from wallet_id for up to 2 hops
  const flows: any[] = [];
  const visited = new Set<string>();
  let queue = [wallet_id];
  let depth = 0;
  let totalFlow = 0;

  while (queue.length > 0 && depth < 2) {
    const nextQueue = [];
    
    for (const currentId of queue) {
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Find relationships where currentId is the source
      const edges = await prisma.relationship.findMany({
        where: { sourceId: currentId },
        include: {
          source: true,
          target: true
        }
      });

      for (const edge of edges) {
        if (!edge.target) continue;
        
        const riskScore = edge.target.priorityScore || 0;
        let riskLevel = "INFO";
        if (riskScore > 66) riskLevel = "CRITICAL";
        else if (riskScore > 33) riskLevel = "HIGH";
        else if (riskScore > 0) riskLevel = "MEDIUM";

        // Generate deterministic flow value based on evidence count
        const value = Math.max(1000, edge.evidenceCount * 5000);
        if (depth === 0) totalFlow += value;

        flows.push({
          id: edge.id,
          source: edge.source.label,
          target: edge.target.label,
          value,
          risk: riskLevel
        });

        nextQueue.push(edge.targetId);
      }
    }
    
    queue = nextQueue;
    depth++;
  }

  // Fallback if the database has absolutely no relationships for this wallet
  if (flows.length === 0) {
    return NextResponse.json({
      walletId: wallet_id,
      totalFlow: 0,
      flows: []
    });
  }

  return NextResponse.json({
    walletId: wallet_id,
    totalFlow,
    flows
  });
}
