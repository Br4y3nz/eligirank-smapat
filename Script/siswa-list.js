import supabase from '../Supabase/client.js';

let siswaData = [];
let kelasList = [];
let userRole = null;

// Fetch user role and show "Tambah" button if allowed
async function checkRole() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { data } = await supabase.from('akun').select('role').eq('id', session.user.id).single();
  userRole = data?.role;
  if (userRole === 'admin' || userRole === 'guru') {
    document.getElementById('btn-tambah-siswa').style.display = 'inline-block';
  }
}

// Fetch kelas list for dropdown
async function loadKelas() {
  const { data } = await supabase.from('kelas').select('id, nama').order('nama');
  kelasList = data || [];
  const kelasInput = document.getElementById('kelas-input');
  kelasInput.innerHTML = '<option value="">Pilih Kelas</option>' +
    kelasList.map(k => `<option value="${k.id}">${k.nama}</option>`).join('');
}

// Fetch siswa data with kelas join
async function loadSiswa() {
  const { data } = await supabase
    .from('siswa')
    .select('id, nama, nis, nisn, jk, kelas:kelas_id(nama)')
    .order('nama');
  siswaData = data || [];
  renderSiswaTable();
}

// Render table rows
function renderSiswaTable(filter = '', sort = 'nama') {
  let rows = siswaData;
  if (filter) {
    const f = filter.toLowerCase();
    rows = rows.filter(s =>
      s.nama.toLowerCase().includes(f) ||
      s.nis?.toLowerCase().includes(f) ||
      s.nisn?.toLowerCase().includes(f)
    );
  }
  rows = [...rows].sort((a, b) => (a[sort] || '').localeCompare(b[sort] || ''));
  document.getElementById('siswa-body').innerHTML = rows.map(s => `
    <tr>
      <td>${s.nama}</td>
      <td>${s.kelas?.nama || '-'}</td>
      <td>${s.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
      <td>${s.nis}</td>
      <td>${s.nisn}</td>
      <td><a href="rapor.html?id=${s.id}">Lihat</a></td>
    </tr>
  `).join('');
}

// Modal logic
document.getElementById('btn-tambah-siswa').onclick = () => {
  document.getElementById('modal-tambah-siswa').classList.add('open');
};
document.getElementById('close-modal').onclick = () => {
  document.getElementById('modal-tambah-siswa').classList.remove('open');
};

// Form submit
document.getElementById('form-tambah-siswa').onsubmit = async (e) => {
  e.preventDefault();
  const nama = document.getElementById('nama-input').value.trim();
  const kelas_id = document.getElementById('kelas-input').value;
  const jk = document.getElementById('jk-input').value;
  const nis = document.getElementById('nis-input').value.trim();
  const nisn = document.getElementById('nisn-input').value.trim();
  if (!nama || !kelas_id || !jk || !nis || !nisn) {
    alert('Semua field wajib diisi!');
    return;
  }
  const { error } = await supabase.from('siswa').insert({ nama, kelas_id, jk, nis, nisn });
  if (error) {
    alert('Gagal menambah siswa: ' + error.message);
    return;
  }
  document.getElementById('modal-tambah-siswa').classList.remove('open');
  await loadSiswa();
};

// Search & sort
document.getElementById('search-siswa').oninput = debounce(function () {
  renderSiswaTable(this.value, document.getElementById('sort-siswa').value);
}, 300);
document.getElementById('sort-siswa').onchange = function () {
  renderSiswaTable(document.getElementById('search-siswa').value, this.value);
};

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// Init
checkRole();
loadKelas();
loadSiswa();