import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { investigationId } = body;

    if (!investigationId) {
      return NextResponse.json({ error: 'Missing investigationId' }, { status: 400 });
    }

    // Fetch actual evidence/events tied to this investigation to generate a deterministic hash
    const invEntities = await prisma.investigationEntity.findMany({
      where: { investigationId },
      include: {
        entity: {
          include: {
            events: {
              select: { id: true }
            }
          }
        }
      }
    });

    // Extract all real event ids related to the entities in this investigation
    const realHashes = invEntities.flatMap(ie => 
      ie.entity.events.map((ev: { id: string }) => ev.id).filter(Boolean)
    ) as string[];

    // Sort to ensure deterministic output
    realHashes.sort();

    const timestamp = new Date().toISOString();
    
    const hashStream = crypto.createHash('sha256');
    hashStream.update(`report_investigation_${investigationId}_`);
    if (realHashes.length > 0) {
      hashStream.update(realHashes.join(''));
    } else {
      // Fallback if no events exist yet
      hashStream.update(`fallback_mock_data_${timestamp}`);
    }

    const reportHash = hashStream.digest('hex');

    // Simulate sealing delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    return NextResponse.json({
      generatedAt: timestamp,
      reportHash,
      downloadUrl: `/downloads/report_${investigationId}.pdf`,
      evidenceCount: realHashes.length
    });
  } catch (error) {
    console.error("Report generation failed:", error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
