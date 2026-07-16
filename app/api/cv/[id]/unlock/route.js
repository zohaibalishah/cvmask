import { NextResponse } from "next/server";
import { cvStore } from "@/lib/db";

function publicBase(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request, { params }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const record = cvStore.get(id);

  if (!record) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  record.paid = true;
  record.paymentId = body?.paymentId || null;
  record.unlockedAt = new Date().toISOString();
  cvStore.set(record.id, record);

  return NextResponse.json({
    id: record.id,
    paid: true,
    downloadUrl: `${publicBase(request)}/api/cv/${record.id}/download`,
    detected: record.detected,
    message: "Contact details unlocked. Download now returns the original CV.",
  });
}
