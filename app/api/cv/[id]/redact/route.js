import { NextResponse } from "next/server";
import path from "path";
import { cvStore } from "@/lib/db";
import { redactCoordsPdf } from "@/services/pythonClient";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { coords } = body;

    if (!coords || !Array.isArray(coords)) {
      return NextResponse.json({ error: "Missing or invalid 'coords' array" }, { status: 400 });
    }

    const record = cvStore.get(id);
    if (!record) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const outputDir = path.join(process.cwd(), "public", "files", "anonymous");

    // Call Python coordinator redact endpoint
    const result = await redactCoordsPdf({
      originalPath: record.originalPath,
      coords,
      outputFilename: record.anonymousFilename,
      outputDir,
      id,
    });

    if (!result || !result.ok) {
      return NextResponse.json({ error: "Failed to apply coordinates redactions on PDF" }, { status: 500 });
    }

    // Update pages metadata in the database
    record.pages = result.pages || [];
    cvStore.set(id, record);

    return NextResponse.json({
      ok: true,
      pages: record.pages,
    });

  } catch (err) {
    console.error("redactCoords route error:", err);
    return NextResponse.json({ error: "Internal server error", detail: err.message }, { status: 500 });
  }
}
