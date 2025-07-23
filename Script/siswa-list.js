  import supabase from '../Supabase/client.js';

let siswaData = [];
let kelasList = [];
let userRole = null;
// Sorting state
let currentSort = { key: 'nama', dir: 'asc' };

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
  const { data, error } = await supabase
    .from('siswa')
    .select('id, nama, nis, nisn, jk, kelas_id, kelas(*)')
    .order('nama');
  if (error) {
    console.error('Error fetching siswa data:', error);
  } else {
    console.log('Fetched siswa data:', data);
  }
  siswaData = data || [];
  renderSiswaTable(document.getElementById('search-siswa')?.value || '', currentSort);
}

// Update table header to show only one arrow for the active sort column
function updateSortArrows() {
  document.querySelectorAll('.sort-arrows').forEach(span => {
    const key = span.getAttribute('data-sort');
    if (key === currentSort.key) {
      span.textContent = currentSort.dir === 'asc' ? '▲' : '▼';
      span.classList.add('active');
    } else {
      span.textContent = '';
      span.classList.remove('active');
    }
  });
}

// Render table rows with improved sorting
function renderSiswaTable(filter = '', sortObj = currentSort) {
  let rows = siswaData;
  if (filter) {
    const f = filter.toLowerCase();
    rows = rows.filter(s =>
      s.nama.toLowerCase().includes(f) ||
      s.nis?.toLowerCase().includes(f) ||
      s.nisn?.toLowerCase().includes(f)
    );
  }
  // Sorting
  rows = [...rows].sort((a, b) => {
    let aVal = a[sortObj.key];
    let bVal = b[sortObj.key];
    // For kelas, sort by kelas.nama
    if (sortObj.key === 'kelas') {
      aVal = a.kelas?.nama || '';
      bVal = b.kelas?.nama || '';
    }
    // For jk, sort by string value
    if (sortObj.key === 'jk') {
      aVal = a.jk === 'L' ? 'Laki-laki' : 'Perempuan';
      bVal = b.jk === 'L' ? 'Laki-laki' : 'Perempuan';
    }
    if (aVal === undefined) aVal = '';
    if (bVal === undefined) bVal = '';
    return sortObj.dir === 'asc'
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal);
  });
  document.getElementById('siswa-body').innerHTML = rows.map(s => `
    <tr>
      <td>${s.nama}</td>
      <td>${s.kelas?.nama || '-'}</td>
      <td>${s.jk}</td>
      <td>${s.nis}</td>
      <td>${s.nisn}</td>
      <td>
        <div class="action-buttons">
          <a href="rapor.html?id=${s.id}" class="btn-view" aria-label="Lihat Rapor ${s.nama}" title="Lihat Rapor ${s.nama}">
            <i class="bx bx-show"></i><span class="sr-only">Lihat</span>
          </a>
          ${(userRole === 'admin' || userRole === 'guru') ? `
            <button class="btn-edit" data-id="${s.id}" aria-label="Edit ${s.nama}" title="Edit">
              <i class="bx bx-edit"></i><span class="sr-only">Edit</span>
            </button>
            <button class="btn-delete" data-id="${s.id}" aria-label="Hapus ${s.nama}" title="Hapus">
              <i class="bx bx-trash"></i><span class="sr-only">Hapus</span>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
  updateSortArrows();
  attachRowButtonEvents();
}

// Attach Edit/Delete events after rendering
function attachRowButtonEvents() {
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      try {
        const { data } = await supabase.from('siswa').select('*').eq('id', id).single();
        if (data) {
          // Populate edit modal form
          document.getElementById('edit-nama-input').value = data.nama;
          document.getElementById('edit-kelas-select').value = data.kelas_id;
          document.getElementById('edit-jk-input').value = data.jk;
          document.getElementById('edit-nis-input').value = data.nis;
          document.getElementById('edit-nisn-input').value = data.nisn;
          // Show edit modal
          document.getElementById('modal-edit-siswa').classList.remove('hidden');
          document.getElementById('modal-edit-siswa').classList.add('open');
          // Hide add modal if open
          document.getElementById('modal-tambah-siswa').classList.add('hidden');
          document.getElementById('form-edit-siswa').dataset.editId = id;
        }
      } catch (error) {
        console.error('Error showing edit modal:', error);
        alert('Gagal membuka form edit. Silakan coba lagi.');
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

function generateUUID() {
  // Simple UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Form submit (Add)
document.getElementById("form-tambah-siswa").onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const siswaData = Object.fromEntries(formData.entries());
  siswaData.id = generateUUID();
  const result = await supabase.from("siswa").insert([siswaData]);
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

// Form submit (Edit)
document.getElementById("form-edit-siswa").onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const siswaData = Object.fromEntries(formData.entries());
  const editId = e.target.dataset.editId;
  if (!editId) {
    alert("ID siswa tidak ditemukan.");
    return;
  }
  const result = await supabase.from("siswa").update(siswaData).eq('id', editId);
  if (result.error) {
    alert("Gagal mengupdate data siswa: " + result.error.message);
    console.error(result.error);
  } else {
    alert("Siswa berhasil diupdate.");
    document.getElementById("modal-edit-siswa").classList.add("hidden");
    resetEditForm();
    await loadSiswa();
  }
};

// Search
document.getElementById('search-siswa').oninput = debounce(function () {
  renderSiswaTable(this.value, currentSort);
}, 300);

const sortDropdown = document.getElementById('sort-dropdown');

sortDropdown.onchange = function() {
  const [key, dir] = this.value.split('-');
  currentSort = { key, dir };
  renderSiswaTable(document.getElementById('search-siswa').value, currentSort);
};

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

