import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cvStore } from "@/lib/db";

export async function GET(request, { params }) {
  const { id } = await params;
  const record = cvStore.get(id);

  if (!record) {
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const filePath = record.paid ? record.originalPath : record.anonymousPath;
  const downloadName = record.paid
    ? record.originalName
    : `${path.parse(record.originalName).name}_anonymous.pdf`;

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(downloadName).toLowerCase();
  
  let mimeType = "application/pdf";
  if (ext === ".docx") {
    mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (ext === ".doc") {
    mimeType = "application/msword";
  } else if (ext === ".png") {
    mimeType = "image/png";
  } else if (ext === ".jpg" || ext === ".jpeg") {
    mimeType = "image/jpeg";
  }

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": fileBuffer.length.toString(),
    },
  });
}
