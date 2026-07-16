"use client";

import { useState, useEffect, useRef } from "react";
import translations from "@/lib/translations";
import LanguageSwitcher from "@/frontend/LanguageSwitcher";
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Download,
  CreditCard,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  CreditCard as CnicIcon,
  Award,
  Eye,
  FileCheck,
  Zap,
  Layers,
  Briefcase,
  Calendar,
  User,
  MapPin
} from "lucide-react";

// Brand icon LinkedIn has been removed in newer lucide-react versions, so we use custom inline SVG
const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={props.size || 24}
    height={props.size || 24}
    className={props.className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Brand icon GitHub has also been removed in newer lucide-react versions
const Github = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={props.size || 24}
    height={props.size || 24}
    className={props.className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function Home() {
  const [lang, setLang] = useState("en");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFields, setSelectedFields] = useState([
    "emails", "phones", "linkedin", "github", "websites", "cnic", "licenses", "names", "companies", "locations"
  ]);
  const [isEditing, setIsEditing] = useState(false);
  const [manualBoxes, setManualBoxes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingStart, setDrawingStart] = useState({ x: 0, y: 0 });
  const [activeBox, setActiveBox] = useState(null);
  const [savingCoords, setSavingCoords] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  const fileInputRef = useRef(null);

  // Language helpers
  const t = translations[lang];
  const handleLangChange = (code) => {
    setLang(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("cv-lang", code);
      document.documentElement.lang = code;
      document.documentElement.dir = translations[code].dir;
    }
  };

  // Restore saved language on mount
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("cv-lang");
    if (saved && translations[saved]) handleLangChange(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check API health status on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            setApiOnline(true);
            return;
          }
        }
        setApiOnline(false);
      } catch (err) {
        setApiOnline(false);
      }
    };
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndProcessFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (selectedFile) => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (selectedFile.size > maxSize) {
      setError("File is too large. Maximum size allowed is 15MB.");
      return;
    }

    const allowedExtensions = [
      ".pdf", ".png", ".jpg", ".jpeg", ".jfif", ".webp", ".bmp", ".tif", ".tiff", ".doc", ".docx"
    ];
    const fileName = selectedFile.name || "";
    const fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      setError("Unsupported file format. Please upload PDF, Word (.doc/.docx), or an image (PNG/JPG/WEBP).");
      return;
    }

    setError(null);
    setFile(selectedFile);
    uploadCv(selectedFile);
  };

  const uploadCv = async (selectedFile) => {
    setUploading(true);
    setProgress(15);

    const formData = new FormData();
    formData.append("cv", selectedFile);
    formData.append("redactFields", JSON.stringify(selectedFields));

    // Fake upload progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.detail || "Upload failed");
      }

      const data = await response.json();
      setProgress(100);

      setTimeout(() => {
        setCvData(data);
        setUploading(false);
      }, 600);

    } catch (err) {
      setError(err.message || "Failed to anonymize CV. Verify backend is running.");
      setUploading(false);
      setFile(null);
    }
  };

  const handleUnlock = async () => {
    if (!cvData?.id) return;
    setUnlocking(true);
    setError(null);
    try {
      const response = await fetch(`/api/cv/${cvData.id}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: `pay_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Unlock failed");
      }

      const data = await response.json();
      setCvData((prev) => ({
        ...prev,
        paid: true,
        detected: data.detected,
      }));
    } catch (err) {
      setError(err.message || "Failed to unlock CV.");
    } finally {
      setUnlocking(false);
    }
  };

  const startDrawing = (e, pageMeta) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setIsDrawing(true);
    setDrawingStart({ x: startX, y: startY });
    setActiveBox({
      page: pageMeta.page,
      left: (startX / rect.width) * 100,
      top: (startY / rect.height) * 100,
      width: 0,
      height: 0,
      startX,
      startY
    });
  };

  const draw = (e, pageMeta) => {
    if (!isDrawing || !activeBox) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const startX = drawingStart.x;
    const startY = drawingStart.y;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    setActiveBox({
      page: pageMeta.page,
      left: (left / rect.width) * 100,
      top: (top / rect.height) * 100,
      width: (width / rect.width) * 100,
      height: (height / rect.height) * 100,
      startX,
      startY,
      currentX,
      currentY
    });
  };

  const endDrawing = (e) => {
    if (!isDrawing || !activeBox) return;
    setIsDrawing(false);

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();

    const startX = activeBox.startX;
    const startY = activeBox.startY;
    const currentX = activeBox.currentX !== undefined ? activeBox.currentX : startX;
    const currentY = activeBox.currentY !== undefined ? activeBox.currentY : startY;

    const leftPx = Math.min(startX, currentX);
    const topPx = Math.min(startY, currentY);
    const widthPx = Math.abs(currentX - startX);
    const heightPx = Math.abs(currentY - startY);

    if (widthPx < 5 || heightPx < 5) {
      setActiveBox(null);
      return;
    }

    const pageMeta = cvData.pages.find((p) => p.page === activeBox.page);
    if (!pageMeta) {
      setActiveBox(null);
      return;
    }

    const x0 = (leftPx / rect.width) * pageMeta.width;
    const y0 = (topPx / rect.height) * pageMeta.height;
    const x1 = ((leftPx + widthPx) / rect.width) * pageMeta.width;
    const y1 = ((topPx + heightPx) / rect.height) * pageMeta.height;

    const newBox = {
      page: activeBox.page,
      x0,
      y0,
      x1,
      y1
    };

    setManualBoxes((prev) => [...prev, newBox]);
    setActiveBox(null);
  };

  const deleteBox = (boxToDelete) => {
    setManualBoxes((prev) =>
      prev.filter(
        (box) =>
          !(
            box.page === boxToDelete.page &&
            box.x0 === boxToDelete.x0 &&
            box.y0 === boxToDelete.y0
          )
      )
    );
  };

  const applyManualRedactions = async () => {
    setSavingCoords(true);
    setError(null);
    try {
      const response = await fetch(`/api/cv/${cvData.id}/redact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coords: manualBoxes })
      });

      if (!response.ok) {
        throw new Error("Failed to save manual redactions");
      }

      const data = await response.json();
      setImageTimestamp(Date.now());

      if (data.pages) {
        setCvData((prev) => ({
          ...prev,
          pages: data.pages
        }));
      }

      alert("Manual redactions successfully applied to CV!");
      setIsEditing(false);

    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred applying redactions");
    } finally {
      setSavingCoords(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setCvData(null);
    setError(null);
    setProgress(0);
    setIsEditing(false);
    setManualBoxes([]);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Convert raw bytes to readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Format absolute preview url to relative path
  const getRelativeUrl = (urlStr) => {
    if (!urlStr) return "";
    try {
      return new URL(urlStr).pathname;
    } catch (e) {
      return urlStr;
    }
  };

  // Helper to count active PII categories
  const getPiiCount = () => {
    if (!cvData?.detected) return 0;
    const d = cvData.detected;
    return (d.emails?.length || 0) +
      (d.phones?.length || 0) +
      (d.linkedin?.length || 0) +
      (d.github?.length || 0) +
      (d.websites?.length || 0) +
      (d.cnic?.length || 0) +
      (d.licenses?.length || 0);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <ShieldAlert className="logo-icon" size={28} />
          <span>{t.siteTitle}</span>
        </div>
        <div className="header-right">
          <div className="api-status">
            <div className={`status-dot ${apiOnline ? "online" : ""}`}></div>
            {apiOnline ? t.backendLive : t.backendOffline}
          </div>
          <LanguageSwitcher currentLang={lang} onChange={handleLangChange} />
        </div>
      </header>

      {/* Hero Header */}
      {!cvData && !uploading && (
        <section className="hero">
          <h1>
            {t.heroTitle} <span>{t.heroHighlight}</span>
          </h1>
          <p>{t.heroDesc}</p>
        </section>
      )}

      {/* Main Card Content */}
      <main className="main-card" style={{ marginTop: cvData || uploading ? "2rem" : "0" }}>

        {/* Error Alert */}
        {error && (
          <div className="alert-box error">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Warning Alert if Tesseract or other issues */}
        {cvData?.warning && (
          <div className="alert-box warning">
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Service Warning:</strong> {cvData.warning}
            </div>
          </div>
        )}

        {/* Initial Upload State */}
        {!cvData && !uploading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Customize Redaction Options */}
            <div className="redact-selectors-container">
              <h3 className="selectors-title">{t.customizeTitle}</h3>
              <div className="selectors-grid">
                {[
                  { id: "emails", label: t.emails },
                  { id: "phones", label: t.phones },
                  { id: "linkedin", label: t.linkedin },
                  { id: "github", label: t.github },
                  { id: "websites", label: t.websites },
                  { id: "cnic", label: t.cnic },
                  { id: "licenses", label: t.licenses },
                  { id: "names", label: t.names },
                  { id: "companies", label: t.companies },
                  { id: "locations", label: t.locations },
                ].map((field) => (
                  <label key={field.id} className="selector-item">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => {
                        setSelectedFields((prev) =>
                          prev.includes(field.id)
                            ? prev.filter((id) => id !== field.id)
                            : [...prev, field.id]
                        );
                      }}
                      className="selector-checkbox"
                    />
                    <span className="selector-label">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div
              className={`dropzone ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="file-input"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.jfif,.webp,.bmp,.tif,.tiff,.doc,.docx"
              />

              <div className="dropzone-icon-container">
                <UploadCloud size={44} />
              </div>

              <div className="dropzone-text">
                <h3>{t.dropTitle}</h3>
                <p>{t.dropDesc}</p>
              </div>

              <button
                type="button"
                className="select-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
              >
                {t.selectFileBtn}
              </button>
            </div>
          </div>
        )}

        {/* Uploading & Redacting Progress State */}
        {uploading && (
          <div className="uploading-container">
            <div className="spinner"></div>
            <div className="uploading-title">{t.uploadingTitle}</div>
            <div className="uploading-subtitle">{t.uploadingSubtitle}</div>
            <div className="progress-bar-bg">
              <div
                className={`progress-bar-fill ${progress === 90 ? "animated" : ""}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Success / Redacted Dashboard State */}
        {cvData && (
          <div className="dashboard-grid">

            {/* Left Info Panel */}
            <div className="info-panel">

              <div className="file-header-info">
                <div className="file-icon-bg">
                  <FileText size={26} />
                </div>
                <div className="file-details">
                  <h2>{file?.name || t.uploadedCV}</h2>
                  <span>
                    {t.fileSize}: {file ? formatBytes(file.size) : t.unknown} | {t.fileFormat}: {cvData.kind?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Candidate Summary Card */}
              {cvData.summary && (
                <div className="candidate-summary-card">
                  <h3 className="summary-card-title">{t.summaryTitle}</h3>

                  <div className="summary-details">
                    <div className="summary-row">
                      <Briefcase size={18} className="summary-icon" />
                      <div className="summary-item">
                        <label>{t.latestTitle}</label>
                        <span>{cvData.summary.latestTitle}</span>
                      </div>
                    </div>

                    <div className="summary-row">
                      <Calendar size={18} className="summary-icon" />
                      <div className="summary-item">
                        <label>{t.estExperience}</label>
                        <span>{cvData.summary.yearsOfExperience > 0 ? `${cvData.summary.yearsOfExperience} ${t.yearsExp}` : t.notFound}</span>
                      </div>
                    </div>
                  </div>

                  {cvData.summary.skills && cvData.summary.skills.length > 0 && (
                    <div className="summary-skills-section">
                      <label className="skills-section-label">{t.matchedSkills}</label>
                      <div className="summary-skills-grid">
                        {cvData.summary.skills.map((skill, idx) => (
                          <span key={idx} className="skill-pill">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-item">
                  <Zap className="stat-icon" size={20} />
                  <div className="stat-content">
                    <label>{t.redactionStatus}</label>
                    <span style={{ color: cvData.paid ? "var(--color-success)" : "var(--color-warning)" }}>
                      {cvData.paid ? t.statusUnlocked : t.statusMasked}
                    </span>
                  </div>
                </div>

                <div className="stat-item">
                  <FileCheck className="stat-icon" size={20} />
                  <div className="stat-content">
                    <label>{t.ocrMethod}</label>
                    <span>{cvData.ocrUsed ? t.ocrScanned : t.textLayer}</span>
                  </div>
                </div>

                {cvData.scannedPages > 0 && (
                  <div className="stat-item">
                    <Layers className="stat-icon" size={20} />
                    <div className="stat-content">
                      <label>{t.scannedPages}</label>
                      <span>{cvData.scannedPages}</span>
                    </div>
                  </div>
                )}

                {cvData.idImagesHidden > 0 && (
                  <div className="stat-item">
                    <ShieldAlert className="stat-icon" style={{ color: "var(--color-danger)" }} size={20} />
                    <div className="stat-content">
                      <label>{t.idCardsHidden}</label>
                      <span>{cvData.idImagesHidden} {t.cards}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Detected PII List */}
              <div>
                <h3 className="pii-section-title">
                  {t.summaryMasked} ({getPiiCount()} {t.itemsMasked})
                </h3>

                <div className="pii-list">

                  {/* Email row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Mail size={18} className="pii-label-icon" />
                      {t.emails}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.emails?.length > 0 ? (
                        cvData.detected.emails.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* Phone row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Phone size={18} className="pii-label-icon" />
                      {t.phones}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.phones?.length > 0 ? (
                        cvData.detected.phones.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* LinkedIn row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Linkedin size={18} className="pii-label-icon" />
                      {t.linkedin}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.linkedin?.length > 0 ? (
                        cvData.detected.linkedin.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* GitHub row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Github size={18} className="pii-label-icon" />
                      {t.github}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.github?.length > 0 ? (
                        cvData.detected.github.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* Websites row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Globe size={18} className="pii-label-icon" />
                      {t.websites}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.websites?.length > 0 ? (
                        cvData.detected.websites.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* CNIC row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <CnicIcon size={18} className="pii-label-icon" />
                      {t.cnic}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.cnic?.length > 0 ? (
                        cvData.detected.cnic.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* License row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Award size={18} className="pii-label-icon" />
                      {t.licenses}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.licenses?.length > 0 ? (
                        cvData.detected.licenses.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* Names row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <User size={18} className="pii-label-icon" />
                      {t.names}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.names?.length > 0 ? (
                        cvData.detected.names.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* Companies row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <Briefcase size={18} className="pii-label-icon" />
                      {t.companies}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.companies?.length > 0 ? (
                        cvData.detected.companies.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                  {/* Locations row */}
                  <div className="pii-row">
                    <div className="pii-label">
                      <MapPin size={18} className="pii-label-icon" />
                      {t.locations}
                    </div>
                    <div className="pii-values">
                      {cvData.detected?.locations?.length > 0 ? (
                        cvData.detected.locations.map((val, idx) => (
                          <span key={idx} className={`pii-badge ${cvData.paid ? "unlocked" : "redacted"}`}>{val}</span>
                        ))
                      ) : (
                        <span className="pii-badge none">{t.noneFound}</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Actions Section */}
              <div className="actions-section">

                {/* Download and Unlock controls */}
                <div className="btn-group-row">
                  <a href={`/api/cv/${cvData.id}/download`} download style={{ textDecoration: "none" }}>
                    <button type="button" className="action-btn secondary" style={{ width: "100%" }}>
                      <Download size={18} />
                      {t.downloadMasked}
                    </button>
                  </a>

                  {!cvData.paid ? (
                    <button type="button" className="action-btn primary" onClick={handleUnlock} disabled={unlocking}>
                      {unlocking ? <RefreshCw size={18} className="spinner-icon animate-spin" /> : <CreditCard size={18} />}
                      {unlocking ? t.unlockingBtn : t.unlockBtn}
                    </button>
                  ) : (
                    <a href={`/api/cv/${cvData.id}/download`} download style={{ textDecoration: "none" }}>
                      <button type="button" className="action-btn success" style={{ width: "100%" }}>
                        <CheckCircle size={18} />
                        {t.downloadOriginal}
                      </button>
                    </a>
                  )}
                </div>

                {!cvData.paid && (
                  <button
                    type="button"
                    className={`action-btn ${isEditing ? 'primary' : 'secondary'}`}
                    style={{ width: "100%", marginBottom: "0.5rem" }}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Eye size={18} />
                    {isEditing ? t.viewPreview : t.editRedactions}
                  </button>
                )}

                <button type="button" className="action-btn secondary" onClick={resetState}>
                  <RefreshCw size={18} />
                  {t.uploadAnother}
                </button>

              </div>

            </div>

            {/* Right Document Preview Panel */}
            <div className="preview-panel">
              <div className="preview-header">
                <div className="preview-title">
                  <Eye size={18} />
                  {t.docPreview}
                </div>
                <div className={`preview-badge ${cvData.paid ? "original" : "redacted"}`}>
                  {cvData.paid ? t.originalCV : t.redactedPreview}
                </div>
              </div>

              <div className="preview-body" style={{ overflowY: "auto", display: "block" }}>
                {isEditing ? (
                  <div className="manual-redact-editor" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

                    <div className="editor-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                      <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                        {t.dragInstruction}
                      </span>
                      <button
                        type="button"
                        className="action-btn primary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                        onClick={applyManualRedactions}
                        disabled={savingCoords}
                      >
                        {savingCoords ? t.saving : t.applyRedactions}
                      </button>
                    </div>

                    {cvData.pages && cvData.pages.length > 0 ? (
                      cvData.pages.map((pageMeta) => (
                        <div
                          key={pageMeta.page}
                          className="page-image-container"
                          style={{
                            position: "relative",
                            margin: "0 auto",
                            width: "100%",
                            maxWidth: "500px",
                            aspectRatio: `${pageMeta.width} / ${pageMeta.height}`,
                            border: "1px solid var(--color-border)",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                            cursor: "crosshair",
                            userSelect: "none"
                          }}
                          onMouseDown={(e) => startDrawing(e, pageMeta)}
                          onMouseMove={(e) => draw(e, pageMeta)}
                          onMouseUp={endDrawing}
                          onMouseLeave={endDrawing}
                        >
                          {/* Page Image */}
                          <img
                            src={`/files/anonymous/${cvData.id}_page_${pageMeta.page}.png?t=${imageTimestamp}`}
                            alt={`Page ${pageMeta.page + 1}`}
                            style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
                          />

                          {/* Existing drawn boxes for this page */}
                          {manualBoxes
                            .filter((box) => box.page === pageMeta.page)
                            .map((box, index) => {
                              const leftPercent = (box.x0 / pageMeta.width) * 100;
                              const topPercent = (box.y0 / pageMeta.height) * 100;
                              const widthPercent = ((box.x1 - box.x0) / pageMeta.width) * 100;
                              const heightPercent = ((box.y1 - box.y0) / pageMeta.height) * 100;

                              return (
                                <div
                                  key={index}
                                  style={{
                                    position: "absolute",
                                    left: `${leftPercent}%`,
                                    top: `${topPercent}%`,
                                    width: `${widthPercent}%`,
                                    height: `${heightPercent}%`,
                                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                                    border: "1px solid var(--color-danger)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "default"
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => deleteBox(box)}
                                    style={{
                                      background: "var(--color-danger)",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "50%",
                                      width: "20px",
                                      height: "20px",
                                      fontSize: "12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      boxShadow: "0 2px 5px rgba(0,0,0,0.5)"
                                    }}
                                    title="Delete redaction"
                                  >
                                    &times;
                                  </button>
                                </div>
                              );
                            })}

                          {/* Active box being drawn */}
                          {activeBox && activeBox.page === pageMeta.page && (
                            <div
                              style={{
                                position: "absolute",
                                left: `${activeBox.left}%`,
                                top: `${activeBox.top}%`,
                                width: `${activeBox.width}%`,
                                height: `${activeBox.height}%`,
                                backgroundColor: "rgba(56, 189, 248, 0.4)",
                                border: "1px dashed var(--color-primary)"
                              }}
                            />
                          )}

                          {/* Page Label */}
                          <div style={{
                            position: "absolute",
                            bottom: "10px",
                            right: "10px",
                            background: "rgba(0,0,0,0.6)",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.8rem",
                            pointerEvents: "none"
                          }}>
                            Page {pageMeta.page + 1}
                          </div>

                        </div>
                      ))
                    ) : (
                      <div className="no-preview">
                        <p>Loading editor pages...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  cvData.previewUrl ? (
                    <iframe
                      src={getRelativeUrl(cvData.previewUrl)}
                      className="iframe-preview"
                      title="Anonymized CV preview"
                    />
                  ) : (
                    <div className="no-preview">
                      <FileText size={48} />
                      <p>No preview file generated.</p>
                    </div>
                  )
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          {t.footerPowered}{" "}
          <a href="https://github.com/zohaibalishah" target="_blank" rel="noopener noreferrer">
            zohaibalishah
          </a>
        </p>
      </footer>
    </div>
  );
}
