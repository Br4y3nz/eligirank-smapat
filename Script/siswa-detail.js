import supabase from '../Supabase/client.js';

const urlParams = new URLSearchParams(window.location.search);
const currentSiswaId = urlParams.get('id') || null;
const currentSemester = parseInt(urlParams.get('semester')) || 1;

const userRole = localStorage.getItem('user_role');

function isAuthorized() {
  return userRole === 'admin' || userRole === 'guru';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (currentSiswaId) {
    document.querySelectorAll('a[href^="data-siswa2.html"]').forEach(link => {
      const baseUrl = link.getAttribute('href').split('?')[0];
      link.setAttribute('href', `${baseUrl}?id=${currentSiswaId}&semester=${currentSemester}`);
    });
  }

  await loadStudentInfo();
  await populateMapelSelects();
  await loadCurrentRapor();
  syncSemesterDropdown();
  attachModalListeners();

  if (!isAuthorized()) {
    document.getElementById('btn-add-mapel')?.remove();
    const aksiHeader = document.querySelector('th.action-header');
    aksiHeader?.remove();
  }
});

function syncSemesterDropdown() {
  const semSelect = document.getElementById('semester-select');
  if (!semSelect) return;

  const semesterStr = currentSemester.toString();
  const optionExists = Array.from(semSelect.options).some(opt => opt.value === semesterStr);

  semSelect.value = optionExists ? semesterStr : semSelect.options[0].value;

  semSelect.addEventListener('change', e => {
    const newSemester = parseInt(e.target.value);
    if (!isNaN(newSemester) && currentSiswaId) {
      window.location.href = `data-siswa2.html?id=${currentSiswaId}&semester=${newSemester}`;
    }
  });
}

function attachModalListeners() {
  const btnAdd = document.getElementById('btn-add-mapel');
  const formAdd = document.getElementById('form-add-mapel');
  const formEdit = document.getElementById('form-edit-mapel');

  btnAdd?.addEventListener('click', openAddModal);

  document.getElementById('btn-cancel-add')?.addEventListener('click', closeModal('modal-add-mapel'));
  document.getElementById('btn-cancel-edit')?.addEventListener('click', closeModal('modal-edit-mapel'));
  document.getElementById('btn-close-add')?.addEventListener('click', closeModal('modal-add-mapel'));
  document.getElementById('btn-close-edit')?.addEventListener('click', closeModal('modal-edit-mapel'));

  formAdd?.addEventListener('submit', handleAddSubmit);
  formEdit?.addEventListener('submit', handleEditSubmit);
}

function closeModal(modalId) {
  return () => {
    const modal = document.getElementById(modalId);
    modal?.classList.add('hidden');
    modal?.setAttribute('aria-hidden', 'true');
  };
}

async function openAddModal() {
  await populateMapelSelects();
  const modal = document.getElementById('modal-add-mapel');
  const form = document.getElementById('form-add-mapel');
  const infoText = document.getElementById('form-info-text');

  const siswaInput = document.getElementById('add-siswa-id');
  const semesterInput = document.getElementById('add-semester');

  form.reset();
  siswaInput.value = currentSiswaId;
  semesterInput.value = currentSemester;

  const nama = document.getElementById('student-name')?.textContent || '';
  const kelas = document.getElementById('student-class')?.textContent || '';
  infoText.innerHTML = `Data akan disimpan ke <strong>Semester ${currentSemester}</strong> untuk siswa <strong>${nama}</strong> (${kelas})`;

  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

async function handleAddSubmit(e) {
  e.preventDefault();

  const siswa_id = document.getElementById('add-siswa-id').value;
  const mapel_id = document.getElementById('add-mapel-select').value;
  const nilai = parseFloat(document.getElementById('add-mapel-nilai').value);
  const semester = parseInt(document.getElementById('add-semester').value);

  if (!mapel_id || isNaN(nilai) || nilai < 0 || nilai > 100 || isNaN(semester)) {
    alert('Pastikan semua field valid.');
    return;
  }

  const { error } = await supabase.from('rapor').insert([{ siswa_id, mapel_id, nilai, semester }]);
  if (error) return alert('Gagal menambahkan.');

  closeModal('modal-add-mapel')();
  await loadCurrentRapor();
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const raporId = form.dataset.raporId;

  const mapel_id = document.getElementById('edit-mapel-select').value;
  const nilai = parseFloat(document.getElementById('edit-mapel-nilai').value);

  if (!mapel_id || isNaN(nilai) || nilai < 0 || nilai > 100) {
    alert('Pastikan semua field valid.');
    return;
  }

  const { error } = await supabase.from('rapor').update({ mapel_id, nilai }).eq('id', raporId);
  if (error) return alert('Gagal mengupdate.');

  closeModal('modal-edit-mapel')();
  await loadCurrentRapor();
}

async function populateMapelSelects() {
  const { data: options } = await supabase.from('mapel').select('id, nama').order('nama');
  const selects = ['add-mapel-select', 'edit-mapel-select'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    options?.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.id;
      option.textContent = opt.nama;
      select.appendChild(option);
    });
  });
}

async function loadCurrentRapor() {
  if (!currentSiswaId) return;
  const { data, error } = await supabase
    .from('rapor')
    .select('*, mapel(nama)')
    .eq('siswa_id', currentSiswaId)
    .eq('semester', currentSemester);
  if (error) return alert('Gagal mengambil rapor.');
  tampilkanRapor(data);
}

function tampilkanRapor(data = []) {
  const thead = document.querySelector('.rapor-table thead tr');
  if (thead) {
    if (!isAuthorized()) {
      const aksiTh = thead.querySelector('th.action-header');
      aksiTh?.remove();
    }
  }

  const tbody = document.getElementById('tabel-rapor');
  tbody.innerHTML = '';
  let total = 0;

  data.forEach(item => {
    const tr = document.createElement('tr');
    const grade = konversiGrade(item.nilai);
    const gradeClass = `grade-${grade.replace('+', 'plus').replace('-', 'minus')}`;

    tr.innerHTML = `
      <td>${item.mapel?.nama || '-'}</td>
      <td>${item.nilai}</td>
      <td class="${gradeClass}">${grade}</td>
      ${isAuthorized() ? `<td>
        <button class="btn-edit-mapel" data-id="${item.id}"><i class='bx bx-edit'></i></button>
        <button class="btn-delete-mapel" data-id="${item.id}"><i class='bx bx-trash'></i></button>
      </td>` : ''}
    `;

    tbody.appendChild(tr);
    total += item.nilai;
  });

  document.getElementById('rata-rata-unique').textContent = (total / data.length || 0).toFixed(2);
  attachMapelRowEvents();
}

function konversiGrade(nilai) {
  if (nilai >= 98) return 'A+';
  if (nilai >= 94) return 'A';
  if (nilai >= 90) return 'A-';
  if (nilai >= 86) return 'B+';
  if (nilai >= 82) return 'B';
  if (nilai >= 78) return 'B-';
  if (nilai >= 74) return 'C+';
  if (nilai >= 70) return 'C';
  if (nilai >= 66) return 'C-';
  if (nilai >= 50) return 'D';
  return 'F';
}

function attachMapelRowEvents() {
  if (!isAuthorized()) return;

  document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
    btn.onclick = async () => {
      const raporId = btn.dataset.id;
      const { data } = await supabase.from('rapor').select('*').eq('id', raporId).single();
      const form = document.getElementById('form-edit-mapel');

      await populateMapelSelects();

      form.dataset.raporId = raporId;
      document.getElementById('edit-mapel-select').value = data.mapel_id;
      document.getElementById('edit-mapel-nilai').value = data.nilai;

      const modal = document.getElementById('modal-edit-mapel');
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    };
  });

  document.querySelectorAll('.btn-delete-mapel').forEach(btn => {
    btn.onclick = async () => {
      const raporId = btn.dataset.id;
      if (confirm('Yakin ingin menghapus data ini?')) {
        await supabase.from('rapor').delete().eq('id', raporId);
        await loadCurrentRapor();
      }
    };
  });
}

async function loadStudentInfo() {
  const { data: siswa } = await supabase.from('siswa').select('nama, kelas_id').eq('id', currentSiswaId).single();
  if (!siswa) return;

  const namaElem = document.getElementById('student-name');
  const kelasElem = document.getElementById('student-class');

  namaElem.textContent = siswa.nama || '-';

  if (siswa.kelas_id) {
    const { data: kelas } = await supabase.from('kelas').select('nama').eq('id', siswa.kelas_id).single();
    kelasElem.textContent = kelas?.nama || '-';
  } else {
    kelasElem.textContent = '-';
  }
}
