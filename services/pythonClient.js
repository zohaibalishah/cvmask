const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const PYTHON_URL = process.env.PYTHON_URL || "http://127.0.0.1:5001";

/**
 * Send PDF + PII strings to Python anonymizer.
 * Returns path to saved anonymous PDF.
 */
async function anonymizePdf({ originalPath, values, outputFilename, outputDir, id, redactFields }) {
  const form = new FormData();
  form.append("file", fs.createReadStream(originalPath));
  form.append("values", JSON.stringify(values));
  if (outputDir) form.append("output_dir", outputDir);
  if (id) form.append("id", id);
  if (redactFields) form.append("redact_fields", JSON.stringify(redactFields));

  const response = await axios.post(`${PYTHON_URL}/anonymize`, form, {
    headers: form.getHeaders(),
    responseType: "arraybuffer",
    timeout: 120000,
    maxContentLength: 50 * 1024 * 1024,
  });

  const outPath = path.join(
    process.cwd(),
    "public",
    "files",
    "anonymous",
    outputFilename
  );

  // Ensure directory exists
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outPath, Buffer.from(response.data));

  // Extract pages metadata if returned in headers
  // Extract pages and NER metadata if returned in headers
  let pages = [];
  let ner = { names: [], companies: [], locations: [] };
  try {
    const rawPagesMeta = response.headers["x-cv-pages-meta"];
    if (rawPagesMeta) {
      pages = JSON.parse(rawPagesMeta);
    }
  } catch (e) {
    console.error("Failed to parse pages meta header:", e);
  }

  try {
    const rawNerMeta = response.headers["x-cv-ner-meta"];
    if (rawNerMeta) {
      ner = JSON.parse(rawNerMeta);
    }
  } catch (e) {
    console.error("Failed to parse NER meta header:", e);
  }

  return {
    path: outPath,
    ocrUsed: response.headers["x-cv-ocr-used"] === "true",
    scannedPages: Number(response.headers["x-cv-scanned-pages"] || 0),
    idImagesHidden: Number(response.headers["x-cv-id-images-hidden"] || 0),
    convertedFromWord: response.headers["x-cv-converted-from-word"] === "true",
    warning: response.headers["x-cv-warning"] || null,
    pages,
    ner,
  };
}

async function redactCoordsPdf({ originalPath, coords, outputFilename, outputDir, id }) {
  const form = new FormData();
  form.append("file", fs.createReadStream(originalPath));
  form.append("coords", JSON.stringify(coords));
  form.append("output_dir", outputDir);
  form.append("output_filename", outputFilename);
  form.append("id", id);

  const response = await axios.post(`${PYTHON_URL}/redact-coords`, form, {
    headers: form.getHeaders(),
    timeout: 120000,
  });

  return response.data; // returns { ok: true, pages: [...] }
}

async function healthCheck() {
  try {
    const res = await axios.get(`${PYTHON_URL}/health`, { timeout: 3000 });
    return res.data;
  } catch {
    return { ok: false };
  }
}

module.exports = { anonymizePdf, redactCoordsPdf, healthCheck, PYTHON_URL };
