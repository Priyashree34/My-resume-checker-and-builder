🚀 AI Resume Analyzer & Smart Resume Builder

An AI-powered web application that analyzes resumes and generates highly optimized ATS-friendly resumes by aligning user data with specific job descriptions.

## 🚀 Features
🔍 Resume Analysis – Upload your resume and get detailed insights
📊 ATS Score Calculation – Check how well your resume matches a job description
🧠 Keyword Optimization – Identifies missing and important keywords
✨ Smart Resume Builder – Generate ATS-friendly resumes
📈 Detailed Feedback – Section-wise improvement suggestions
⚡ Fast & Interactive UI

### 📊 ATS Resume Checker
- Paste your resume + job description and get an instant ATS match score
- Real TF-IDF + cosine similarity NLP (not just keyword counting)
- Identifies missing keywords the employer is looking for
- Flags weak bullet points and suggests improvements
- Deep analysis powered by Groq AI (Llama 3.3 70B)

### 🛠️ AI Resume Builder
- Fill in your details once — AI writes everything else
- Generates a complete, ATS-optimized resume from scratch
- Automatically injects job description keywords into your resume
- Enhances bullet points to sound professional and results-driven
- Outputs a clean, formatted PDF downloaded directly to your device

### ⬇️ PDF Download
- One-click download — saves directly to your Downloads folder
- Properly formatted A4 PDF — no blank pages, no clipping
- Resume looks exactly as it appears on screen

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| AI Engine | [Groq API](https://console.groq.com) — Llama 3.3 70B |
| NLP | Custom TF-IDF + Cosine Similarity (`nlp.js`) |
| PDF Export | html2pdf.js (via CDN) |
| State | localStorage (no backend needed) |

---

## 📁 Project Structure

```
resumeai/
├── index.html        # Main app — all pages (Home, Checker, Builder)
├── css/
│   └── styles.css    # Full UI styling
└── js/
    ├── app.js        # Core app logic, UI rendering, PDF download
    ├── ai.js         # Groq API calls & prompt engineering
    ├── nlp.js        # TF-IDF + cosine similarity NLP engine
    └── state.js      # Centralized state + localStorage key management
```

---

## ⚡ Getting Started

### 1. Clone the repo
bash
git clone https://github.com/Priyashree34/My-resume-checker-and-builder.git

cd My-resume-checker-and-builder

### 2. Open in browser
No build step needed — just open `index.html` directly:
bash
# Option A: Open directly
open index.html

# Option B: Serve locally (recommended)
npx serve .
# or
python -m http.server 8080

### 3. Get a free Groq API key
1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up — **no credit card required**
3. Create an API key (starts with `gsk_`)
4. Paste it into the key bar at the top of the app

> 🔒 Your key is saved in `localStorage` — you only need to paste it once per browser/device.

---

## 🌐 Deployment

you can see the website here - https://myatsfriendlyresumecheckerandbuilder.netlify.app/

> ⚠️ **Note:** Users will need to enter their own free Groq API key after opening the deployed app. The key is stored locally in their browser and never leaves their device.

---

## 🔑 Why do users need a Groq API key?

ResumeAI has **no backend server** — AI calls go directly from the browser to Groq's API. This means:

- ✅ Zero server costs for you
- ✅ User data never touches your servers
- ✅ Groq is **free** with generous rate limits
- ⚠️ Each user needs their own key (takes 30 seconds to get)



