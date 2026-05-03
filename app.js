const SUPABASE_URL = 'https://srahnugolqsjqqvaptem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyYWhudWdvbHFzanFxdmFwdGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDM1ODIsImV4cCI6MjA5MzI3OTU4Mn0.WFlWgi6lMB7thw9CXQIC7Yb-fIuMGLd6UhgzAzGCGJM';
const TEACHER_PASSWORD = 'maythefivebewithu';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUnit = 'all';
let currentPostId = null;
let isTeacher = false;
let isUrgent = false;
let selectedFile = null;
let selectedCommentFile = null;
let currentUser = null;

// ============================================================
// AUTH
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    updateUserBadge();
  }
  // Show app directly without requiring login
  loadPosts();
  loadAnnouncements();
});

function switchAuth(tab) {
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.style.display = 'none');
  event.target.classList.add('active');
  document.getElementById('auth-' + tab).style.display = 'block';
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const msg = document.getElementById('reg-msg');

  if (!name) { msg.textContent = '请输入名字'; msg.style.color = 'var(--accent)'; return; }
  if (!email) { msg.textContent = '请输入邮箱'; msg.style.color = 'var(--accent)'; return; }
  if (password.length < 6) { msg.textContent = '密码至少6位'; msg.style.color = 'var(--accent)'; return; }

  msg.textContent = '注册中...'; msg.style.color = 'var(--ink-faint)';

  const { data, error } = await db.auth.signUp({
    email, password,
    options: { data: { display_name: name } }
  });

  if (error) { msg.textContent = error.message; msg.style.color = 'var(--accent)'; return; }

  currentUser = data.user;
  msg.textContent = '注册成功！'; msg.style.color = 'green';
  setTimeout(() => showApp(), 800);
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const msg = document.getElementById('login-msg');

  msg.textContent = '登录中...'; msg.style.color = 'var(--ink-faint)';

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  if (error) { msg.textContent = '邮箱或密码错误'; msg.style.color = 'var(--accent)'; return; }

  currentUser = data.user;
  showApp();
}

async function doLogout() {
  await db.auth.signOut();
  currentUser = null;
  document.getElementById('auth-overlay').style.display = 'none';
  updateUserBadge();
}

function showApp() {
  document.getElementById('auth-overlay').style.display = 'none';
  updateUserBadge();
  loadPosts();
}

function updateUserBadge() {
  const badge = document.getElementById('user-badge');
  const logoutBtn = document.getElementById('logout-btn');
  if (currentUser) {
    const name = currentUser?.user_metadata?.display_name || currentUser?.email || '用户';
    badge.textContent = name;
    logoutBtn.style.display = 'block';
  } else {
    badge.textContent = '';
    logoutBtn.style.display = 'none';
  }
}

function getDisplayName() {
  if (currentUser) {
    return currentUser?.user_metadata?.display_name || currentUser?.email || '匿名';
  }
  // For non-logged-in users, ask for name
  let name = localStorage.getItem('guest_name');
  if (!name) {
    name = prompt('请输入你的名字：');
    if (name) localStorage.setItem('guest_name', name);
    else name = '匿名';
  }
  return name;
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(name, btn) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

function selectUnit(unit, btn) {
  currentUnit = unit;
  document.querySelectorAll('.unit-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadPosts();
}

// ============================================================
// POSTS
// ============================================================
async function loadPosts() {
  const list = document.getElementById('posts-list');
  list.innerHTML = '<div class="loading-state">加载中...</div>';

  let query = db.from('posts').select('*')
    .order('pinned', { ascending: false })
    .order('starred', { ascending: false })
    .order('urgent', { ascending: false })
    .order('created_at', { ascending: false });

  if (currentUnit !== 'all') query = query.eq('unit', currentUnit);

  const { data, error } = await query;

  if (error) { list.innerHTML = '<div class="empty-state">加载失败，请刷新页面</div>'; return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">还没有帖子 — 第一个发帖提问吧！</div>'; return; }

  list.innerHTML = data.map(post => `
    <div class="post-card ${post.pinned ? 'pinned' : ''} ${post.starred ? 'starred' : ''}" onclick="openPost('${post.id}')">
      <div class="post-badges">
        <span class="post-unit-badge">U${post.unit}</span>
        ${post.urgent ? '<span class="urgent-badge">‼️ 紧急</span>' : ''}
        ${post.starred ? '<span class="star-badge">⭐ 重要</span>' : ''}
        ${post.pinned ? '<span class="pin-badge">📌 置顶</span>' : ''}
      </div>
      <div class="post-title">${escHtml(post.title)}</div>
      <div class="post-preview">${escHtml(post.body || '')}</div>
      <div class="post-meta">
        <span class="post-author">${escHtml(post.author)}</span>
        <span>${formatDate(post.created_at)}</span>
        ${post.answered ? '<span class="answered-badge">✓ 已解决</span>' : ''}
        <span class="post-comments">💬 ${post.comment_count || 0}</span>
      </div>
    </div>
  `).join('');
}

// ============================================================
// POST MODAL
// ============================================================
function toggleUrgent() {
  isUrgent = !isUrgent;
  const btn = document.getElementById('urgent-btn');
  btn.textContent = isUrgent ? '‼️ 紧急' : '普通';
  btn.classList.toggle('urgent-active', isUrgent);
}

function openPostModal() {
  document.getElementById('post-modal').classList.add('open');
}

function closePostModal() {
  document.getElementById('post-modal').classList.remove('open');
  selectedFile = null;
  isUrgent = false;
  document.getElementById('urgent-btn').textContent = '普通';
  document.getElementById('urgent-btn').classList.remove('urgent-active');
  document.getElementById('file-preview').innerHTML = '';
  document.getElementById('post-image').value = '';
}

function closeModal(e) {
  if (e.target === e.currentTarget) closePostModal();
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  const preview = document.getElementById('file-preview');
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => { preview.innerHTML = `<img src="${ev.target.result}" alt="preview">`; };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<div class="pdf-badge">📄 ${escHtml(file.name)}</div>`;
  }
}

function handleCommentFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedCommentFile = file;
  const preview = document.getElementById('comment-file-preview');
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = ev => { preview.innerHTML = `<img src="${ev.target.result}" alt="preview" style="max-width:100%;border-radius:8px;">`; };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<div class="pdf-badge">📄 ${escHtml(file.name)}</div>`;
  }
}

async function submitPost() {
  const unit = document.getElementById('post-unit').value;
  const title = document.getElementById('post-title').value.trim();
  const body = getMQLatex('post-body').trim();

  if (!title) { alert('请输入标题'); return; }

  const btn = document.querySelector('#post-modal .submit-btn');
  btn.disabled = true; btn.textContent = '发布中...';

  let fileUrl = null;
  if (selectedFile) {
    const ext = selectedFile.name.split('.').pop();
    const path = `posts/${Date.now()}_${Math.random().toString(36).substr(2,8)}.${ext}`;
    const { error: uploadError } = await db.storage.from('uploads').upload(path, selectedFile);
    if (!uploadError) {
      const { data: urlData } = db.storage.from('uploads').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }
  }

  const { error } = await db.from('posts').insert({
    author: getDisplayName(),
    user_id: currentUser.id,
    unit: parseInt(unit), title, body,
    file_url: fileUrl,
    file_type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'pdf') : null,
    pinned: false, starred: false, answered: false, urgent: isUrgent, comment_count: 0
  });

  btn.disabled = false; btn.textContent = '发布';
  if (error) { alert('发布失败，请重试'); return; }

  closePostModal();
  document.getElementById('post-title').value = '';
  clearMQ('post-body');
  loadPosts();
}

// ============================================================
// POST DETAIL
// ============================================================
async function openPost(id) {
  currentPostId = id;
  document.getElementById('detail-modal').classList.add('open');

  const { data: post } = await db.from('posts').select('*').eq('id', id).single();
  if (!post) return;

  document.getElementById('detail-title').textContent = post.title;

  let fileHtml = '';
  if (post.file_url) {
    fileHtml = post.file_type === 'image'
      ? `<img src="${post.file_url}" alt="附图" style="max-width:100%;border-radius:8px;margin-top:8px;">`
      : `<a href="${post.file_url}" target="_blank" class="notes-pdf-link">📄 查看PDF</a>`;
  }

  document.getElementById('detail-content').innerHTML = `
    <div style="font-size:12px;color:var(--ink-faint);margin-bottom:8px;">
      <strong style="color:var(--ink-light)">${escHtml(post.author)}</strong> · U${post.unit} · ${formatDate(post.created_at)}
      ${post.urgent ? ' · <span style="color:#c84b31">‼️ 紧急</span>' : ''}
    </div>
    <div class="detail-body mathjax-content">${escHtml(post.body || '')}</div>
    ${fileHtml}
  `;

  if (window.MathJax) MathJax.typesetPromise([document.getElementById('detail-content')]);
  loadComments(id);
}

function closeDetailModal(e) {
  if (!e || e.target === e.currentTarget) {
    document.getElementById('detail-modal').classList.remove('open');
    currentPostId = null;
    selectedCommentFile = null;
    document.getElementById('comment-file-preview').innerHTML = '';
  }
}

// ============================================================
// COMMENTS
// ============================================================
async function loadComments(postId) {
  const list = document.getElementById('comments-list');
  list.innerHTML = '<div style="color:var(--ink-faint);font-size:13px;">加载中...</div>';

  const { data } = await db.from('comments').select('*').eq('post_id', postId).order('created_at');
  document.getElementById('comment-count').textContent = data ? data.length : 0;

  if (!data || data.length === 0) {
    list.innerHTML = '<div style="color:var(--ink-faint);font-size:13px;padding:8px 0;">还没有回答，来第一个回答吧！</div>';
    return;
  }

  list.innerHTML = data.map(c => `
    <div class="comment-card ${c.is_teacher ? 'teacher-comment' : ''}">
      <div class="comment-author">
        ${c.is_teacher
          ? `<span class="teacher-tag">${escHtml(c.author)}</span>`
          : escHtml(c.author)
        }
      </div>
      <div class="comment-body mathjax-content">${escHtml(c.body)}</div>
      ${c.file_url ? (c.file_type === 'image'
        ? `<img src="${c.file_url}" style="max-width:100%;border-radius:8px;margin-top:8px;">`
        : `<a href="${c.file_url}" target="_blank" class="notes-pdf-link">📄 查看PDF</a>`)
        : ''}
      <div class="comment-date">${formatDate(c.created_at)}</div>
    </div>
  `).join('');

  if (window.MathJax) MathJax.typesetPromise([list]);
}

async function submitComment() {
  const body = getMQLatex('comment-body').trim();
  if (!body && !selectedCommentFile) { alert('请输入回答内容'); return; }
  if (!currentPostId) return;

  const btn = document.querySelector('.add-comment .submit-btn');
  btn.disabled = true; btn.textContent = '提交中...';

  let fileUrl = null, fileType = null;
  if (selectedCommentFile) {
    const ext = selectedCommentFile.name.split('.').pop();
    const path = `comments/${Date.now()}_${Math.random().toString(36).substr(2,8)}.${ext}`;
    const { error: uploadError } = await db.storage.from('uploads').upload(path, selectedCommentFile);
    if (!uploadError) {
      const { data: urlData } = db.storage.from('uploads').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
      fileType = selectedCommentFile.type.startsWith('image/') ? 'image' : 'pdf';
    }
  }

  await db.from('comments').insert({
    post_id: currentPostId,
    author: getDisplayName(),
    body, is_teacher: isTeacher,
    file_url: fileUrl, file_type: fileType
  });
  await db.rpc('increment_comment_count', { post_id: currentPostId });

  clearMQ('comment-body');
  document.getElementById('comment-file-preview').innerHTML = '';
  document.getElementById('comment-file').value = '';
  selectedCommentFile = null;
  btn.disabled = false; btn.textContent = '提交回答';
  loadComments(currentPostId);
  loadPosts();
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
async function loadAnnouncements() {
  const list = document.getElementById('announcements-list');
  const { data } = await db.from('announcements').select('*').order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    list.innerHTML = '<div class="empty-state">暂无公告</div>';
    return;
  }

  list.innerHTML = data.map(a => `
    <div class="announce-card">
      <div class="announce-title">${escHtml(a.title)}</div>
      <div class="announce-date">${formatDate(a.created_at)}</div>
      <div class="announce-body mathjax-content">${escHtml(a.body)}</div>
    </div>
  `).join('');

  if (window.MathJax) MathJax.typesetPromise([list]);
}

// ============================================================
// NOTES
// ============================================================
function openNotes(unit) {
  const unitNames = {
    '1':'极限与连续','2':'导数：定义与基本性质','3':'导数：复合、隐函数与反函数',
    '4':'导数的实际应用','5':'导数的分析应用','6':'积分',
    '7':'微分方程','8':'积分的应用','9':'参数方程、极坐标与向量','10':'无穷数列与级数'
  };
  document.getElementById('notes-title').textContent = `U${unit} — ${unitNames[unit]}`;
  document.getElementById('notes-modal').classList.add('open');
  loadNotes(unit);
}

async function loadNotes(unit) {
  const content = document.getElementById('notes-content');
  content.innerHTML = '<div style="color:var(--ink-faint)">加载中...</div>';

  const { data } = await db.from('notes').select('*').eq('unit', unit).single();

  if (!data || !data.content) {
    content.innerHTML = '<div class="empty-notes">老师还没有上传这个 Unit 的知识点总结，敬请期待。</div>';
    return;
  }

  // Check if content has any LaTeX commands
  const hasLatex = data.content.includes('\\') || data.content.includes('\\section') || data.content.includes('\\vspace');
  
  if (hasLatex) {
    content.innerHTML = processLatex(data.content);
  } else {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const withLinks = escHtml(data.content).replace(urlRegex, url =>
      `<a href="${url}" target="_blank" class="notes-pdf-link">📄 打开文件</a>`
    );
    content.innerHTML = `<div class="notes-content mathjax-content">${withLinks}</div>`;
  }
  if (window.MathJax) MathJax.typesetPromise([content]);
}

function closeNotesModal(e) {
  if (!e || e.target === e.currentTarget) document.getElementById('notes-modal').classList.remove('open');
}

// ============================================================
// TEACHER
// ============================================================
function showTeacherLogin() {
  if (isTeacher) { document.getElementById('teacher-panel').style.display = 'flex'; return; }
  document.getElementById('teacher-modal').classList.add('open');
}

function closeTeacherModal(e) {
  if (!e || e.target === e.currentTarget) document.getElementById('teacher-modal').classList.remove('open');
}

function teacherLogin() {
  const pw = document.getElementById('teacher-password').value;
  if (pw === TEACHER_PASSWORD) {
    isTeacher = true;
    document.getElementById('teacher-modal').classList.remove('open');
    document.getElementById('teacher-panel').style.display = 'flex';
    loadTeacherPosts();
  } else {
    document.getElementById('login-error').textContent = '密码错误';
  }
}

function teacherLogout() {
  isTeacher = false;
  document.getElementById('teacher-panel').style.display = 'none';
}

function tpTab(name, btn) {
  document.querySelectorAll('.tp-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tp-section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tp-' + name).classList.add('active');
  if (name === 'posts') loadTeacherPosts();
}

async function loadTeacherPosts() {
  const list = document.getElementById('tp-posts-list');
  const { data } = await db.from('posts').select('*').order('created_at', { ascending: false });
  if (!data || data.length === 0) { list.innerHTML = '<div style="color:var(--ink-faint);font-size:13px;">暂无帖子</div>'; return; }

  list.innerHTML = data.map(p => `
    <div class="tp-post-item">
      <div class="tp-post-title">${p.urgent ? '‼️ ' : ''}${p.starred ? '⭐ ' : ''}${escHtml(p.title)}</div>
      <div class="tp-post-meta">U${p.unit} · ${escHtml(p.author)} · ${formatDate(p.created_at)}</div>
      <div class="tp-actions">
        <button class="tp-btn pin" onclick="togglePin('${p.id}', ${p.pinned})">${p.pinned ? '取消置顶' : '📌 置顶'}</button>
        <button class="tp-btn star" onclick="toggleStar('${p.id}', ${p.starred})">${p.starred ? '取消重要' : '⭐ 重要'}</button>
        <button class="tp-btn answered" onclick="toggleAnswered('${p.id}', ${p.answered})">${p.answered ? '取消已解决' : '✓ 已解决'}</button>
        <button class="tp-btn delete" onclick="deletePost('${p.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

async function togglePin(id, current) {
  await db.from('posts').update({ pinned: !current }).eq('id', id);
  loadTeacherPosts(); loadPosts();
}

async function toggleStar(id, current) {
  await db.from('posts').update({ starred: !current }).eq('id', id);
  loadTeacherPosts(); loadPosts();
}

async function toggleAnswered(id, current) {
  await db.from('posts').update({ answered: !current }).eq('id', id);
  loadTeacherPosts(); loadPosts();
}

async function deletePost(id) {
  if (!confirm('确定删除这个帖子？')) return;
  await db.from('posts').delete().eq('id', id);
  loadTeacherPosts(); loadPosts();
}

async function postAnnouncement() {
  const title = document.getElementById('ann-title').value.trim();
  const body = document.getElementById('ann-body').value.trim();
  if (!title || !body) { alert('请填写标题和内容'); return; }
  await db.from('announcements').insert({ title, body });
  document.getElementById('ann-title').value = '';
  document.getElementById('ann-body').value = '';
  alert('公告发布成功！');
  loadAnnouncements();
}

async function saveNotes() {
  const unit = document.getElementById('notes-unit').value;
  const content = document.getElementById('notes-body').value.trim();
  if (!content) { alert('请输入内容'); return; }

  const { data: existing } = await db.from('notes').select('id').eq('unit', unit).single();
  if (existing) {
    await db.from('notes').update({ content }).eq('unit', unit);
  } else {
    await db.from('notes').insert({ unit: parseInt(unit), content });
  }
  alert(`U${unit} 知识点已保存！`);
}

// ============================================================
// HELPERS
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}


function showLoginPanel() {
  const overlay = document.getElementById('auth-overlay');
  overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none';
}function processLatex(raw) {
  if (!raw) return '';

  let html = raw;

  // Step 1: protect ALL math FIRST before any other processing
  const protectedMath = [];

  // Protect display math \[...\]
  html = html.replace(/\\[[\s\S]*?\\]/g, (m) => {
    protectedMath.push({ type: 'display', content: m.slice(2, -2) });
    return `%%MATH${protectedMath.length - 1}%%`;
  });

  // Protect display math \begin{equation}...\end{equation}
  html = html.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (m, inner) => {
    protectedMath.push({ type: 'display', content: inner });
    return `%%MATH${protectedMath.length - 1}%%`;
  });

  // Protect display math \begin{align}...\end{align}
  html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (m, inner) => {
    protectedMath.push({ type: 'display', content: inner });
    return `%%MATH${protectedMath.length - 1}%%`;
  });

  // Protect inline math $...$
  html = html.replace(/\$([^$\n]+?)\$/g, (m, inner) => {
    protectedMath.push({ type: 'inline', content: inner });
    return `%%MATH${protectedMath.length - 1}%%`;
  });

  // Step 2: remove document preamble
  html = html.replace(/\\documentclass[\s\S]*?\\begin\{document\}/m, '');
  html = html.replace(/\\end\{document\}/g, '');
  html = html.replace(/\\maketitle/g, '');
  html = html.replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, '');
  html = html.replace(/\\setcounter\{[^}]*\}\{[^}]*\}/g, '');
  html = html.replace(/\\setlength\{[^}]*\}\{[^}]*\}/g, '');
  html = html.replace(/\\geometry\{[^}]*\}/g, '');

  // Title/author/date
  html = html.replace(/\\title\{([^}]*)\}/g, '<h1>$1</h1>');
  html = html.replace(/\\author\{([^}]*)\}/g, '<p class="doc-author"><em>$1</em></p>');
  html = html.replace(/\\date\{([^}]*)\}/g, '<p class="doc-date"><em>$1</em></p>');

  // Step 3: sections
  html = html.replace(/\\section\*?\{([^}]*)\}/g, '</p><h2>$1</h2><p>');
  html = html.replace(/\\subsection\*?\{([^}]*)\}/g, '</p><h3>$1</h3><p>');
  html = html.replace(/\\subsubsection\*?\{([^}]*)\}/g, '</p><h4>$1</h4><p>');

  // Step 4: text formatting
  html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
  html = html.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\text\{([^}]*)\}/g, '$1');
  html = html.replace(/\\&/g, '&amp;');

  // Step 5: lists
  html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, inner) => {
    const items = inner.split('\\item').filter(s => s.trim());
    return '</p><ul>' + items.map(i => `<li>${i.trim()}</li>`).join('') + '</ul><p>';
  });
  html = html.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, inner) => {
    const items = inner.split('\\item').filter(s => s.trim());
    return '</p><ol>' + items.map(i => `<li>${i.trim()}</li>`).join('') + '</ol><p>';
  });

  // Step 6: spacing
  html = html.replace(/\\vspace\{[^}]*\}/g, '<br>');
  html = html.replace(/\\hspace\{[^}]*\}/g, '&nbsp;&nbsp;');
  html = html.replace(/\\newline/g, '<br>');
  html = html.replace(/\\noindent/g, '');
  html = html.replace(/\\\\/g, '<br>');

  // Step 7: remove remaining unknown commands
  html = html.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');
  html = html.replace(/\\[a-zA-Z@]+/g, '');
  html = html.replace(/[{}]/g, '');

  // Step 8: restore protected math
  protectedMath.forEach((m, i) => {
    if (m.type === 'display') {
      html = html.replace(`%%MATH${i}%%`, `</p><div class="display-math">\\[${m.content}\\]</div><p>`);
    } else {
      html = html.replace(`%%MATH${i}%%`, `$${m.content}$`);
    }
  });

  // Step 9: paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<(?:h[1-4]|ul|ol|div))/g, '$1');
  html = html.replace(/(<\/(?:h[1-4]|ul|ol|div)>)\s*<\/p>/g, '$1');

  return `<div class="latex-rendered">${html}</div>`;
}

