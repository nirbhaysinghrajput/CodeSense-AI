/* ═══════════════════════════════════════════════════════════
   CodeSense AI – app.js
   Handles all frontend logic, API calls, and result rendering
═══════════════════════════════════════════════════════════ */

'use strict';

// ── DOM References ─────────────────────────────────────────
const codeInput        = document.getElementById('codeInput');
const languageSelect   = document.getElementById('languageSelect');
const analyzeBtn       = document.getElementById('analyzeBtn');
const analyzeBtnContent= document.getElementById('analyzeBtnContent');
const analyzeBtnLoading= document.getElementById('analyzeBtnLoading');
const clearBtn         = document.getElementById('clearBtn');
const pasteExampleBtn  = document.getElementById('pasteExampleBtn');
const copyResultBtn    = document.getElementById('copyResultBtn');
const charCount        = document.getElementById('charCount');
const lineCount        = document.getElementById('lineCount');
const editorLabel      = document.getElementById('editorLabel');
const outputPlaceholder= document.getElementById('outputPlaceholder');
const outputError      = document.getElementById('outputError');
const outputResult     = document.getElementById('outputResult');
const errorTitle       = document.getElementById('errorTitle');
const errorMessage     = document.getElementById('errorMessage');
const apiStatus        = document.getElementById('apiStatus');
const statusDot        = document.getElementById('statusDot');
const statusText       = document.getElementById('statusText');
const toast            = document.getElementById('toast');
const actionTabs       = document.getElementById('actionTabs');

// ── State ──────────────────────────────────────────────────
let currentAction  = 'review';
let lastResultData = null;
let toastTimer     = null;

// ── Language → file extension map ─────────────────────────
const LANG_EXT = {
  python: 'py', javascript: 'js', java: 'java', cpp: 'cpp', c: 'c',
  typescript: 'ts', go: 'go', rust: 'rs', ruby: 'rb', php: 'php',
  swift: 'swift', kotlin: 'kt', csharp: 'cs', sql: 'sql', bash: 'sh', r: 'r'
};

// ── Example code snippets per language ────────────────────
const EXAMPLES = {
  python: `def fibonacci(n):
    if n == 0:
        return 0
    if n == 1:
        return 1
    return fibonacci(n - 1) + fibonacci(n - 1)  # Bug: should be fibonacci(n-2)

def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(len(arr)):   # O(n^2) - can be improved
            if i != j and arr[i] == arr[j]:
                if arr[i] not in duplicates:
                    duplicates.append(arr[i])
    return duplicates`,

  javascript: `function bubbleSort(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {  // Bug: should be arr.length - i - 1
            if (arr[j] > arr[j + 1]) {
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}

function sumArray(numbers) {
    let sum = 0;
    for (let i = 0; i <= numbers.length; i++) {  // Bug: off-by-one
        sum += numbers[i];
    }
    return sum;
}`,

  java: `public class Solution {
    public int sum(int n) {
        int result = 0;
        for (int i = 0; i <= n; i++) {  // Bug: should be i < n
            result += i;
        }
        return result;
    }

    public boolean isPrime(int n) {
        for (int i = 2; i < n; i++) {   // Inefficient: should be i <= sqrt(n)
            if (n % i == 0) return false;
        }
        return true;
    }
}`,

  cpp: `#include <iostream>
using namespace std;

int factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n);  // Bug: infinite recursion, should be factorial(n-1)
}

void reverseArray(int arr[], int n) {
    for (int i = 0; i < n; i++) {    // Bug: should be n/2
        int temp = arr[i];
        arr[i] = arr[n - i - 1];
        arr[n - i - 1] = temp;
    }
}`,

  default: `def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)  # Bug: no check for empty list

def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`
};

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkApiStatus();
  updateEditorInfo();
  setupTabListeners();
  setupEditorListeners();
  setupButtonListeners();
});

// ── API Status Check ──────────────────────────────────────
async function checkApiStatus() {
  try {
    const res = await fetch('/api/status');
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'Server Starting...';
      return;
    }
    const data = await res.json();
    if (data.ready) {
      statusDot.className = 'status-dot ready';
      statusText.textContent = 'Gemini Connected';
    } else {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'API Key Missing';
    }
  } catch {
    statusDot.className = 'status-dot error';
    statusText.textContent = 'Server Offline';
  }
}

// ── Tab Listeners ─────────────────────────────────────────
function setupTabListeners() {
  actionTabs.querySelectorAll('.action-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      actionTabs.querySelectorAll('.action-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentAction = tab.dataset.action;
    });
  });
}

// ── Editor Listeners ──────────────────────────────────────
function setupEditorListeners() {
  codeInput.addEventListener('input', updateEditorInfo);
  codeInput.addEventListener('keydown', e => {
    // Tab key support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeInput.selectionStart;
      const end   = codeInput.selectionEnd;
      codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + 4;
    }
  });

  languageSelect.addEventListener('change', () => {
    const ext = LANG_EXT[languageSelect.value] || 'txt';
    editorLabel.textContent = `code.${ext}`;
  });
}

function updateEditorInfo() {
  const text = codeInput.value;
  charCount.textContent = `${text.length} character${text.length !== 1 ? 's' : ''}`;
  const lines = text === '' ? 0 : text.split('\n').length;
  lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
}

// ── Button Listeners ──────────────────────────────────────
function setupButtonListeners() {
  analyzeBtn.addEventListener('click', runAnalysis);
  clearBtn.addEventListener('click', clearEditor);
  pasteExampleBtn.addEventListener('click', loadExample);
  copyResultBtn.addEventListener('click', copyResult);
}

function clearEditor() {
  codeInput.value = '';
  updateEditorInfo();
  showPlaceholder();
  showToast('Editor cleared');
}

function loadExample() {
  const lang = languageSelect.value;
  codeInput.value = EXAMPLES[lang] || EXAMPLES.default;
  updateEditorInfo();
  showToast('Example code loaded!');
}

function copyResult() {
  if (!lastResultData) return;
  const text = JSON.stringify(lastResultData, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    showToast('Result copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy – try manually');
  });
}

// ── Core Analysis Call ────────────────────────────────────
async function runAnalysis() {
  const code = codeInput.value.trim();
  if (!code) {
    showToast('⚠️ Please paste some code first!');
    codeInput.focus();
    return;
  }

  setLoading(true);
  hideAll();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        language: languageSelect.value,
        action: currentAction
      })
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      if (response.status === 504 || response.status === 502) {
        showError('Server Waking Up', 'The cloud service is warming up or took longer to respond. Please try again in a few moments.');
      } else {
        showError('Service Unavailable', 'The server is temporarily unavailable. Please try again in a moment.');
      }
      return;
    }

    if (!response.ok || (data && data.error)) {
      const msg = (data && data.error) ? data.error : 'Unable to complete the analysis. Please try again.';
      let title = 'Analysis Notice';
      if (msg.includes('Rate Limit')) {
        title = 'Rate Limit Reached';
      } else if (msg.includes('API key') || msg.includes('API Key')) {
        title = 'Configuration Required';
      } else if (msg.includes('busy') || msg.includes('overloaded') || msg.includes('high traffic')) {
        title = 'Service Busy';
      }
      showError(title, msg);
      return;
    }

    lastResultData = data;
    renderResult(data.action, data.result);
    copyResultBtn.style.display = 'flex';

  } catch (err) {
    showError('Connection Issue', 'Unable to reach the server. Please check your internet connection and try again.');
  } finally {
    setLoading(false);
  }
}

// ── Loading State ─────────────────────────────────────────
function setLoading(on) {
  analyzeBtn.disabled = on;
  analyzeBtnContent.classList.toggle('hidden', on);
  analyzeBtnLoading.classList.toggle('hidden', !on);
}

// ── State Management ──────────────────────────────────────
function hideAll() {
  outputPlaceholder.classList.add('hidden');
  outputError.classList.add('hidden');
  outputResult.classList.add('hidden');
  outputResult.innerHTML = '';
  copyResultBtn.style.display = 'none';
}

function showPlaceholder() {
  hideAll();
  outputPlaceholder.classList.remove('hidden');
}

function showError(title, message) {
  hideAll();
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  outputError.classList.remove('hidden');
}

// ── Result Renderer (action-aware) ────────────────────────
function renderResult(action, data) {
  hideAll();
  outputResult.classList.remove('hidden');

  const renderers = {
    review:   renderReview,
    explain:  renderExplain,
    debug:    renderDebug,
    optimize: renderOptimize,
    document: renderDocument
  };

  const fn = renderers[action];
  if (fn) {
    fn(data);
  } else {
    outputResult.innerHTML = `<pre class="code-block">${escHtml(JSON.stringify(data, null, 2))}</pre>`;
  }
}

// ════════════════════════════════════════════════════════════
//  RENDER: Code Review
// ════════════════════════════════════════════════════════════
function renderReview(d) {
  const score = d.score ?? 0;

  outputResult.innerHTML = `
    <!-- Score Banner -->
    <div class="score-banner">
      <div class="score-circle" style="--score:${score}">
        <span class="score-num">${score}</span>
      </div>
      <div class="score-info">
        <div class="score-label">Code Quality Score</div>
        <div class="score-summary">${escHtml(d.summary ?? '')}</div>
      </div>
      ${d.verdict ? `<span class="verdict-badge verdict-${d.verdict}">${d.verdict.replace('_', ' ')}</span>` : ''}
    </div>

    <!-- Bugs -->
    ${renderCollapsible('🐛 Bugs & Issues', buildBugsHTML(d.bugs), d.bugs?.length ? `badge-red` : 'badge-green', d.bugs?.length ? `${d.bugs.length} found` : 'Clean', true)}

    <!-- Complexity -->
    ${renderCollapsible('⚡ Complexity Analysis', buildComplexityHTML(d.complexity), 'badge-blue', 'O(n)', false)}

    <!-- Improvements -->
    ${renderCollapsible('🚀 Improvements', buildImprovementsHTML(d.improvements), 'badge-indigo', `${d.improvements?.length ?? 0} tips`, false)}

    <!-- Code Quality -->
    ${renderCollapsible('✅ Code Quality', buildQualityHTML(d.quality), 'badge-green', '', false)}

    <!-- Optimized Code -->
    ${d.optimized_code ? renderCollapsible('💡 Optimized Code', buildCodeBlockHTML(d.optimized_code), 'badge-indigo', '', false) : ''}
  `;
  attachCollapsibles();
}

// ════════════════════════════════════════════════════════════
//  RENDER: Explain
// ════════════════════════════════════════════════════════════
function renderExplain(d) {
  outputResult.innerHTML = `
    <!-- Summary Card -->
    <div class="score-banner">
      <div class="score-info">
        <div class="score-label">📖 Code Explanation</div>
        <div class="score-summary">${escHtml(d.summary ?? '')}</div>
      </div>
    </div>

    ${renderCollapsible('🎯 Purpose', `<p class="text-block">${escHtml(d.purpose ?? '')}</p>`, 'badge-indigo', '', true)}
    ${renderCollapsible('🔢 How It Works – Step by Step', buildStepsHTML(d.how_it_works), 'badge-blue', `${d.how_it_works?.length ?? 0} steps`, false)}
    ${renderCollapsible('💡 Key Concepts', buildConceptsHTML(d.key_concepts), 'badge-indigo', `${d.key_concepts?.length ?? 0} concepts`, false)}
    ${renderCollapsible('⚡ Complexity', buildComplexityHTML(d.complexity), 'badge-blue', '', false)}
    ${d.real_world_use ? renderCollapsible('🌍 Real-World Use', `<p class="text-block">${escHtml(d.real_world_use)}</p>`, 'badge-green', '', false) : ''}
    ${d.beginner_tips?.length ? renderCollapsible('📌 Beginner Tips', buildTipsHTML(d.beginner_tips), 'badge-amber', `${d.beginner_tips.length} tips`, false) : ''}
  `;
  attachCollapsibles();
}

// ════════════════════════════════════════════════════════════
//  RENDER: Debug
// ════════════════════════════════════════════════════════════
function renderDebug(d) {
  const hasBugs = d.has_bugs;
  outputResult.innerHTML = `
    <!-- Header Banner -->
    <div class="score-banner">
      <div class="score-info">
        <div class="score-label">${hasBugs ? '🚨 Bugs Detected' : '✅ No Bugs Found'}</div>
        <div class="score-summary">${escHtml(d.overall_assessment ?? '')}</div>
      </div>
      <span class="verdict-badge ${hasBugs ? 'verdict-POOR' : 'verdict-EXCELLENT'}">${hasBugs ? `${d.bug_count} Bug${d.bug_count !== 1 ? 's' : ''}` : 'Clean'}</span>
    </div>

    ${renderCollapsible('🐛 Detailed Bug Report', buildDebugBugsHTML(d.bugs), hasBugs ? 'badge-red' : 'badge-green', `${d.bug_count ?? 0} found`, true)}
    ${d.edge_cases?.length ? renderCollapsible('⚠️ Edge Cases', buildTagsHTML(d.edge_cases), 'badge-amber', `${d.edge_cases.length}`, false) : ''}
    ${d.corrected_code ? renderCollapsible('✅ Corrected Code', buildCodeBlockHTML(d.corrected_code), 'badge-green', '', false) : ''}
  `;
  attachCollapsibles();
}

// ════════════════════════════════════════════════════════════
//  RENDER: Optimize
// ════════════════════════════════════════════════════════════
function renderOptimize(d) {
  outputResult.innerHTML = `
    <!-- Performance Banner -->
    <div class="score-banner">
      <div class="score-info">
        <div class="score-label">⚡ Performance Analysis</div>
        <div class="score-summary">
          Before: <strong>${d.current_performance?.time_complexity ?? '?'}</strong> time /
          <strong>${d.current_performance?.space_complexity ?? '?'}</strong> space →
          After: <strong>${d.optimized_performance?.time_complexity ?? '?'}</strong> time /
          <strong>${d.optimized_performance?.space_complexity ?? '?'}</strong> space
        </div>
      </div>
      ${d.optimized_performance?.improvement ? `<span class="verdict-badge verdict-EXCELLENT">${escHtml(d.optimized_performance.improvement)}</span>` : ''}
    </div>

    ${renderCollapsible('🔍 Current Bottlenecks', buildTagsHTML(d.current_performance?.bottlenecks), 'badge-amber', '', true)}
    ${renderCollapsible('🚀 Optimizations', buildOptimizationsHTML(d.optimizations), 'badge-green', `${d.optimizations?.length ?? 0} applied`, false)}
    ${d.optimized_code ? renderCollapsible('💡 Optimized Code', buildCodeBlockHTML(d.optimized_code), 'badge-indigo', '', false) : ''}
    ${d.additional_suggestions?.length ? renderCollapsible('📌 Additional Suggestions', buildTipsHTML(d.additional_suggestions), 'badge-indigo', `${d.additional_suggestions.length}`, false) : ''}
  `;
  attachCollapsibles();
}

// ════════════════════════════════════════════════════════════
//  RENDER: Document
// ════════════════════════════════════════════════════════════
function renderDocument(d) {
  outputResult.innerHTML = `
    <div class="score-banner">
      <div class="score-info">
        <div class="score-label">📄 Auto Documentation</div>
        <div class="score-summary">${escHtml(d.overview ?? '')}</div>
      </div>
    </div>

    ${d.documented_code ? renderCollapsible('📝 Documented Code', buildCodeBlockHTML(d.documented_code), 'badge-indigo', 'With comments', true) : ''}
    ${renderCollapsible('📚 API Reference', buildApiDocsHTML(d.api_docs), 'badge-blue', `${d.api_docs?.functions?.length ?? 0} functions`, false)}
    ${d.readme_section ? renderCollapsible('📖 README Section', `<div class="code-block-wrapper"><pre class="code-block">${escHtml(d.readme_section)}</pre></div>`, 'badge-green', '', false) : ''}
    ${d.usage_examples?.length ? renderCollapsible('💡 Usage Examples', buildUsageExamplesHTML(d.usage_examples), 'badge-indigo', `${d.usage_examples.length}`, false) : ''}
  `;
  attachCollapsibles();
}

// ══════════════════════════════════════════════════════════
//  HTML BUILDERS
// ══════════════════════════════════════════════════════════

function buildBugsHTML(bugs) {
  if (!bugs?.length) return '<p class="text-block" style="color:var(--emerald)">🎉 No bugs detected! Code looks clean.</p>';
  return bugs.map(b => `
    <div class="bug-item severity-${b.severity ?? 'LOW'}">
      <div class="bug-item-header">
        <span class="bug-severity ${b.severity ?? 'LOW'}">${b.severity ?? 'LOW'}</span>
        ${b.line ? `<span class="bug-location">Line ${escHtml(String(b.line))}</span>` : ''}
      </div>
      <div class="bug-desc">${escHtml(b.description ?? '')}</div>
      ${b.fix ? `<div class="bug-fix">✅ <strong>Fix:</strong> ${escHtml(b.fix)}</div>` : ''}
    </div>
  `).join('');
}

function buildDebugBugsHTML(bugs) {
  if (!bugs?.length) return '<p class="text-block" style="color:var(--emerald)">🎉 No bugs found! Your code is clean.</p>';
  return bugs.map(b => `
    <div class="bug-item severity-${b.severity ?? 'LOW'}">
      <div class="bug-item-header">
        <span class="bug-severity ${b.severity ?? 'LOW'}">${b.severity ?? 'LOW'}</span>
        <span class="bug-severity" style="background:rgba(129,140,248,0.15);color:var(--indigo)">${b.type ?? ''}</span>
        ${b.location ? `<span class="bug-location">${escHtml(String(b.location))}</span>` : ''}
      </div>
      <div class="bug-desc"><strong>${escHtml(b.description ?? '')}</strong></div>
      ${b.impact ? `<div class="bug-fix" style="color:var(--amber)">⚠️ <strong>Impact:</strong> ${escHtml(b.impact)}</div>` : ''}
      ${b.fix ? `<div class="bug-fix">✅ <strong>Fix:</strong> ${escHtml(b.fix)}</div>` : ''}
      ${b.fixed_code ? `<div class="code-block-label" style="margin-top:10px">Fixed Code</div><pre class="code-block">${escHtml(b.fixed_code)}</pre>` : ''}
    </div>
  `).join('');
}

function buildComplexityHTML(c) {
  if (!c) return '<p class="text-block">No complexity data.</p>';
  return `
    <div class="complexity-grid">
      <div class="complexity-item">
        <div class="complexity-label">Time Complexity</div>
        <div class="complexity-value">${escHtml(c.time ?? '?')}</div>
      </div>
      <div class="complexity-item">
        <div class="complexity-label">Space Complexity</div>
        <div class="complexity-value">${escHtml(c.space ?? '?')}</div>
      </div>
    </div>
    ${c.explanation ? `<p class="text-block">${escHtml(c.explanation)}</p>` : ''}
  `;
}

function buildImprovementsHTML(items) {
  if (!items?.length) return '<p class="text-block">No improvements suggested.</p>';
  return items.map(item => `
    <div class="improvement-item">
      <div class="improvement-title">💡 ${escHtml(item.title ?? '')}</div>
      <div class="improvement-desc">${escHtml(item.description ?? '')}</div>
      ${item.example ? `<div class="code-block-label" style="margin-top:8px">Example</div><pre class="code-block">${escHtml(item.example)}</pre>` : ''}
    </div>
  `).join('');
}

function buildQualityHTML(q) {
  if (!q) return '<p class="text-block">No quality data.</p>';
  const items = [
    { label: 'Naming', value: q.naming },
    { label: 'Readability', value: q.readability },
    { label: 'Structure', value: q.structure },
    { label: 'Best Practices', value: q.best_practices }
  ].filter(i => i.value);
  return `<div class="quality-grid">${items.map(i => `
    <div class="quality-item">
      <div class="quality-label">${escHtml(i.label)}</div>
      <div class="quality-value">${escHtml(i.value)}</div>
    </div>
  `).join('')}</div>`;
}

function buildStepsHTML(steps) {
  if (!steps?.length) return '<p class="text-block">No steps available.</p>';
  return steps.map(s => `
    <div class="step-item">
      <div class="step-num">${s.step ?? ''}</div>
      <div class="step-desc">${escHtml(s.description ?? '')}</div>
    </div>
  `).join('');
}

function buildConceptsHTML(concepts) {
  if (!concepts?.length) return '<p class="text-block">No concepts found.</p>';
  return concepts.map(c => `
    <div class="concept-item">
      <div class="concept-name">${escHtml(c.concept ?? '')}</div>
      <div class="concept-desc">${escHtml(c.explanation ?? '')}</div>
    </div>
  `).join('');
}

function buildTipsHTML(tips) {
  if (!tips?.length) return '';
  return `<div class="tips-list">${tips.map(t => `
    <div class="tip-item">
      <span class="tip-icon">💡</span>
      <span>${escHtml(t)}</span>
    </div>
  `).join('')}</div>`;
}

function buildTagsHTML(tags) {
  if (!tags?.length) return '<p class="text-block">None identified.</p>';
  return `<div class="tags-list">${tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}</div>`;
}

function buildOptimizationsHTML(opts) {
  if (!opts?.length) return '<p class="text-block">No optimizations found.</p>';
  return opts.map(o => `
    <div class="opt-item">
      <div class="opt-header">
        <span class="opt-title">${escHtml(o.title ?? '')}</span>
        ${o.category ? `<span class="opt-category">${escHtml(o.category)}</span>` : ''}
        ${o.impact ? `<span class="opt-impact ${o.impact}">${escHtml(o.impact)}</span>` : ''}
      </div>
      <div class="opt-body">
        <div class="opt-explanation">${escHtml(o.explanation ?? '')}</div>
        ${o.before ? `<div class="code-block-label">Before</div><pre class="code-block">${escHtml(o.before)}</pre>` : ''}
        ${o.after  ? `<div class="code-block-label">After</div><pre class="code-block">${escHtml(o.after)}</pre>` : ''}
      </div>
    </div>
  `).join('');
}

function buildCodeBlockHTML(code) {
  return `
    <div class="code-block-wrapper">
      <button class="copy-code-btn" onclick="copyCode(this)">Copy</button>
      <pre class="code-block">${escHtml(code ?? '')}</pre>
    </div>
  `;
}

function buildApiDocsHTML(apiDocs) {
  const fns = apiDocs?.functions ?? [];
  if (!fns.length) return '<p class="text-block">No functions documented.</p>';
  return fns.map(fn => `
    <div class="concept-item" style="margin-bottom:12px">
      <div class="concept-name" style="font-family:var(--font-mono)">🔧 ${escHtml(fn.name ?? '')}</div>
      <div class="concept-desc" style="margin-bottom:8px">${escHtml(fn.description ?? '')}</div>
      ${fn.parameters?.length ? `
        <div class="code-block-label">Parameters</div>
        ${fn.parameters.map(p => `
          <div class="tip-item" style="margin:4px 0">
            <span style="font-family:var(--font-mono);color:var(--indigo);font-size:0.8rem">${escHtml(p.name ?? '')} <span style="color:var(--text-3)">${escHtml(p.type ?? '')}</span></span>
            <span class="text-block">– ${escHtml(p.description ?? '')}</span>
          </div>
        `).join('')}
      ` : ''}
      ${fn.returns ? `<div class="bug-fix" style="margin-top:6px">↩ Returns <code style="font-family:var(--font-mono);color:var(--sky)">${escHtml(fn.returns.type ?? '')}</code>: ${escHtml(fn.returns.description ?? '')}</div>` : ''}
      ${fn.example ? `<div class="code-block-label" style="margin-top:8px">Example</div><pre class="code-block">${escHtml(fn.example)}</pre>` : ''}
    </div>
  `).join('');
}

function buildUsageExamplesHTML(examples) {
  return examples.map((ex, i) => `
    <div class="code-block-wrapper" style="margin-bottom:10px">
      <button class="copy-code-btn" onclick="copyCode(this)">Copy</button>
      <div class="code-block-label">Example ${i + 1}</div>
      <pre class="code-block">${escHtml(ex)}</pre>
    </div>
  `).join('');
}

// ── Collapsible Cards ─────────────────────────────────────
function renderCollapsible(title, bodyHTML, badgeClass, badgeText, openByDefault) {
  const id = 'card-' + Math.random().toString(36).slice(2, 9);
  return `
    <div class="result-card">
      <div class="result-card-header" data-target="${id}">
        <span class="result-card-title">${title}</span>
        ${badgeText ? `<span class="result-card-badge ${badgeClass}">${escHtml(badgeText)}</span>` : ''}
        <svg class="result-card-chevron ${openByDefault ? 'open' : ''}" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="result-card-body ${openByDefault ? 'open' : ''}" id="${id}">
        ${bodyHTML}
      </div>
    </div>
  `;
}

function attachCollapsibles() {
  document.querySelectorAll('.result-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset.target;
      const body     = document.getElementById(targetId);
      const chevron  = header.querySelector('.result-card-chevron');
      const isOpen   = body.classList.contains('open');
      body.classList.toggle('open', !isOpen);
      chevron.classList.toggle('open', !isOpen);
    });
  });
}

// ── Copy Code Block ───────────────────────────────────────
window.copyCode = function(btn) {
  const pre = btn.parentElement.querySelector('pre');
  navigator.clipboard.writeText(pre.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  });
};

// ── Toast Notification ────────────────────────────────────
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

// ── Escape HTML ───────────────────────────────────────────
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
