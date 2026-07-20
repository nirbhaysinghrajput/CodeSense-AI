# CodeSense AI 🤖

**An AI-assisted code understanding and improvement platform built with Flask + Google Gemini.**

CodeSense AI helps developers analyze, understand, debug, optimize, and document code through an interactive AI-powered workflow.

---

## 🎯 Problem

Developers often spend significant time:

- Understanding unfamiliar code
- Identifying bugs and edge cases
- Improving code quality
- Writing technical documentation
- Learning from existing implementations

While AI tools can provide assistance, developers need a structured experience that helps them move from **code → understanding → improvement**.

---

## 💡 Product Goal

CodeSense AI explores how AI can support developers throughout the coding lifecycle by providing:

- Faster code understanding
- Better debugging assistance
- Quality improvement suggestions
- Automated documentation support

The goal is to reduce development friction and help developers make better technical decisions.

---

# ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Code Review** | Analyzes code quality, identifies issues, reviews complexity, and provides improvement suggestions |
| 📖 **Code Explanation** | Breaks down code step-by-step to help developers understand logic and concepts |
| 🐛 **Bug Detection** | Identifies logical errors, runtime issues, security concerns, and edge cases |
| ⚡ **Optimization Suggestions** | Provides performance improvement ideas with better implementation approaches |
| 📄 **Documentation Generation** | Creates documentation support including explanations, docstrings, and README sections |

---

# 👥 Target Users

| User | Problem Solved |
|------|----------------|
| 👨‍🎓 Students & Beginners | Helps understand unfamiliar code and improve programming skills |
| 👨‍💻 Developers | Reduces time spent on debugging, review, and documentation |
| 🚀 Learners | Provides explanations and feedback to improve technical understanding |

---

# 🧠 Product Thinking

While designing CodeSense AI, the focus was on:

| Product Area | Approach |
|--------------|----------|
| User Problem | Identified common developer workflow challenges |
| User Experience | Designed a simple flow from code input to actionable feedback |
| Feature Prioritization | Focused on high-value developer assistance features |
| AI Integration | Used AI as an assistant to improve developer productivity |

### User Flow

```
Code Input
     ↓
Select Analysis Type
     ↓
AI Processing
     ↓
Actionable Feedback
     ↓
Developer Improvement
```

---

# 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Backend | Python, Flask, Flask-CORS |
| AI Model | Google Gemini 1.5 Flash |
| Frontend | HTML, CSS, JavaScript |
| Styling | Dark Glassmorphism UI |
| Fonts | Inter, JetBrains Mono |

---

# 🚀 Quick Start

## 1. Clone / Navigate to Project

```bash
cd CodeSense-AI
```

## 2. Install Dependencies

```bash
pip install -r requirements.txt
```

## 3. Configure Gemini API

Create an API key from Google AI Studio:

https://aistudio.google.com/apikey

Add it to `.env`:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

---

## 4. Run Application

```bash
python app.py
```

Open:

```
http://127.0.0.1:5000
```

---

# 📁 Project Structure

```
CodeSense-AI/
│
├── app.py                 ← Flask backend + Gemini integration
├── requirements.txt       ← Python dependencies
├── .env                   ← API configuration
├── README.md
│
├── templates/
│     └── index.html       ← User interface
│
└── static/
      ├── style.css        ← UI styling
      └── app.js           ← Frontend logic
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serves application interface |
| GET | `/api/status` | Checks Gemini API availability |
| POST | `/api/analyze` | Processes code analysis requests |

---

## POST `/api/analyze`

### Request

```json
{
  "code": "def hello(): print('Hi')",
  "language": "python",
  "action": "review"
}
```

### Supported Actions

| Action | Purpose |
|--------|---------|
| review | Analyze code quality |
| explain | Explain implementation |
| debug | Find possible issues |
| optimize | Suggest improvements |
| document | Generate documentation |

---

# 📊 Impact & Learning

Through building CodeSense AI, I explored:

- Designing AI-powered user workflows
- Applying LLM capabilities to real developer problems
- Balancing user experience with technical feasibility
- Building practical AI applications

---

# 📝 Resume Description

> **CodeSense AI – LLM-Based Code Review Assistant**  
> Built an AI-powered developer productivity tool using Flask and Google Gemini API that analyzes code quality, detects bugs, explains implementations, suggests optimizations, and generates documentation. Designed an interactive workflow focused on improving developer understanding and reducing debugging effort.

---

# ⚠️ Notes

- Gemini API free tier is used for AI processing
- Never commit `.env` files containing API keys
- Application runs locally
- No user code is permanently stored

---

*Built with ❤️ using Flask + Google Gemini*
