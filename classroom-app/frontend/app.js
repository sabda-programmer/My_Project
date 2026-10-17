// app.js
// ------------------------------------------------------------
// INI BAGIAN PALING PENTING UNTUK "MENYAMBUNGKAN" FRONTEND KE
// BACKEND: cukup ubah API_BASE_URL di bawah ini sesuai alamat
// backend kamu. Semua request (fetch) di file ini akan memakai
// alamat tersebut.
// ------------------------------------------------------------
const API_BASE_URL = 'http://localhost:3000/api';

let currentUserId = null; // user yang sedang "login" (dipilih dari dropdown)
let allUsers = [];

// ------------------------------------------------------------
// INIT
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadUsers();
  await loadPosts();

  document.getElementById('newPostForm').addEventListener('submit', handleNewPost);
  document.getElementById('currentUser').addEventListener('change', (e) => {
    currentUserId = Number(e.target.value);
  });
});

// ------------------------------------------------------------
// USERS — mengisi dropdown "Masuk sebagai"
// ------------------------------------------------------------
async function loadUsers() {
  const res = await fetch(`${API_BASE_URL}/users`);
  allUsers = await res.json();

  const select = document.getElementById('currentUser');
  select.innerHTML = allUsers
    .map((u) => `<option value="${u.id}">${u.name} (${u.role === 'teacher' ? 'Guru' : 'Murid'})</option>`)
    .join('');

  if (allUsers.length > 0) {
    currentUserId = allUsers[0].id;
    select.value = currentUserId;
  }
}

// ------------------------------------------------------------
// POSTS — ambil semua postingan lalu render ke halaman
// ------------------------------------------------------------
async function loadPosts() {
  const container = document.getElementById('postsList');
  const res = await fetch(`${API_BASE_URL}/posts`);
  const posts = await res.json();

  if (posts.length === 0) {
    container.innerHTML = '<p class="muted">Belum ada postingan. Buat yang pertama di atas!</p>';
    return;
  }

  container.innerHTML = '';
  for (const post of posts) {
    const detailRes = await fetch(`${API_BASE_URL}/posts/${post.id}`);
    const detail = await detailRes.json();
    container.appendChild(renderPostCard(detail));
  }
}

function renderPostCard(post) {
  const template = document.getElementById('postTemplate');
  const node = template.content.cloneNode(true);

  const badge = node.querySelector('.badge');
  badge.textContent = post.type === 'announcement' ? 'Pengumuman' : 'Tugas';
  badge.classList.toggle('announcement', post.type === 'announcement');

  node.querySelector('.post-title').textContent = post.title;
  node.querySelector('.post-meta').textContent =
    `${post.author_name} • ${formatDate(post.created_at)}`;
  node.querySelector('.post-description').textContent = post.description || '';

  const dueEl = node.querySelector('.post-due');
  if (post.due_date) {
    dueEl.textContent = `⏰ Tenggat: ${formatDate(post.due_date)}`;
  } else {
    dueEl.remove();
  }

  // Sembunyikan kotak "kumpulkan tugas" jika ini pengumuman, bukan tugas
  const submissionBox = node.querySelector('.submission-box');
  if (post.type !== 'assignment') {
    submissionBox.remove();
  } else {
    renderSubmissions(node, post.submissions);
    node.querySelector('.submit-form').addEventListener('submit', (e) =>
      handleSubmitFile(e, post.id)
    );
  }

  // Render komentar
  renderComments(node, post.comments);
  node.querySelector('.comment-form').addEventListener('submit', (e) =>
    handleAddComment(e, post.id)
  );

  return node;
}

function renderSubmissions(node, submissions) {
  const list = node.querySelector('.submission-list');
  if (!submissions || submissions.length === 0) {
    list.innerHTML = '<li class="muted">Belum ada yang mengumpulkan.</li>';
    return;
  }
  list.innerHTML = submissions
    .map(
      (s) => `
      <li>
        <b>${s.user_name}</b> mengumpulkan
        <a href="http://localhost:3000/uploads/${s.file_path}" target="_blank" rel="noopener">
          ${s.file_name}
        </a>
        — ${formatDate(s.submitted_at)}
      </li>`
    )
    .join('');
}

function renderComments(node, comments) {
  const list = node.querySelector('.comment-list');
  if (!comments || comments.length === 0) {
    list.innerHTML = '<li class="muted">Belum ada komentar.</li>';
    return;
  }
  list.innerHTML = comments
    .map((c) => `<li><b>${c.user_name}:</b> ${escapeHtml(c.text)}</li>`)
    .join('');
}

// ------------------------------------------------------------
// HANDLERS (form submit)
// ------------------------------------------------------------
async function handleNewPost(e) {
  e.preventDefault();
  const title = document.getElementById('postTitle').value.trim();
  const description = document.getElementById('postDescription').value.trim();
  const type = document.getElementById('postType').value;
  const due_date = document.getElementById('postDueDate').value || null;

  if (!title || !currentUserId) return;

  await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, type, due_date, author_id: currentUserId })
  });

  e.target.reset();
  await loadPosts();
}

async function handleAddComment(e, postId) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!text || !currentUserId) return;

  await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: currentUserId, text })
  });

  await loadPosts();
}

async function handleSubmitFile(e, postId) {
  e.preventDefault();
  const fileInput = e.target.querySelector('input[type="file"]');
  const file = fileInput.files[0];
  if (!file || !currentUserId) return;

  // Untuk upload file, TIDAK pakai JSON.stringify, tapi FormData,
  // karena kita mengirim file biner, bukan teks.
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', currentUserId);

  await fetch(`${API_BASE_URL}/posts/${postId}/submissions`, {
    method: 'POST',
    body: formData
    // NOTE: jangan set header Content-Type manual di sini,
    // browser akan mengaturnya otomatis (multipart/form-data + boundary)
  });

  await loadPosts();
}

// ------------------------------------------------------------
// UTIL
// ------------------------------------------------------------
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
