import supabase from '../Supabase/client.js';

const urlParams = new URLSearchParams(window.location.search);
const currentSiswaId = urlParams.get('id') || null;

let currentSemester = 1;

async function loadMapelOptions() {
  const { data: mapelOptions, error } = await supabase
    .from('mapel')
    .select('id, nama')
    .order('nama', { ascending: true });
  if (error) {
    console.error('Failed to fetch mapel options:', error);
    return [];
  }
  return mapelOptions || [];
}

async function populateMapelSelects() {
  const mapelOptions = await loadMapelOptions();
  const addSelect = document.getElementById('add-mapel-select');
  const editSelect = document.getElementById('edit-mapel-select');
  if (addSelect) {
    addSelect.innerHTML = '';
    mapelOptions.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.nama;
      addSelect.appendChild(option);
    });
  }
  if (editSelect) {
    editSelect.innerHTML = '';
    mapelOptions.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.nama;
      editSelect.appendChild(option);
    });
  }
}

async function loadCurrentRapor() {
  if (!currentSiswaId) return;
  const { data: rapor, error } = await supabase
    .from('rapor')
    .select('*, mapel(nama)')
    .eq('siswa_id', currentSiswaId)
    .eq('semester', currentSemester);
  if (error) {
    alert('Gagal mengambil data rapor.');
    console.error(error);
    return;
  }
  tampilkanRapor(rapor || []);
}

function tampilkanRapor(data) {
  const tbody = document.getElementById('tabel-rapor');
  tbody.innerHTML = '';

  let total = 0;

  data.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.mapel?.nama || '-'}</td>
      <td>${item.nilai}</td>
      <td>${konversiGrade(item.nilai)}</td>
      <td>
        <button class="btn-edit-mapel" data-id="${item.id}" aria-label="Edit Mapel">
          <i class='bx bx-edit'></i>
        </button>
        <button class="btn-delete-mapel" data-id="${item.id}" aria-label="Hapus Mapel">
          <i class='bx bx-trash'></i>
        </button>
      </td>
    `;
    total += item.nilai;
    tbody.appendChild(tr);
  });

  const rata2 = data.length > 0 ? total / data.length : 0;
  const rataElem = document.getElementById('rata-rata-unique');
  if (rataElem) {
    rataElem.textContent = rata2.toFixed(2);
  }

  attachMapelRowEvents();
}

function konversiGrade(nilai) {
  if (nilai >= 98) return 'A+';
  if (nilai >= 94) return 'A';
  if (nilai >= 90) return 'A–';
  if (nilai >= 86) return 'B+';
  if (nilai >= 82) return 'B';
  if (nilai >= 78) return 'B–';
  if (nilai >= 74) return 'C+';
  if (nilai >= 70) return 'C';
  if (nilai >= 66) return 'C–';
  if (nilai >= 50) return 'D';
  return 'F';
}

function attachMapelRowEvents() {
  document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
    btn.onclick = async () => {
      const raporId = btn.dataset.id;
      if (!raporId) return;

      // Fetch rapor data
      const { data, error } = await supabase
        .from('rapor')
        .select('*')
        .eq('id', raporId)
        .single();
      if (error || !data) {
        alert('Gagal mengambil data rapor untuk diedit.');
        return;
      }

      // Populate edit modal form
      const editModal = document.getElementById('modal-edit-mapel');
      const form = document.getElementById('form-edit-mapel');
      if (!editModal || !form) return;

      await populateMapelSelects();

      form.dataset.raporId = raporId;

      const selectMapel = document.getElementById('edit-mapel-select');
      const inputNilai = document.getElementById('edit-mapel-nilai');
      const selectSemester = document.getElementById('edit-semester-select');

      if (selectMapel) selectMapel.value = data.mapel_id || '';
      if (inputNilai) inputNilai.value = data.nilai || '';
      if (selectSemester) selectSemester.value = data.semester || '1';

      editModal.classList.remove('hidden');
      editModal.setAttribute('aria-hidden', 'false');
    };
  });

  document.querySelectorAll('.btn-delete-mapel').forEach(btn => {
    btn.onclick = async () => {
      const raporId = btn.dataset.id;
      if (!raporId) return;
      if (!confirm('Yakin ingin menghapus data mapel ini?')) return;

      const { error } = await supabase.from('rapor').delete().eq('id', raporId);
      if (error) {
        alert('Gagal menghapus data mapel.');
        console.error(error);
      } else {
        alert('Data mapel berhasil dihapus.');
        await loadCurrentRapor();
      }
    };
  });
}

document.getElementById('semester-select').addEventListener('change', async e => {
  currentSemester = parseInt(e.target.value);
  await loadCurrentRapor();
});

document.getElementById('btn-add-mapel').addEventListener('click', async () => {
  await populateMapelSelects();
  const addModal = document.getElementById('modal-add-mapel');
  if (!addModal) return;
  addModal.classList.remove('hidden');
  addModal.setAttribute('aria-hidden', 'false');

  // Reset add form
  const formAdd = document.getElementById('form-add-mapel');
  if (formAdd) {
    formAdd.reset();
  }
});

document.getElementById('btn-cancel-add').addEventListener('click', () => {
  const addModal = document.getElementById('modal-add-mapel');
  if (!addModal) return;
  addModal.classList.add('hidden');
  addModal.setAttribute('aria-hidden', 'true');
});

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
  const editModal = document.getElementById('modal-edit-mapel');
  if (!editModal) return;
  editModal.classList.add('hidden');
  editModal.setAttribute('aria-hidden', 'true');
});

document.getElementById('form-add-mapel').addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentSiswaId) {
    alert('ID siswa tidak ditemukan.');
    return;
  }
  const mapelId = document.getElementById('add-mapel-select').value;
  const nilai = parseFloat(document.getElementById('add-mapel-nilai').value);
  const semester = parseInt(document.getElementById('add-semester-select').value);

  if (!mapelId) {
    alert('Pilih mapel.');
    return;
  }
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    alert('Nilai harus antara 0 dan 100.');
    return;
  }
  if (isNaN(semester) || semester < 1 || semester > 6) {
    alert('Semester tidak valid.');
    return;
  }

  const { error } = await supabase.from('rapor').insert([{
    siswa_id: currentSiswaId,
    mapel_id: mapelId,
    nilai,
    semester
  }]);
  if (error) {
    alert('Gagal menambahkan data rapor.');
    console.error(error);
  } else {
    alert('Data rapor berhasil ditambahkan.');
    const addModal = document.getElementById('modal-add-mapel');
    if (addModal) {
      addModal.classList.add('hidden');
      addModal.setAttribute('aria-hidden', 'true');
    }
    await loadCurrentRapor();
  }
});

document.getElementById('form-edit-mapel').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const raporId = form.dataset.raporId;
  if (!raporId) {
    alert('ID rapor tidak ditemukan.');
    return;
  }
  const mapelId = document.getElementById('edit-mapel-select').value;
  const nilai = parseFloat(document.getElementById('edit-mapel-nilai').value);
  const semester = parseInt(document.getElementById('edit-semester-select').value);

  if (!mapelId) {
    alert('Pilih mapel.');
    return;
  }
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    alert('Nilai harus antara 0 dan 100.');
    return;
  }
  if (isNaN(semester) || semester < 1 || semester > 6) {
    alert('Semester tidak valid.');
    return;
  }

  const { error } = await supabase.from('rapor').update({
    mapel_id: mapelId,
    nilai,
    semester
  }).eq('id', raporId);

  if (error) {
    alert('Gagal mengupdate data rapor.');
    console.error(error);
  } else {
    alert('Data rapor berhasil diupdate.');
    const editModal = document.getElementById('modal-edit-mapel');
    if (editModal) {
      editModal.classList.add('hidden');
      editModal.setAttribute('aria-hidden', 'true');
    }
    await loadCurrentRapor();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!currentSiswaId) {
    alert('ID siswa tidak ditemukan di URL.');
    return;
  }
  await loadCurrentRapor();
  await populateMapelSelects();

  // Load student info for info box
  const { data: siswa, error } = await supabase
    .from('siswa')
    .select('nama, kelas_id')
    .eq('id', currentSiswaId)
    .single();

  if (error || !siswa) {
    console.error('Gagal mengambil data siswa:', error);
    return;
  }

  const namaElem = document.getElementById('student-name');
  const kelasElem = document.getElementById('student-class');

  if (namaElem) namaElem.textContent = siswa.nama || '-';

  if (kelasElem) {
    if (siswa.kelas_id) {
      const { data: kelasData, error: kelasError } = await supabase
        .from('kelas')
        .select('nama')
        .eq('id', siswa.kelas_id)
        .single();
      if (kelasError || !kelasData) {
        console.error('Gagal mengambil data kelas:', kelasError);
        kelasElem.textContent = '-';
      } else {
        kelasElem.textContent = kelasData.nama || '-';
      }
    } else {
      kelasElem.textContent = '-';
    }
  }
});

