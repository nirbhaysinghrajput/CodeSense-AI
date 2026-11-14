import os
import json
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    client = genai.Client(api_key=GEMINI_API_KEY)
    AI_READY = True
else:
    AI_READY = False
    client = None


# ─────────────────────────── Prompt Templates ────────────────────────────────

PROMPTS = {
    "review": """You are an elite software engineer and code reviewer with 20+ years of experience.

Perform a thorough code review of the following {language} code.

Return your response in **valid JSON only** with this exact structure:
{{
  "summary": "One-sentence overall summary",
  "score": <integer 0-100 representing code quality>,
  "bugs": [
    {{"severity": "HIGH|MEDIUM|LOW", "line": "<line or range>", "description": "<issue description>", "fix": "<suggested fix>"}}
  ],
  "complexity": {{
    "time": "<Big-O notation>",
    "space": "<Big-O notation>",
    "explanation": "<brief explanation>"
  }},
  "improvements": [
    {{"title": "<improvement title>", "description": "<detailed description>", "example": "<code example if applicable>"}}
  ],
  "quality": {{
    "naming": "<assessment>",
    "readability": "<assessment>",
    "structure": "<assessment>",
    "best_practices": "<assessment>"
  }},
  "optimized_code": "<complete optimized version of the code>",
  "verdict": "EXCELLENT|GOOD|NEEDS_IMPROVEMENT|POOR"
}}

Code to review:
```{language}
{code}
```

Respond with ONLY the JSON object. No markdown, no explanation outside the JSON.""",

    "explain": """You are a patient, expert programming teacher who explains code beautifully.

Explain the following {language} code to someone learning programming.

Return your response in **valid JSON only** with this exact structure:
{{
  "summary": "One-line summary of what this code does",
  "purpose": "Detailed explanation of the purpose",
  "how_it_works": [
    {{"step": <number>, "description": "<what happens at this step>"}}
  ],
  "key_concepts": [
    {{"concept": "<concept name>", "explanation": "<what it means>"}}
  ],
  "real_world_use": "<Real-world use case or analogy>",
  "complexity": {{
    "time": "<Big-O>",
    "space": "<Big-O>"
  }},
  "beginner_tips": ["<tip 1>", "<tip 2>"]
}}

Code to explain:
```{language}
{code}
```

Respond with ONLY the JSON object. No markdown, no explanation outside the JSON.""",

    "debug": """You are a master debugger and software detective.

Find ALL bugs, logical errors, edge cases, and problems in this {language} code.

Return your response in **valid JSON only** with this exact structure:
{{
  "has_bugs": true|false,
  "bug_count": <integer>,
  "bugs": [
    {{
      "id": <number>,
      "type": "LOGICAL|SYNTAX|RUNTIME|EDGE_CASE|SECURITY|PERFORMANCE",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "location": "<line number or function name>",
      "description": "<detailed description of the bug>",
      "impact": "<what goes wrong because of this bug>",
      "fix": "<exact fix with code example>",
      "fixed_code": "<the corrected line/block>"
    }}
  ],
  "edge_cases": ["<edge case 1>", "<edge case 2>"],
  "overall_assessment": "<overall code health assessment>",
  "corrected_code": "<complete corrected version of the code>"
}}

Code to debug:
```{language}
{code}
```

Respond with ONLY the JSON object. No markdown, no explanation outside the JSON.""",

    "optimize": """You are a performance engineer and optimization expert.

Analyze and optimize this {language} code for maximum performance, readability, and best practices.

Return your response in **valid JSON only** with this exact structure:
{{
  "current_performance": {{
    "time_complexity": "<Big-O>",
    "space_complexity": "<Big-O>",
    "bottlenecks": ["<bottleneck 1>", "<bottleneck 2>"]
  }},
  "optimizations": [
    {{
      "title": "<optimization name>",
      "category": "TIME|SPACE|READABILITY|BEST_PRACTICE",
      "impact": "HIGH|MEDIUM|LOW",
      "before": "<problematic code snippet>",
      "after": "<optimized code snippet>",
      "explanation": "<why this is better>"
    }}
  ],
  "optimized_performance": {{
    "time_complexity": "<improved Big-O>",
    "space_complexity": "<improved Big-O>",
    "improvement": "<% or description of improvement>"
  }},
  "optimized_code": "<complete optimized code>",
  "additional_suggestions": ["<suggestion 1>", "<suggestion 2>"]
}}

Code to optimize:
```{language}
{code}
```

Respond with ONLY the JSON object. No markdown, no explanation outside the JSON.""",

    "document": """You are a technical writer and documentation expert.

Generate complete, professional documentation for this {language} code.

Return your response in **valid JSON only** with this exact structure:
{{
  "overview": "<High-level description of what this code does>",
  "documented_code": "<the full code with inline comments and docstrings added>",
  "api_docs": {{
    "functions": [
      {{
        "name": "<function/method name>",
        "description": "<what it does>",
        "parameters": [
          {{"name": "<param>", "type": "<type>", "description": "<what it is>"}}
        ],
        "returns": {{"type": "<return type>", "description": "<what it returns>"}},
        "raises": ["<exception 1>"],
        "example": "<usage example>"
      }}
    ]
  }},
  "readme_section": "<A README.md section for this code>",
  "usage_examples": ["<example 1>", "<example 2>"]
}}

Code to document:
```{language}
{code}
```

Respond with ONLY the JSON object. No markdown, no explanation outside the JSON."""
}


# ─────────────────────────── Helper Functions ────────────────────────────────

import time

def call_gemini(prompt: str) -> dict:
    """Call Gemini API with automatic retry for temporary errors."""

    if not AI_READY:
        return {
            "error": "API key not configured. Please add your GEMINI_API_KEY to the .env file."
        }

    max_retries = 3

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=8192,
                    response_mime_type="application/json",
                )
            )

            raw_text = response.text.strip()

            # Remove markdown code fences if returned
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:]
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:]

            if raw_text.endswith("```"):
                raw_text = raw_text[:-3]

            raw_text = raw_text.strip()

            return json.loads(raw_text)

        except json.JSONDecodeError as e:
            return {
                "error": f"Failed to parse AI response: {str(e)}",
                "raw": response.text[:500] if "response" in locals() else ""
            }

        except Exception as e:
            error_message = str(e)

            # Retry temporary server errors
            if "503" in error_message or "UNAVAILABLE" in error_message:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(
                        f"Gemini temporarily unavailable. "
                        f"Retrying in {wait_time} seconds..."
                    )
                    time.sleep(wait_time)
                    continue

            return {
                "error": f"AI API error: {error_message}"
            }

    return {
        "error": "Gemini is temporarily unavailable. Please try again."
    }


# ─────────────────────────── Routes ──────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status")
def status():
    return jsonify({"ready": AI_READY, "message": "API key configured" if AI_READY else "Please configure GEMINI_API_KEY"})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    code = data.get("code", "").strip()
    language = data.get("language", "python").strip()
    action = data.get("action", "review").strip().lower()
    
    if not code:
        return jsonify({"error": "No code provided"}), 400
    
    if action not in PROMPTS:
        return jsonify({"error": f"Unknown action: {action}. Valid: review, explain, debug, optimize, document"}), 400
    
    prompt = PROMPTS[action].format(language=language, code=code)
    result = call_gemini(prompt)
    
    if "error" in result:
        return jsonify(result), 500
    
    return jsonify({"action": action, "language": language, "result": result})


if __name__ == "__main__":
    print("=" * 60)
    print("  CodeSense AI - LLM Code Review Assistant")
    print("=" * 60)
    if AI_READY:
        print("  [OK] Gemini API: Connected")
    else:
        print("  [!!] Gemini API: Not configured (add key to .env)")
    print("  [>>] Starting server at http://127.0.0.1:5000")
    print("=" * 60)
    app.run(debug=True, host="0.0.0.0", port=5000)
