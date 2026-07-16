import "./globals.css";

const BASE_URL = "https://cvmask.vercel.app";
const SITE_NAME = "CV Anonymizer";
const DESCRIPTION =
  "Automatically detect and redact sensitive PII — emails, phone numbers, CNIC, LinkedIn and social links — from CVs and resumes. Fast, secure, and privacy-first.";

export const metadata = {
  metadataBase: new URL(BASE_URL),

  /* ── Title ── */
  title: {
    default: `${SITE_NAME} — Secure PII Redaction & CV Protection`,
    template: `%s | ${SITE_NAME}`,
  },

  /* ── Description ── */
  description: DESCRIPTION,

  /* ── Keywords ── */
  keywords: [
    "CV anonymizer",
    "resume anonymizer",
    "PII redaction",
    "CV privacy",
    "redact email from CV",
    "hide phone number CV",
    "CNIC redaction",
    "resume privacy tool",
    "CV protection",
    "blind recruitment",
    "anonymous resume",
    "data privacy CV",
    "remove personal info from resume",
    "resume redaction software",
    "CV sanitizer",
    "GDPR CV compliance",
    "personal data removal CV",
    "secure CV upload",
    "HR privacy tool",
    "bias-free recruitment",
    "contact info redaction",
    "resume anonymization tool",
  ],

  /* ── Authorship ── */
  authors: [{ name: "zohaibalishah", url: "https://github.com/zohaibalishah" }],
  creator: "zohaibalishah",
  publisher: SITE_NAME,

  /* ── Robots ── */
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* ── Canonical & hreflang Alternates ── */
  alternates: {
    canonical: BASE_URL,
    languages: {
      "x-default": BASE_URL,
      "en":    BASE_URL,
      "en-US": `${BASE_URL}/en`,
      "en-GB": `${BASE_URL}/en-gb`,
      "ar":    `${BASE_URL}/ar`,
      "ur":    `${BASE_URL}/ur`,
      "fr":    `${BASE_URL}/fr`,
      "de":    `${BASE_URL}/de`,
      "es":    `${BASE_URL}/es`,
      "zh":    `${BASE_URL}/zh`,
      "hi":    `${BASE_URL}/hi`,
      "pt":    `${BASE_URL}/pt`,
      "tr":    `${BASE_URL}/tr`,
    },
  },

  /* ── Open Graph ── */
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: `${SITE_NAME} — Secure PII Redaction & CV Protection`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "en_US",
    alternateLocale: [
      "ar_SA",
      "ur_PK",
      "fr_FR",
      "de_DE",
      "es_ES",
      "zh_CN",
      "hi_IN",
      "pt_BR",
      "tr_TR",
    ],
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "CV Anonymizer — Redact PII from CVs instantly",
        type: "image/png",
      },
    ],
  },

  /* ── Twitter / X ── */
  twitter: {
    card: "summary_large_image",
    site: "@zohaibalishah",
    creator: "@zohaibalishah",
    title: `${SITE_NAME} — Secure PII Redaction & CV Protection`,
    description: DESCRIPTION,
    images: [`${BASE_URL}/og-image.png`],
  },

  /* ── App / PWA ── */
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  /* ── Verification (add keys when available) ── */
  // verification: {
  //   google: "YOUR_GOOGLE_SITE_VERIFICATION_TOKEN",
  //   yandex: "YOUR_YANDEX_TOKEN",
  //   bing: "YOUR_BING_TOKEN",
  // },

  /* ── Category ── */
  category: "technology",

  /* ── Classification ── */
  classification: "Business, Productivity, Privacy",
};

/* ── JSON-LD: WebApplication ── */
const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: BASE_URL,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "All",
  inLanguage: ["en", "ar", "ur", "fr", "de", "es", "zh", "hi", "pt", "tr"],
  isAccessibleForFree: true,
  author: {
    "@type": "Person",
    name: "zohaibalishah",
    url: "https://github.com/zohaibalishah",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Automatic PII detection",
    "Email redaction",
    "Phone number redaction",
    "CNIC redaction",
    "LinkedIn & social link redaction",
    "PDF and DOCX support",
    "Downloadable redacted CV",
  ],
};

/* ── JSON-LD: BreadcrumbList ── */
const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: BASE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "CV Anonymizer",
      item: `${BASE_URL}/`,
    },
  ],
};

/* ── JSON-LD: FAQPage ── */
const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is CV Anonymizer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CV Anonymizer is a free online tool that automatically detects and redacts sensitive personal information (PII) such as emails, phone numbers, CNIC, and social media links from CVs and resumes.",
      },
    },
    {
      "@type": "Question",
      name: "Is CV Anonymizer free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, CV Anonymizer is completely free. Upload your CV, the PII is detected and hidden automatically, and you can download the redacted version.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats does CV Anonymizer support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CV Anonymizer supports PDF and DOCX (Microsoft Word) file formats.",
      },
    },
    {
      "@type": "Question",
      name: "Is my CV data stored?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CVs are processed securely and are not permanently stored. The tool is designed with privacy-first principles.",
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Viewport & Theme */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="dark light" />
        <meta name="msapplication-TileColor" content="#0f172a" />

        {/* Geo Tags */}
        <meta name="geo.region" content="PK" />
        <meta name="geo.country" content="Pakistan" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />

        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
