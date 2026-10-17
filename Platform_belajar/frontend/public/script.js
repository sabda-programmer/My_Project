function togglePassword() {
  const passwordInput = document.getElementById('password');
  const icon = document.getElementById('icon');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.src = 'foto/hide.png';
  } else {
    passwordInput.type = 'password';
    icon.src = 'foto/view.png';
  }
}

const login = document.getElementById('formLogin');

login.addEventListener("submit", function (masuk) {
  masuk.preventDefault();
  window.location.href = "platform-belajar";
});

// script.js
// Menghubungkan form HTML ke API backend (/api/tugas)

const API_BASE = '/api/tugas'; // relatif, karena frontend disajikan oleh server yang sama

const form = document.getElementById('formTugas');
const alertBox = document.getElementById('alertBox');
const btnSubmit = document.getElementById('btnSubmit');
const listTugas = document.getElementById('listTugas');

const dropzone = document.getElementById('dropzone');
const inputFile = document.getElementById('file_tugas');
const dropzoneText = document.getElementById('dropzoneText');

// -------------------------------------------------------
// 1. Interaksi drag & drop / klik untuk memilih file
// -------------------------------------------------------
dropzone.addEventListener('click', () => inputFile.click());

inputFile.addEventListener('change', () => {
  updateDropzoneLabel();
});

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (e) => {
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    inputFile.files = files;
    updateDropzoneLabel();
  }
});

function updateDropzoneLabel() {
  if (inputFile.files.length > 0) {
    const file = inputFile.files[0];
    const sizeKB = (file.size / 1024).toFixed(1);
    dropzoneText.innerHTML = `📄 <strong>${file.name}</strong><br><span>${sizeKB} KB</span>`;
  }
}

// -------------------------------------------------------
// 2. Submit form -> kirim tugas ke backend
// -------------------------------------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  if (!inputFile.files.length) {
    showAlert('error', 'Silakan pilih file tugas terlebih dahulu.');
    return;
  }

  const formData = new FormData();
  formData.append('nama_siswa', document.getElementById('nama_siswa').value);
  formData.append('nim_nis', document.getElementById('nim_nis').value);
  formData.append('judul_tugas', document.getElementById('judul_tugas').value);
  formData.append('deskripsi', document.getElementById('deskripsi').value);
  formData.append('file_tugas', inputFile.files[0]);

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Mengirim...';

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();

    if (res.ok && result.sukses) {
      showAlert('success', result.pesan || 'Tugas berhasil dikirim!');
      form.reset();
      dropzoneText.innerHTML = 'Klik atau seret file ke sini<br><span>PDF, DOC, DOCX, PPT, PPTX, ZIP, PNG, JPG — maks 10MB</span>';
      muatDaftarTugas();
    } else {
      showAlert('error', result.pesan || 'Gagal mengirim tugas.');
    }
  } catch (err) {
    showAlert('error', 'Tidak dapat terhubung ke server.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Kirim Tugas';
  }
});

// -------------------------------------------------------
// 3. Ambil & tampilkan daftar tugas yang sudah dikumpulkan
// -------------------------------------------------------
async function muatDaftarTugas() {
  try {
    const res = await fetch(API_BASE);
    const result = await res.json();

    if (!result.sukses || result.data.length === 0) {
      listTugas.innerHTML = '<p class="empty-state">Belum ada tugas yang dikumpulkan.</p>';
      return;
    }

    listTugas.innerHTML = result.data.map(item => `
      <div class="tugas-item">
        <div class="tugas-info">
          <h3>${escapeHtml(item.judul_tugas)}</h3>
          <p>${escapeHtml(item.nama_siswa)} (${escapeHtml(item.nim_nis)}) — ${formatTanggal(item.dikirim_pada)}</p>
        </div>
        <div class="tugas-actions">
          <a href="${item.path_file}" target="_blank" rel="noopener">Lihat File</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    listTugas.innerHTML = '<p class="empty-state">Gagal memuat data dari server.</p>';
  }
}

// -------------------------------------------------------
// 4. Helper functions
// -------------------------------------------------------
function showAlert(type, message) {
  alertBox.className = 'alert ' + type;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
}

function hideAlert() {
  alertBox.style.display = 'none';
}

function formatTanggal(tanggal) {
  const d = new Date(tanggal);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Muat daftar tugas saat halaman pertama kali dibuka
muatDaftarTugas();
