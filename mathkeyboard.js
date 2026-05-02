// ============================================================
// MATH KEYBOARD — mathkeyboard.js
// ============================================================

const MATH_SYMBOLS = [
  // 基础运算
  { label: '×', insert: '\\times ' },
  { label: '÷', insert: '\\div ' },
  { label: '±', insert: '\\pm ' },
  { label: '≠', insert: '\\neq ' },
  { label: '≤', insert: '\\leq ' },
  { label: '≥', insert: '\\geq ' },
  { label: '≈', insert: '\\approx ' },
  { label: '∞', insert: '\\infty ' },
  // 分数/根号
  { label: 'a/b', insert: '\\frac{}{} ' },
  { label: '√', insert: '\\sqrt{} ' },
  { label: 'ⁿ√', insert: '\\sqrt[n]{} ' },
  { label: 'xⁿ', insert: '^{} ' },
  { label: 'xₙ', insert: '_{} ' },
  // 微积分
  { label: '∫', insert: '\\int ' },
  { label: '∫ᵃᵇ', insert: '\\int_{a}^{b} ' },
  { label: '∬', insert: '\\iint ' },
  { label: 'Σ', insert: '\\sum_{i=1}^{n} ' },
  { label: '∏', insert: '\\prod_{i=1}^{n} ' },
  { label: 'lim', insert: '\\lim_{x \\to } ' },
  { label: 'd/dx', insert: '\\frac{d}{dx} ' },
  { label: '∂/∂x', insert: '\\frac{\\partial}{\\partial x} ' },
  { label: "f'", insert: "f'(x) " },
  { label: "f''", insert: "f''(x) " },
  // 希腊字母
  { label: 'α', insert: '\\alpha ' },
  { label: 'β', insert: '\\beta ' },
  { label: 'γ', insert: '\\gamma ' },
  { label: 'δ', insert: '\\delta ' },
  { label: 'ε', insert: '\\epsilon ' },
  { label: 'θ', insert: '\\theta ' },
  { label: 'λ', insert: '\\lambda ' },
  { label: 'μ', insert: '\\mu ' },
  { label: 'π', insert: '\\pi ' },
  { label: 'σ', insert: '\\sigma ' },
  { label: 'τ', insert: '\\tau ' },
  { label: 'φ', insert: '\\phi ' },
  { label: 'ω', insert: '\\omega ' },
  { label: 'Δ', insert: '\\Delta ' },
  { label: 'Ω', insert: '\\Omega ' },
  // 三角函数
  { label: 'sin', insert: '\\sin ' },
  { label: 'cos', insert: '\\cos ' },
  { label: 'tan', insert: '\\tan ' },
  { label: 'csc', insert: '\\csc ' },
  { label: 'sec', insert: '\\sec ' },
  { label: 'cot', insert: '\\cot ' },
  { label: 'sin⁻¹', insert: '\\sin^{-1} ' },
  { label: 'cos⁻¹', insert: '\\cos^{-1} ' },
  { label: 'tan⁻¹', insert: '\\tan^{-1} ' },
  // 对数/指数
  { label: 'ln', insert: '\\ln ' },
  { label: 'log', insert: '\\log ' },
  { label: 'logₐ', insert: '\\log_{a} ' },
  { label: 'eˣ', insert: 'e^{} ' },
  // 括号
  { label: '()', insert: '\\left( \\right) ' },
  { label: '[]', insert: '\\left[ \\right] ' },
  { label: '{}', insert: '\\left\\{ \\right\\} ' },
  { label: '|x|', insert: '\\left| \\right| ' },
  // 集合/逻辑
  { label: '∈', insert: '\\in ' },
  { label: '∉', insert: '\\notin ' },
  { label: '⊂', insert: '\\subset ' },
  { label: '∪', insert: '\\cup ' },
  { label: '∩', insert: '\\cap ' },
  { label: '→', insert: '\\to ' },
  { label: '⟺', insert: '\\iff ' },
  // 向量
  { label: 'vec', insert: '\\vec{} ' },
  { label: '‖v‖', insert: '\\|\\| ' },
  { label: '·', insert: '\\cdot ' },
];

function createMathKeyboard(targetId) {
  const container = document.createElement('div');
  container.className = 'math-keyboard';
  container.innerHTML = `
    <div class="mk-header">
      <span class="mk-title">数学符号</span>
      <span class="mk-hint">点击插入，公式会用 $...$ 包裹</span>
    </div>
    <div class="mk-buttons">
      ${MATH_SYMBOLS.map(s => `
        <button class="mk-btn" onclick="insertMath('${targetId}', '${s.insert.replace(/'/g, "\\'")}')" title="${s.insert}">${s.label}</button>
      `).join('')}
    </div>
  `;
  return container;
}

function insertMath(targetId, latex) {
  const textarea = document.getElementById(targetId);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.substring(start, end);

  let insertion;
  if (selected) {
    insertion = `$${selected}${latex}$`;
  } else {
    insertion = `$${latex}$`;
  }

  textarea.value = value.substring(0, start) + insertion + value.substring(end);
  textarea.focus();
  const newPos = start + insertion.length;
  textarea.setSelectionRange(newPos, newPos);
}

function initMathKeyboards() {
  const targets = [
    { id: 'post-body', containerId: 'post-body-kb' },
    { id: 'comment-body', containerId: 'comment-body-kb' },
  ];

  targets.forEach(({ id, containerId }) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(createMathKeyboard(id));
    }
  });
}

document.addEventListener('DOMContentLoaded', initMathKeyboards);
