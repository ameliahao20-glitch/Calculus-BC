// ============================================================
// MATHQUILL KEYBOARD — mathkeyboard.js
// ============================================================

const MATH_BUTTONS = [
  // 基础
  { label: '×', cmd: '\\times' },
  { label: '÷', cmd: '\\div' },
  { label: '±', cmd: '\\pm' },
  { label: '≠', cmd: '\\neq' },
  { label: '≤', cmd: '\\leq' },
  { label: '≥', cmd: '\\geq' },
  { label: '≈', cmd: '\\approx' },
  { label: '∞', cmd: '\\infty' },
  // 分数根号
  { label: 'a/b', cmd: '\\frac' },
  { label: '√', cmd: '\\sqrt' },
  { label: 'xⁿ', cmd: '^' },
  { label: 'xₙ', cmd: '_' },
  // 微积分
  { label: '∫', cmd: '\\int' },
  { label: '∫ᵃᵇ', cmd: '\\int_{a}^{b}' },
  { label: 'Σ', cmd: '\\sum' },
  { label: '∏', cmd: '\\prod' },
  { label: 'lim', cmd: '\\lim' },
  { label: 'd/dx', cmd: '\\frac{d}{dx}' },
  { label: '∂/∂x', cmd: '\\frac{\\partial}{\\partial x}' },
  { label: "f'", cmd: "f'" },
  // 希腊字母
  { label: 'α', cmd: '\\alpha' },
  { label: 'β', cmd: '\\beta' },
  { label: 'γ', cmd: '\\gamma' },
  { label: 'δ', cmd: '\\delta' },
  { label: 'ε', cmd: '\\epsilon' },
  { label: 'θ', cmd: '\\theta' },
  { label: 'λ', cmd: '\\lambda' },
  { label: 'μ', cmd: '\\mu' },
  { label: 'π', cmd: '\\pi' },
  { label: 'σ', cmd: '\\sigma' },
  { label: 'φ', cmd: '\\phi' },
  { label: 'ω', cmd: '\\omega' },
  { label: 'Δ', cmd: '\\Delta' },
  { label: 'Ω', cmd: '\\Omega' },
  // 三角
  { label: 'sin', cmd: '\\sin' },
  { label: 'cos', cmd: '\\cos' },
  { label: 'tan', cmd: '\\tan' },
  { label: 'sin⁻¹', cmd: '\\sin^{-1}' },
  { label: 'cos⁻¹', cmd: '\\cos^{-1}' },
  { label: 'tan⁻¹', cmd: '\\tan^{-1}' },
  // 对数
  { label: 'ln', cmd: '\\ln' },
  { label: 'log', cmd: '\\log' },
  { label: 'eˣ', cmd: 'e^' },
  // 括号
  { label: '()', cmd: '\\left(\\right)' },
  { label: '[]', cmd: '\\left[\\right]' },
  { label: '|x|', cmd: '\\left|\\right|' },
  // 向量
  { label: 'vec', cmd: '\\vec' },
  { label: '·', cmd: '\\cdot' },
  // 集合
  { label: '∈', cmd: '\\in' },
  { label: '∉', cmd: '\\notin' },
  { label: '⊂', cmd: '\\subset' },
  { label: '∪', cmd: '\\cup' },
  { label: '∩', cmd: '\\cap' },
  { label: '→', cmd: '\\to' },
];

// Store MathQuill field instances
const mqFields = {};

function initMathQuill(textareaId) {
  const textarea = document.getElementById(textareaId);
  if (!textarea || !window.MathQuill) return;

  const MQ = MathQuill.getInterface(2);

  // Create a container to replace the textarea
  const container = document.createElement('div');
  container.className = 'mq-container';

  // Create the MathQuill editor div
  const mqDiv = document.createElement('div');
  mqDiv.className = 'mq-editor';
  container.appendChild(mqDiv);

  // Insert container before textarea and hide textarea
  textarea.parentNode.insertBefore(container, textarea);
  textarea.style.display = 'none';

  // Initialize MathQuill
  const mf = MQ.MathField(mqDiv, {
    spaceBehavesLikeTab: false,
    handlers: {
      edit: () => {
        // Sync latex back to textarea for form submission
        textarea.value = mf.latex();
      }
    }
  });

  mqFields[textareaId] = mf;

  // Create keyboard
  const kbContainer = document.getElementById(textareaId + '-kb');
  if (kbContainer) {
    kbContainer.innerHTML = `
      <div class="math-keyboard">
        <div class="mk-header">
          <span class="mk-title">数学符号</span>
          <span class="mk-hint">点击插入符号</span>
        </div>
        <div class="mk-buttons">
          ${MATH_BUTTONS.map(b => `
            <button class="mk-btn" onmousedown="event.preventDefault(); insertMQ('${textareaId}', '${b.cmd.replace(/'/g, "\\'")}')">${b.label}</button>
          `).join('')}
        </div>
      </div>
    `;
  }
}

function insertMQ(textareaId, cmd) {
  const mf = mqFields[textareaId];
  if (!mf) return;
  mf.cmd(cmd);
  mf.focus();
}

function getMQLatex(textareaId) {
  const mf = mqFields[textareaId];
  return mf ? mf.latex() : document.getElementById(textareaId)?.value || '';
}

function clearMQ(textareaId) {
  const mf = mqFields[textareaId];
  if (mf) mf.latex('');
}

function initMathKeyboards() {
  // Wait for MathQuill to load
  if (!window.MathQuill) {
    setTimeout(initMathKeyboards, 300);
    return;
  }
  initMathQuill('post-body');
  initMathQuill('comment-body');
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initMathKeyboards, 500);
});
