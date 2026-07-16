/**
 * Detect emails, phones, LinkedIn, websites, CNIC, and license numbers.
 * Returns unique matches for Python redaction.
 */

const EMAIL_RE =
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const PHONE_RE =
  /(?:\+?\d{1,3}[\s\-.]?)?(?:\(?\d{2,4}\)?[\s\-.]?)?\d{3,4}[\s\-.]?\d{3,8}(?:\s*(?:ext|x|extension)\.?\s*\d{1,5})?/gi;

const LINKEDIN_RE =
  /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub|company)\/[a-zA-Z0-9\-_%]+\/?/gi;

const SHORT_LINKEDIN_RE =
  /\bin\/[a-zA-Z0-9\-_%]{3,30}\b\/?/gi;

const GITHUB_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:github\.com|github\.io|git\.io)\/[a-zA-Z0-9\-_%]+\/?/gi;

function looksLikeShortLinkedin(value) {
  const clean = value.replace(/^in\//i, "").replace(/\/$/, "").toLowerCase().trim();
  const ignore = new Set([
    "out", "dev", "ops", "off", "one", "two", "the", "and", "any", "all", "its", 
    "our", "use", "url", "pdf", "doc", "xml", "api", "web", "app", "sys", "git", "net", "dot", "env"
  ]);
  return !ignore.has(clean);
}

const WEBSITE_RE =
  /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/gi;

// Pakistan CNIC: 12345-1234567-1 or 1234512345671
const CNIC_DASHED_RE = /\b\d{5}[-\s]?\d{7}[-\s]?\d\b/g;

// Lines like: CNIC: 12345-1234567-1 / NIC / National ID
const CNIC_LABELED_RE =
  /(?:cnic|n\.?i\.?c\.?|national\s*(?:id|identity)\s*(?:card|no\.?|number)?|nadra)\s*[:#-]?\s*([0-9][0-9\-\s]{11,16}[0-9])/gi;

// Driving / professional license numbers near keywords
const LICENSE_LABELED_RE =
  /(?:driving\s*licen[cs]e|driver'?s?\s*licen[cs]e|licen[cs]e\s*(?:no\.?|number|#)|dl\s*(?:no\.?|number)|passport\s*(?:no\.?|number)|visa\s*(?:no\.?|number))\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-\/]{4,24})/gi;

function unique(list) {
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))];
}

function looksLikePhone(value) {
  const digits = value.replace(/\D/g, "");
  // Local mobile/landline typically 10–15 digits (CNIC is 13 — handled below)
  if (digits.length < 10 || digits.length > 15) return false;
  if (digits.length === 13) return false;
  if (/^\d{4}$/.test(value.trim())) return false;
  return true;
}

function looksLikeWebsite(value) {
  const lower = value.toLowerCase().trim();
  if (lower.includes("@")) return false;
  if (lower.includes("linkedin.com")) return false;
  if (lower.includes("github.com") || lower.includes("github.io") || lower.includes("git.io")) return false;
  if (!/\.[a-z]{2,}/i.test(value)) return false;

  const skip = ["http://", "https://", "www."];
  const hasScheme = skip.some((p) => lower.startsWith(p));

  // If it doesn't have http/https/www, ignore common tech skills/frameworks ending in .js, .css, or socket.io
  if (!hasScheme) {
    if (
      lower.endsWith(".js") || 
      lower.endsWith(".css") || 
      lower === "socket.io"
    ) {
      return false;
    }
  }

  if (hasScheme) return true;
  return /[a-z0-9\-]+\.[a-z]{2,}(?:\/|\b)/i.test(value);
}

function looksLikeCnic(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 13;
}

function normalizeCnic(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 13) return value.trim();
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function detectCnic(text = "") {
  const found = [];

  for (const m of text.matchAll(CNIC_LABELED_RE)) {
    if (m[1] && looksLikeCnic(m[1])) found.push(m[1].trim());
  }
  for (const m of text.match(CNIC_DASHED_RE) || []) {
    if (looksLikeCnic(m)) found.push(m.trim());
  }

  const out = [];
  for (const v of unique(found)) {
    out.push(v);
    const dashed = normalizeCnic(v);
    const digits = v.replace(/\D/g, "");
    out.push(dashed);
    out.push(digits);
  }
  return unique(out);
}

function detectLicenses(text = "") {
  const found = [];
  for (const m of text.matchAll(LICENSE_LABELED_RE)) {
    if (m[1]) found.push(m[1].trim());
  }
  return unique(found).filter((v) => {
    if (looksLikeCnic(v)) return false;
    if (/^\d{4}$/.test(v)) return false;
    return v.length >= 5;
  });
}

function overlapsCnic(phone, cnicList) {
  const phoneDigits = phone.replace(/\D/g, "");
  return cnicList.some((c) => {
    const cnicDigits = c.replace(/\D/g, "");
    return cnicDigits.includes(phoneDigits) || phoneDigits.includes(cnicDigits);
  });
}

function detectPII(text = "") {
  const emails = unique(text.match(EMAIL_RE) || []);
  const linkedin = unique([
    ...(text.match(LINKEDIN_RE) || []),
    ...(text.match(SHORT_LINKEDIN_RE) || []).filter(looksLikeShortLinkedin)
  ]);
  const github = unique(text.match(GITHUB_RE) || []);
  const websites = unique(
    (text.match(WEBSITE_RE) || []).filter(looksLikeWebsite)
  );
  const cnic = detectCnic(text);
  const licenses = detectLicenses(text);

  const phones = unique(
    (text.match(PHONE_RE) || [])
      .filter(looksLikePhone)
      .filter((p) => !overlapsCnic(p, cnic))
  );

  return {
    emails,
    phones,
    linkedin,
    github,
    websites,
    cnic,
    licenses,
    all: unique([
      ...emails,
      ...phones,
      ...linkedin,
      ...github,
      ...websites,
      ...cnic,
      ...licenses,
    ]),
  };
}

module.exports = { detectPII };
