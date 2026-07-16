# CV Anonymizer

Hide email, phone, LinkedIn, websites, **CNIC**, and **license / passport** numbers on uploaded CVs. Serve an anonymous preview until payment, then unlock the original.

## Structure

```
cv-anonymizer/
├── server.js
├── package.json
├── routes/cv.routes.js
├── controllers/cv.controller.js
├── services/detectPII.js
├── services/pythonClient.js
├── uploads/original/
├── uploads/anonymous/
└── python/app.py
```

## Setup

### 1. Python service

**Windows (use `py`, not `python`)** — the plain `python` command often opens the Microsoft Store stub.

```powershell
cd python
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Or double-click / run:

```powershell
cd python
.\start.bat
```

Runs on `http://127.0.0.1:5001`

**If `python` says "Python was not found":**
1. Use `py` or `.venv\Scripts\python.exe` instead (recommended).
2. Or disable the alias: **Settings → Apps → Advanced app settings → App execution aliases** → turn off **python.exe** and **python3.exe**.
3. Or reinstall Python from [python.org](https://www.python.org/downloads/) and check **"Add python.exe to PATH"**.

**For scanned PDFs / image CVs (OCR):** Tesseract OCR must be installed.

```powershell
# Already installed at: C:\Program Files\Tesseract-OCR\tesseract.exe
tesseract --version
```

If missing, install from [UB Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki) (Windows installer), then **restart the Python service**.

```powershell
cd python
.\start.bat
```

Check OCR is ready:

```
GET http://127.0.0.1:5001/health
→ { "ok": true, "tesseractInstalled": true }
```

### 2. Node API

```bash
cd ..
npm install
npm start
```

Runs on `http://localhost:4000`

### Postman

Import `CV-Anonymizer.postman_collection.json` into Postman.

1. Run **Upload CV** and pick a PDF, Word (`.docx`), or image (form field: `cv`)
2. `cvId` is saved automatically for the other requests
3. Test unlock → download original flow

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cv/upload` | Upload CV (`multipart` field: `cv`) → anonymous preview URL |
| `GET` | `/api/cv/:id` | Status + preview URL (PII hidden until unlock) |
| `GET` | `/api/cv/:id/download` | Anonymous PDF if unpaid, original if paid |
| `POST` | `/api/cv/:id/unlock` | Mark paid (call from payment webhook) |

### Upload example

```bash
curl -F "cv=@resume.pdf" http://localhost:4000/api/cv/upload
curl -F "cv=@resume.docx" http://localhost:4000/api/cv/upload
```

### Unlock after payment

```bash
curl -X POST http://localhost:4000/api/cv/<id>/unlock ^
  -H "Content-Type: application/json" ^
  -d "{\"paymentId\":\"pay_123\"}"
```

## PDF types

| Upload type | What happens |
|-------------|----------------|
| **Text PDF** | Node reads text → detects email/phone → Python redacts by position |
| **Word (.docx / .doc)** | Converted to PDF → same redaction as PDF. Prefer LibreOffice or MS Word for best layout |
| **Scanned PDF** (photo of CV) | No text layer → Python uses **OCR** → finds contact info on image → redacts boxes |
| **Image** (PNG/JPG) | Converted to PDF → same OCR path as scanned PDF |
| **CNIC / license photo inside CV** | Each embedded image is OCR’d → if it looks like an ID card, the **whole image** is covered with `[ID hidden]` |

If Tesseract is not installed, scanned/image PDFs upload successfully but **contact info may stay visible**. Check upload response `warning` field.

**Word tip:** Install [LibreOffice](https://www.libreoffice.org/) for high-quality `.docx` → PDF conversion. Without it, a basic text PDF fallback is used (layout may change).

## Flow

1. Client uploads CV  
2. Node extracts text + detects PII  
3. Python redacts matches (boxes + link removal) → `uploads/anonymous/`  
4. Frontend shows preview URL only  
5. After payment → `POST /unlock` → download returns original  

## Notes

- Original PDFs are **not** publicly static; only anonymous files are under `/files/anonymous/`.
- `cvStore` is in-memory — swap for Mongo/Postgres in production.
- Wire `unlockCv` to Stripe / your payment webhook in production.
- Scanned PDFs need **Tesseract OCR** installed on the server.
