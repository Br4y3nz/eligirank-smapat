import supabase from '../Supabase/client.js';

let siswaData = [];
let kelasList = [];
let userRole = null;
let currentSort = 'nama';

// Fetch user role and show "Tambah Siswa" button if allowed
async function checkRole() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log('No active session found');
    return;
  }
  const userId = session.user.id;
  console.log('Current userId:', userId);
  // Use .single() to ensure you get an object, not an array
  const { data, error } = await supabase
    .from('akun')
    .select('role')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching role:', error);
    return;
  }
  if (!data) {
    console.warn('No role data found for user:', userId);
    return;
  }
  userRole = data.role;
  if (userRole === 'admin' || userRole === 'guru') {
    document.getElementById('btn-tambah-siswa').style.display = 'inline-block';
  }
}

// Show modal when "Tambah Siswa" is clicked
document.getElementById("btn-tambah-siswa").onclick = () => {
  resetForm();
  const modal = document.getElementById("modal-tambah-siswa");
  modal.classList.remove("hidden");
  modal.classList.add("open");
};

// Hide modal when "Batal" is clicked
document.getElementById("batal-tambah").onclick = () => {
  const modal = document.getElementById("modal-tambah-siswa");
  modal.classList.remove("open");
  modal.classList.add("hidden");
  resetForm();
};

// Populate kelas select
async function loadKelas() {
  const { data } = await supabase.from("kelas").select("id, nama, tingkat");
  const select = document.getElementById("kelas-select");
  select.innerHTML = '<option value="">Pilih Kelas</option>';
  if (data) {
    data.forEach(k => {
      const option = document.createElement("option");
      option.value = k.id;
      option.textContent = k.tingkat ? `${k.tingkat} ${k.nama}` : k.nama;
      select.appendChild(option);
    });
  }
}
loadKelas();

// Fetch siswa data with kelas join
async function loadSiswa() {
  const { data } = await supabase
    .from('siswa')
    .select('id, nama, nis, nisn, jk, kelas_id, kelas:kelas_id(nama)')
    .order('nama');
  siswaData = data || [];
  renderSiswaTable(document.getElementById('search-siswa')?.value || '', currentSort);
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
      <td>
        <a href="rapor.html?id=${s.id}">Lihat</a>
        ${userRole === 'admin' || userRole === 'guru' ? `
          <button class="btn-edit" data-id="${s.id}">Edit</button>
          <button class="btn-delete" data-id="${s.id}">Hapus</button>
        ` : ''}
      </td>
    </tr>
  `).join('');
  attachRowButtonEvents();
}

// Attach Edit/Delete events after rendering
function attachRowButtonEvents() {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      const { data } = await supabase.from('siswa').select('*').eq('id', id).single();
      if (data) {
        document.getElementById('nama-input').value = data.nama;
        document.getElementById('kelas-select').value = data.kelas_id;
        document.getElementById('jk-input').value = data.jk;
        document.getElementById('nis-input').value = data.nis;
        document.getElementById('nisn-input').value = data.nisn;
        document.getElementById('modal-tambah-siswa').classList.remove('hidden');
        document.getElementById('form-tambah-siswa').dataset.editId = id;
      }
    };
  });
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      if (confirm('Yakin ingin menghapus siswa ini?')) {
        const { error } = await supabase.from('siswa').delete().eq('id', id);
        if (error) {
          alert('Gagal menghapus siswa.');
        } else {
          alert('Siswa dihapus.');
          await loadSiswa();
        }
      }
    };
  });
}

// Form submit (Add/Edit)
document.getElementById("form-tambah-siswa").onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const siswaData = Object.fromEntries(formData.entries());
  const editId = e.target.dataset.editId;
  let result;
  if (editId) {
    result = await supabase.from("siswa").update(siswaData).eq('id', editId);
    delete e.target.dataset.editId;
  } else {
    result = await supabase.from("siswa").insert([siswaData]);
  }
  if (result.error) {
    alert("Gagal menyimpan data siswa: " + result.error.message);
    console.error(result.error);
  } else {
    alert("Siswa berhasil disimpan.");
    document.getElementById("modal-tambah-siswa").classList.add("hidden");
    resetForm();
    await loadSiswa();
  }
};

// Search
document.getElementById('search-siswa').oninput = debounce(function () {
  renderSiswaTable(this.value, currentSort);
}, 300);

// Sort by clicking header arrows
document.querySelectorAll('.sort-arrows').forEach(span => {
  span.onclick = function() {
    currentSort = this.getAttribute('data-sort');
    renderSiswaTable(document.getElementById('search-siswa').value, currentSort);
    document.querySelectorAll('.sort-arrows').forEach(s => s.classList.remove('active'));
    this.classList.add('active');
  };
});

// Debounce helper
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// Reset form fields and editId
function resetForm() {
  document.getElementById('form-tambah-siswa').reset();
  delete document.getElementById('form-tambah-siswa').dataset.editId;
}

// Init
checkRole();
loadKelas();
loadSiswa();
supabase.auth.getSession().then(console.log);