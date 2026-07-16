import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { detectPII } from "@/services/detectPII";
import { anonymizePdf } from "@/services/pythonClient";
import { cvStore } from "@/lib/db";
import { summarizeCV } from "@/services/summarizeCV";

function fileKind(originalName, mimetype) {
  const ext = path.extname(originalName || "").toLowerCase();
  if (ext === ".pdf" || mimetype === "application/pdf") return "pdf";
  if (ext === ".doc" || ext === ".docx" || (mimetype || "").includes("word")) {
    return "word";
  }
  if (
    [".png", ".jpg", ".jpeg", ".jfif", ".webp", ".bmp", ".tif", ".tiff"].includes(
      ext
    ) ||
    (mimetype || "").startsWith("image/")
  ) {
    return "image";
  }
  return "other";
}

async function extractText(kind, filePath) {
  if (kind === "pdf") {
    try {
      const data = await pdfParse(fs.readFileSync(filePath));
      return data.text || "";
    } catch {
      return "";
    }
  }
  if (kind === "word") {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || "";
    } catch {
      return "";
    }
  }
  return "";
}

function publicBase(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("cv");
    const redactFieldsData = formData.get("redactFields");

    if (!file) {
      return NextResponse.json(
        { error: "No CV file uploaded (field name: cv)" },
        { status: 400 }
      );
    }

    let redactFields = ["emails", "phones", "linkedin", "github", "websites", "cnic", "licenses", "names", "companies", "locations"]; // default
    if (redactFieldsData) {
      try {
        redactFields = JSON.parse(redactFieldsData);
      } catch (e) {}
    }

    const id = uuidv4();
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase() || ".pdf";
    const originalFilename = `${id}${ext}`;
    const originalPath = path.join(process.cwd(), "uploads", "original", originalFilename);

    // Save file buffer to uploads/original
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Ensure dir exists
    fs.mkdirSync(path.dirname(originalPath), { recursive: true });
    fs.writeFileSync(originalPath, buffer);

    const kind = fileKind(originalName, file.type);
    const text = await extractText(kind, originalPath);
    const pii = detectPII(text);
    const summary = summarizeCV(text);
    const anonymousFilename = `${id}_anonymous.pdf`;

    // Filter values to redact based on redactFields choice
    const redactValues = [];
    if (redactFields.includes("emails")) redactValues.push(...pii.emails);
    if (redactFields.includes("phones")) redactValues.push(...pii.phones);
    if (redactFields.includes("linkedin")) redactValues.push(...pii.linkedin);
    if (redactFields.includes("github")) redactValues.push(...pii.github);
    if (redactFields.includes("websites")) redactValues.push(...pii.websites);
    if (redactFields.includes("cnic")) redactValues.push(...pii.cnic);
    if (redactFields.includes("licenses")) redactValues.push(...pii.licenses);

    const uniqueRedactValues = [...new Set(redactValues)];

    const outputDir = path.join(process.cwd(), "public", "files", "anonymous");

    // Call Python anonymizer client
    const anonymizeResult = await anonymizePdf({
      originalPath,
      values: uniqueRedactValues,
      outputFilename: anonymousFilename,
      outputDir,
      id,
      redactFields,
    });

    const record = {
      id,
      originalName,
      originalPath,
      kind,
      anonymousPath: anonymizeResult.path,
      anonymousFilename,
      redactFields,
      detected: {
        emails: pii.emails,
        phones: pii.phones,
        linkedin: pii.linkedin,
        github: pii.github,
        websites: pii.websites,
        cnic: pii.cnic,
        licenses: pii.licenses,
        names: anonymizeResult.ner?.names || [],
        companies: anonymizeResult.ner?.companies || [],
        locations: anonymizeResult.ner?.locations || [],
      },
      pages: anonymizeResult.pages || [],
      summary,
      ocrUsed: anonymizeResult.ocrUsed,
      scannedPages: anonymizeResult.scannedPages,
      idImagesHidden: anonymizeResult.idImagesHidden,
      warning: anonymizeResult.warning,
      convertedFromWord: anonymizeResult.convertedFromWord,
      paid: false,
      createdAt: new Date().toISOString(),
    };

    cvStore.set(id, record);

    return NextResponse.json({
      id,
      paid: false,
      kind,
      detected: {
        emails: record.redactFields.includes("emails") ? (record.detected.emails || []).map(() => "[hidden]") : record.detected.emails,
        phones: record.redactFields.includes("phones") ? (record.detected.phones || []).map(() => "[hidden]") : record.detected.phones,
        linkedin: record.redactFields.includes("linkedin") ? (record.detected.linkedin || []).map(() => "[hidden]") : record.detected.linkedin,
        github: record.redactFields.includes("github") ? (record.detected.github || []).map(() => "[hidden]") : record.detected.github,
        websites: record.redactFields.includes("websites") ? (record.detected.websites || []).map(() => "[hidden]") : record.detected.websites,
        cnic: record.redactFields.includes("cnic") ? (record.detected.cnic || []).map(() => "[hidden]") : record.detected.cnic,
        licenses: record.redactFields.includes("licenses") ? (record.detected.licenses || []).map(() => "[hidden]") : record.detected.licenses,
        names: record.redactFields.includes("names") ? (record.detected.names || []).map(() => "[hidden]") : record.detected.names,
        companies: record.redactFields.includes("companies") ? (record.detected.companies || []).map(() => "[hidden]") : record.detected.companies,
        locations: record.redactFields.includes("locations") ? (record.detected.locations || []).map(() => "[hidden]") : record.detected.locations,
      },
      pages: record.pages,
      summary: record.summary,
      ocrUsed: record.ocrUsed,
      scannedPages: record.scannedPages,
      idImagesHidden: record.idImagesHidden,
      convertedFromWord: record.convertedFromWord,
      warning: record.warning,
      previewUrl: `${publicBase(request)}/files/anonymous/${anonymousFilename}`,
      message:
        "Contact details hidden. Call POST /api/cv/:id/unlock after payment to reveal.",
    }, { status: 201 });

  } catch (err) {
    console.error("uploadCv error:", err.message);
    return NextResponse.json(
      { error: "Failed to anonymize CV", detail: err.message },
      { status: 500 }
    );
  }
}
