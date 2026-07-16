"use client";

import { useState, useRef, useEffect } from "react";
import translations from "@/lib/translations";

const LANGS = Object.entries(translations).map(([code, t]) => ({
  code,
  name: t.name,
  flag: t.flag,
}));

export default function LanguageSwitcher({ currentLang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = translations[currentLang];

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        className="lang-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        id="lang-switcher-btn"
      >
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-name">{current.name}</span>
        <svg
          className={`lang-chevron ${open ? "open" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="lang-dropdown" role="listbox" aria-labelledby="lang-switcher-btn">
          {LANGS.map(({ code, name, flag }) => (
            <li
              key={code}
              role="option"
              aria-selected={code === currentLang}
              className={`lang-option ${code === currentLang ? "active" : ""}`}
              onClick={() => {
                onChange(code);
                setOpen(false);
              }}
            >
              <span className="lang-flag">{flag}</span>
              <span>{name}</span>
              {code === currentLang && (
                <svg
                  className="lang-check"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
