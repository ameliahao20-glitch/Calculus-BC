// ============================================================
// BC CALCULUS FORUM — app.js
// 替换下面两行为你的 Supabase 项目信息
// ============================================================
const SUPABASE_URL = 'https://srahnugolqsjqqvaptem.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyYWhudWdvbHFzanFxdmFwdGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDM1ODIsImV4cCI6MjA5MzI3OTU4Mn0.WFlWgi6lMB7thw9CXQIC7Yb-fIuMGLd6UhgzAzGCGJM';
const TEACHER_PASSWORD = 'maythefivebewithu';

// ============================================================
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUnit = 'all';
let currentPostId = null;
let isTeacher = false;
let selectedFile = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  loadAnnouncements();
});

// ============================================================
// NAVIGATION
// ============================================================
function showSection(name) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  event.target.classList.add('active');
}

// ============================================================
// UNIT FILTER
// ============================================================
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

  let query = db.from('posts').select('*').order('pinned', { ascending: false }).order('created_at', { ascending: false });
  if (currentUnit !== 'all') query = query.eq('unit', currentUnit);

  const { data, error } = await query;

  if (error) { list.innerHTML = '<div class="empty-state">加载失败，请刷新页面</div>'; return; }
  if (!data || data.length === 0) { list.innerHTML = '<div class="empty-state">还没有帖子 — 第一个发帖提问吧！</div>'; return; }

  list.innerHTML = data.map(post => `
    <div class="post-card ${post.pinned ? 'pinned' : ''}" onclick="openPost('${post.id}')">
      <div class="post-unit-badge">Unit ${post.unit}</div>
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
function openPostModal() {
  document.getElementById('post-modal').classList.add('open');
}

function closePostModal() {
  document.getElementById('post-modal').classList.remove('open');
  selectedFile = null;
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
  } else if (file.type === 'application/pdf') {
    preview.innerHTML = `<div class="pdf-badge">📄 ${escHtml(file.name)}</div>`;
  }
}

async function submitPost() {
  const author = document.getElementById('post-author').value.trim();
  const unit = document.getElementById('post-unit').value;
  const title = document.getElementById('post-title').value.trim();
  const body = document.getElementById('post-body').value.trim();

  if (!author) { alert('请输入你的名字'); return; }
  if (!title) { alert('请输入标题'); return; }

  const btn = document.querySelector('#post-modal .submit-btn');
  btn.disabled = true;
  btn.textContent = '发布中...';

  let fileUrl = null;

  // Upload file if selected
  if (selectedFile) {
    const ext = selectedFile.name.split('.').pop();
    const path = `posts/${Date.now()}_${Math.random().toString(36).substr(2,8)}.${ext}`;
    const { data: uploadData, error: uploadError } = await db.storage.from('uploads').upload(path, selectedFile);
    if (!uploadError) {
      const { data: urlData } = db.storage.from('uploads').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }
  }

  const { error } = await db.from('posts').insert({
    author, unit: parseInt(unit), title, body,
    file_url: fileUrl,
    file_type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'pdf') : null,
    pinned: false, answered: false, comment_count: 0
  });

  btn.disabled = false;
  btn.textContent = '发布';

  if (error) { alert('发布失败，请重试'); return; }

  closePostModal();
  document.getElementById('post-author').value = '';
  document.getElementById('post-title').value = '';
  document.getElementById('post-body').value = '';
  loadPosts();
}

// ============================================================
// POST DETAIL
// ============================================================
async function openPost(id) {
  currentPostId = id;
  const modal = document.getElementById('detail-modal');
  modal.classList.add('open');

  const { data: post } = await db.from('posts').select('*').eq('id', id).single();
  if (!post) return;

  document.getElementById('detail-title').textContent = post.title;

  let fileHtml = '';
  if (post.file_url) {
    if (post.file_type === 'image') {
      fileHtml = `<img src="${post.file_url}" alt="附图">`;
    } else {
      fileHtml = `<a href="${post.file_url}" target="_blank" class="notes-pdf-link">📄 查看PDF</a>`;
    }
  }

  document.getElementById('detail-content').innerHTML = `
    <div style="font-size:12px;color:var(--ink-faint);margin-bottom:8px;">
      <strong style="color:var(--ink-light)">${escHtml(post.author)}</strong> · Unit ${post.unit} · ${formatDate(post.created_at)}
    </div>
    <div class="detail-body">${escHtml(post.body || '')}</div>
    ${fileHtml}
  `;

  loadComments(id);
}

function closeDetailModal(e) {
  if (!e || e.target === e.currentTarget) {
    document.getElementById('detail-modal').classList.remove('open');
    currentPostId = null;
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
      <div class="comment-author">${escHtml(c.author)}${c.is_teacher ? ' 👩‍🏫' : ''}</div>
      <div class="comment-body">${escHtml(c.body)}</div>
      <div class="comment-date">${formatDate(c.created_at)}</div>
    </div>
  `).join('');
}

async function submitComment() {
  const author = document.getElementById('comment-author').value.trim();
  const body = document.getElementById('comment-body').value.trim();
  if (!author) { alert('请输入你的名字'); return; }
  if (!body) { alert('请输入回答内容'); return; }
  if (!currentPostId) return;

  const btn = document.querySelector('.add-comment .submit-btn');
  btn.disabled = true;

  await db.from('comments').insert({ post_id: currentPostId, author, body, is_teacher: isTeacher });
  // Update comment count
  await db.rpc('increment_comment_count', { post_id: currentPostId });

  document.getElementById('comment-body').value = '';
  btn.disabled = false;
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
      <div class="announce-body">${escHtml(a.body)}</div>
    </div>
  `).join('');
}

// ============================================================
// NOTES
// ============================================================
function openNotes(unit) {
  const unitNames = {
    '1':'极限与连续','2':'导数定义与法则','3':'微分应用',
    '4':'积分入门','5':'积分应用','6':'微分方程',
    '7':'参数方程与极坐标','8':'数列与级数','9':'泰勒展开','10':'综合与AP题型'
  };
  document.getElementById('notes-title').textContent = `Unit ${unit} — ${unitNames[unit]}`;
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

  // Check if content contains a URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const withLinks = data.content.replace(urlRegex, url =>
    `<a href="${url}" target="_blank" class="notes-pdf-link">📄 打开文件</a>`
  );
  content.innerHTML = `<div class="notes-content">${withLinks}</div>`;
}

function closeNotesModal(e) {
  if (!e || e.target === e.currentTarget) document.getElementById('notes-modal').classList.remove('open');
}

// ============================================================
// TEACHER
// ============================================================
function showTeacherLogin() {
  if (isTeacher) { toggleTeacherPanel(); return; }
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

function toggleTeacherPanel() {
  const panel = document.getElementById('teacher-panel');
  panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function tpTab(name) {
  document.querySelectorAll('.tp-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tp-section').forEach(s => s.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tp-' + name).classList.add('active');
  if (name === 'posts') loadTeacherPosts();
}

async function loadTeacherPosts() {
  const list = document.getElementById('tp-posts-list');
  const { data } = await db.from('posts').select('*').order('created_at', { ascending: false });
  if (!data || data.length === 0) { list.innerHTML = '<div style="color:var(--ink-faint);font-size:13px;">暂无帖子</div>'; return; }

  list.innerHTML = data.map(p => `
    <div class="tp-post-item">
      <div class="tp-post-title">${escHtml(p.title)}</div>
      <div class="tp-post-meta">Unit ${p.unit} · ${escHtml(p.author)} · ${formatDate(p.created_at)}</div>
      <div class="tp-actions">
        <button class="tp-btn pin" onclick="togglePin('${p.id}', ${p.pinned})">${p.pinned ? '取消置顶' : '置顶'}</button>
        <button class="tp-btn answered" onclick="toggleAnswered('${p.id}', ${p.answered})">${p.answered ? '取消已解决' : '标记已解决'}</button>
        <button class="tp-btn delete" onclick="deletePost('${p.id}')">删除</button>
      </div>
    </div>
  `).join('');
}

async function togglePin(id, current) {
  await db.from('posts').update({ pinned: !current }).eq('id', id);
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
  alert(`Unit ${unit} 知识点已保存！`);
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
