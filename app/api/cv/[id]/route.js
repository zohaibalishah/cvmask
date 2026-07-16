import { NextResponse } from "next/server";
import { cvStore } from "@/lib/db";

function publicBase(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function GET(request, { params }) {
  const { id } = await params;
  const record = cvStore.get(id);

  if (!record) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const redactFields = record.redactFields || ["emails", "phones", "linkedin", "github", "websites", "cnic", "licenses", "names", "companies", "locations"];

  return NextResponse.json({
    id: record.id,
    originalName: record.originalName,
    kind: record.kind,
    paid: record.paid,
    detected: record.paid
      ? record.detected
      : {
          emails: redactFields.includes("emails") ? (record.detected.emails || []).map(() => "[hidden]") : record.detected.emails,
          phones: redactFields.includes("phones") ? (record.detected.phones || []).map(() => "[hidden]") : record.detected.phones,
          linkedin: redactFields.includes("linkedin") ? (record.detected.linkedin || []).map(() => "[hidden]") : record.detected.linkedin,
          github: redactFields.includes("github") ? (record.detected.github || []).map(() => "[hidden]") : record.detected.github,
          websites: redactFields.includes("websites") ? (record.detected.websites || []).map(() => "[hidden]") : record.detected.websites,
          cnic: redactFields.includes("cnic") ? (record.detected.cnic || []).map(() => "[hidden]") : record.detected.cnic,
          licenses: redactFields.includes("licenses") ? (record.detected.licenses || []).map(() => "[hidden]") : record.detected.licenses,
          names: redactFields.includes("names") ? (record.detected.names || []).map(() => "[hidden]") : record.detected.names || [],
          companies: redactFields.includes("companies") ? (record.detected.companies || []).map(() => "[hidden]") : record.detected.companies || [],
          locations: redactFields.includes("locations") ? (record.detected.locations || []).map(() => "[hidden]") : record.detected.locations || [],
        },
    previewUrl: `${publicBase(request)}/files/anonymous/${record.anonymousFilename}`,
    unlockAvailable: !record.paid,
    pages: record.pages || [],
    summary: record.summary || null,
  });
}
