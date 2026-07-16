/** @type {import('next').NextConfig} */

const BASE_URL = "https://cvmask.vercel.app";

const securityHeaders = [
  /* ── Content-Security-Policy ── */
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",                  // Next.js requires unsafe-inline for hydration
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self'",
      "connect-src 'self' http://127.0.0.1:5001",                         // Python backend
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },

  /* ── Strict Transport Security (HSTS) ── */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  /* ── X-Content-Type-Options ── */
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  /* ── X-Frame-Options ── */
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  /* ── X-XSS-Protection ── */
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },

  /* ── Referrer-Policy ── */
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  /* ── Permissions-Policy ── */
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",       // disables FLoC / Topics API (privacy)
      "payment=()",
      "usb=()",
    ].join(", "),
  },

  /* ── Cross-Origin policies ── */
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "require-corp",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },

  /* ── Cache-Control (for HTML pages) ── */
  {
    key: "Cache-Control",
    value: "public, max-age=0, must-revalidate",
  },
];

const nextConfig = {
  reactStrictMode: true,

  /* ── HTTP Headers ── */
  async headers() {
    return [
      {
        source: "/(.*)",          // apply to all routes
        headers: securityHeaders,
      },
    ];
  },

  /* ── Compression ── */
  compress: true,

  /* ── Powered-By header (remove for security) ── */
  poweredByHeader: false,
};

export default nextConfig;
