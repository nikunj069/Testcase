import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['UNREAD', 'ACKNOWLEDGED', 'DISMISSED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error("Failed to update alert:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
