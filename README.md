# CodeSense AI 🤖

**An LLM-powered code review assistant built with Flask + Google Gemini.**

Paste any code → choose an analysis type → get instant AI-powered feedback.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Code Review** | Full review with quality score, bugs, complexity & optimized code |
| 📖 **Code Explanation** | Step-by-step breakdown with key concepts |
| 🐛 **Bug Detection** | Identifies logical, runtime, security & edge-case bugs |
| ⚡ **Optimization** | Performance improvements with before/after comparisons |
| 📄 **Documentation** | Auto-generates docstrings, README sections & API docs |

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Flask-CORS
- **AI Model:** Google Gemini 1.5 Flash
- **Frontend:** Vanilla HTML + CSS + JavaScript
- **Fonts:** Inter, JetBrains Mono

---

## 🚀 Quick Start

### 1. Clone / navigate to the project
```bash
cd CodeSense-AI
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Get a Gemini API Key
- Go to [Google AI Studio](https://aistudio.google.com/apikey)
- Create a free API key

### 4. Configure the `.env` file
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Run the server
```bash
python app.py
```

### 6. Open in browser
```
http://127.0.0.1:5000
```

---

## 📁 Project Structure

```
CodeSense-AI/
│
├── app.py              ← Flask backend + Gemini integration
├── requirements.txt    ← Python dependencies
├── .env                ← API key (never commit this!)
├── README.md
│
├── templates/
│     └── index.html    ← Main UI template
│
└── static/
      ├── style.css     ← Dark glassmorphism theme
      └── app.js        ← Frontend logic & result rendering
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serves the main UI |
| GET | `/api/status` | Check if Gemini API is connected |
| POST | `/api/analyze` | Run AI analysis |

### POST `/api/analyze`
**Request body:**
```json
{
  "code": "def hello(): print('Hi')",
  "language": "python",
  "action": "review"
}
```
**Actions:** `review`, `explain`, `debug`, `optimize`, `document`

---

## 📝 Resume Description

> **CodeSense AI – LLM-Based Code Review Assistant**  
> Built a full-stack AI-powered code review tool using Python/Flask and Google Gemini API. The system accepts code snippets, performs structured prompt engineering to extract bugs, complexity analysis, optimization suggestions, and auto-documentation, and renders results in a polished dark-mode web UI. Supports 16+ programming languages and 5 distinct analysis modes.

---

## ⚠️ Notes

- Gemini API free tier: ~60 requests/minute — plenty for personal use
- Never commit your `.env` file to Git — add it to `.gitignore`
- The app runs locally; no data is stored

---

*Built with ❤️ using Flask + Google Gemini*
