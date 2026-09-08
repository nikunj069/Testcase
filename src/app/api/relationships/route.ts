import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceId, targetId, type, confidence, provenance } = body;

    if (!sourceId || !targetId || !type) {
      return NextResponse.json({ error: "sourceId, targetId and type are required" }, { status: 400 });
    }

    const relationship = await prisma.relationship.create({
      data: {
        sourceId,
        targetId,
        type,
        confidence: confidence ?? 0.8,
        provenance: provenance ?? null,
        evidenceCount: 1,
      },
    });

    return NextResponse.json({ success: true, relationship });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
