import supabase from '../Supabase/client.js';

async function getUserRoleAndId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { role: null, id: null };
  }
  const userId = session.user.id;
  const { data, error } = await supabase
    .from('akun')
    .select('role')
    .eq('id', userId)
    .single();
  if (error || !data) {
    return { role: null, id: userId };
  }
  return { role: data.role, id: userId };
}

function konversiGrade(nilai) {
  if (nilai >= 98) return "A+";
  if (nilai >= 94) return "A";
  if (nilai >= 90) return "A–";
  if (nilai >= 86) return "B+";
  if (nilai >= 82) return "B";
  if (nilai >= 78) return "B–";
  if (nilai >= 74) return "C+";
  if (nilai >= 70) return "C";
  if (nilai >= 66) return "C–";
  if (nilai >= 50) return "D";
  return "F";
}

function tampilkanRapor(data) {
  const tbody = document.getElementById("tabel-rapor");
  tbody.innerHTML = "";

  let total = 0;

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.mapel?.nama || '-'}</td>
      <td>${item.nilai}</td>
      <td>${konversiGrade(item.nilai)}</td>
      <td>
        <button class="btn-edit-mapel" data-id="${item.id}" data-mapel-id="${item.mapel_id}" data-semester="${item.semester}" aria-label="Edit Mapel">
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
  const rataElem = document.getElementById("rata-rata-unique");
  if (rataElem) {
    rataElem.textContent = rata2.toFixed(2);
    const rataContainer = document.getElementById("rata-rata-unique-container");
    if (rataContainer) {
      rataContainer.classList.add("rapor-ratarata-box");
    }
  }

  attachMapelRowEvents();
}

function attachMapelRowEvents() {
  document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
    btn.onclick = function() {
      const id = this.dataset.id;
      const mapelId = this.dataset.mapelId;
      const semester = this.dataset.semester;

      // Show edit modal and populate fields
      const editModal = document.getElementById('modal-edit-mapel');
      if (!editModal) {
        alert("Edit modal tidak ditemukan.");
        return;
      }
      editModal.classList.remove('hidden');
      editModal.setAttribute('aria-hidden', 'false');

      // Set dataset for form to use on submit
      const formEditMapel = document.getElementById('form-edit-mapel');
      formEditMapel.dataset.mapelId = mapelId;
      formEditMapel.dataset.semester = semester;
      formEditMapel.dataset.raporId = id;

      // Optionally, fetch current nilai to populate input
      // For simplicity, assume nilai is in a data attribute or fetch from table row
      // Here, just clear input
      const nilaiInput = document.getElementById('edit-mapel-nilai');
      if (nilaiInput) nilaiInput.value = '';

      // Focus input
      nilaiInput.focus();
    };
  });

  document.querySelectorAll('.btn-delete-mapel').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      if (!confirm("Yakin ingin menghapus mapel ini?")) return;
      const { error } = await supabase.from('rapor').delete().eq('id', id);
      if (error) {
        alert("Gagal menghapus data mapel.");
        console.error(error);
      } else {
        alert("Data mapel berhasil dihapus.");
        loadCurrentRapor();
      }
    };
  });
}

const urlParams = new URLSearchParams(window.location.search);
const siswaIdFromUrl = urlParams.get('id');

let currentSiswaId = siswaIdFromUrl || null;
let currentSemester = 1;

async function loadCurrentRapor() {
  if (!currentSiswaId) return;
  const { data: rapor, error } = await supabase
    .from('rapor')
    .select('*, mapel(nama)')
    .eq('siswa_id', currentSiswaId)
    .eq('semester', currentSemester);
  if (error) {
    alert("Gagal mengambil data rapor.");
    console.error(error);
    return;
  }
  tampilkanRapor(rapor || []);
}

document.getElementById('semester-select').addEventListener('change', async (e) => {
  currentSemester = parseInt(e.target.value);
  await loadCurrentRapor();
});

const btnAddMapel = document.getElementById('btn-add-mapel');
if (btnAddMapel) {
  btnAddMapel.addEventListener('click', async () => {
    console.log("Add Mapel button clicked");
    const siswaId = new URLSearchParams(window.location.search).get('id');
    if (!siswaId) {
      alert("ID siswa tidak ditemukan.");
      return;
    }

    // Fetch mapel options from supabase
    const { data: mapelOptions, error: mapelError } = await supabase
      .from('mapel')
      .select('id, nama')
      .order('nama', { ascending: true });
    if (mapelError) {
      console.error("Failed to fetch mapel:", mapelError);
      alert("Gagal mengambil daftar mapel.");
      return;
    }
    if (!mapelOptions || mapelOptions.length === 0) {
      alert("Daftar mapel kosong.");
      return;
    }

    // Populate add modal select options
    const addMapelSelect = document.getElementById('add-mapel-select');
    addMapelSelect.innerHTML = '';
    mapelOptions.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = m.nama;
      addMapelSelect.appendChild(option);
    });

    // Show add modal by removing hidden class and setting display flex
    const addModal = document.getElementById('modal-add-mapel');
    console.log("Modal innerHTML before showing:", addModal.innerHTML);
    addModal.classList.remove('hidden');
    addModal.setAttribute('aria-hidden', 'false');

    // Clear previous form inputs and errors
    document.getElementById('form-add-mapel').reset();
    clearAddFormErrors();
  });
}

document.getElementById('btn-cancel-add').addEventListener('click', () => {
  const addModal = document.getElementById('modal-add-mapel');
  addModal.classList.add('hidden');
  addModal.setAttribute('aria-hidden', 'true');
});

// Add form submit handler for adding mapel
document.getElementById('form-add-mapel').onsubmit = async (e) => {
  e.preventDefault();
  clearAddFormErrors();

  const mapelId = document.getElementById('add-mapel-select').value;
  const nilaiInput = document.getElementById('add-mapel-nilai');
  const nilai = parseInt(nilaiInput.value);

  let valid = true;
  if (!mapelId) {
    showAddFormError('add-mapel-select-error', 'Pilih mapel.');
    valid = false;
  }
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    showAddFormError('add-mapel-nilai-error', 'Nilai harus antara 0 dan 100.');
    valid = false;
  }
  if (!valid) return;

  if (!currentSiswaId) {
    alert("ID siswa tidak ditemukan.");
    return;
  }

  const { error } = await supabase.from('rapor').insert([{ siswa_id: currentSiswaId, semester: currentSemester, mapel_id: mapelId, nilai }]);
  if (error) {
    alert("Gagal menambahkan data mapel.");
    console.error(error);
  } else {
    alert("Data mapel berhasil ditambahkan.");
    loadCurrentRapor();
    // Hide add modal
    const addModal = document.getElementById('modal-add-mapel');
    addModal.classList.add('hidden');
    addModal.setAttribute('aria-hidden', 'true');
  }
};

function clearAddFormErrors() {
  document.getElementById('add-mapel-select-error').textContent = '';
  document.getElementById('add-mapel-nilai-error').textContent = '';
};
function showAddFormError(id, message) {
  const elem = document.getElementById(id);
  if (elem) elem.textContent = message;
};

// Add form submit handler for editing mapel nilai
const formEditMapel = document.getElementById('form-edit-mapel');
if (formEditMapel) {
  formEditMapel.addEventListener('submit', async (e) => {
    e.preventDefault();

    const siswaId = currentSiswaId;
    const mapelId = formEditMapel.dataset.mapelId;
    const semester = formEditMapel.dataset.semester;
    const raporId = formEditMapel.dataset.raporId;
    const updatedNilai = document.getElementById('edit-mapel-nilai').value;
    const nilai = parseInt(updatedNilai);

    if (!mapelId || !semester || !raporId) {
      console.error("Missing mapelId, semester, or raporId in form dataset");
      return;
    }
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert("Nilai tidak valid.");
      return;
    }

    const { error } = await supabase
      .from('rapor')
      .update({ nilai })
      .eq('id', raporId)
      .eq('siswa_id', siswaId)
      .eq('mapel_id', mapelId)
      .eq('semester', semester);

    if (error) {
      alert("Gagal update nilai.");
      console.error(error);
    } else {
      alert("Nilai berhasil diupdate.");
      // Hide edit modal
      const editModal = document.getElementById('modal-edit-mapel');
      editModal.classList.add('hidden');
      editModal.setAttribute('aria-hidden', 'true');
      loadCurrentRapor();
    }
  });
}

async function loadRapor(siswaId) {
  const currentSemester = 1; // You can adjust this or make dynamic

  const { data: siswa, error: siswaError } = await supabase
    .from("siswa")
    .select("*")
    .eq("id", siswaId)
    .single();

  if (siswaError || !siswa) {
    console.error("Error fetching siswa:", siswaError);
    alert("Data siswa tidak ditemukan.");
    return;
  }

  const { data: rapor, error: raporError } = await supabase
    .from("rapor")
    .select("*")
    .eq("siswa_id", siswaId)
    .eq("semester", currentSemester);

  if (raporError) {
    console.error("Error fetching rapor:", raporError);
    alert("Gagal mengambil data rapor.");
    return;
  }

  // Check if elements exist before setting textContent
  const namaElem = document.getElementById("student-name");
  if (namaElem) {
    namaElem.textContent = siswa.nama;
  }
  const kelasElem = document.getElementById("student-class");
  if (kelasElem) {
    kelasElem.textContent = siswa.kelas || "-";
  }

  tampilkanRapor(rapor || []);
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const siswaId = params.get("id");

  if (!siswaId) {
    alert("ID siswa tidak ditemukan di URL.");
    window.location.href = "/dashboard.html";
    return;
  }

  const { role, id: userId } = await getUserRoleAndId();

  if (role === "siswa" && userId !== siswaId) {
    alert("Kamu tidak punya izin melihat data ini.");
    window.location.href = "/dashboard.html";
    return;
  }

  await fetchStudentInfo(siswaId);   // ✅ This fetches and shows the student info
  await loadCurrentRapor();          // ✅ This fetches and shows rapor data for semester
}

async function fetchStudentInfo(siswaId) {
  const { data, error } = await supabase
    .from('siswa')
    .select('nama, kelas_id')
    .eq('id', siswaId)
    .single();

  if (error) {
    console.error('Failed to fetch student info:', error);
    return;
  }

  document.getElementById('student-name').textContent = data.nama;

  // Fetch kelas name from kelas_id
  if (data.kelas_id) {
    const { data: kelasData, error: kelasError } = await supabase
      .from('kelas')
      .select('nama')
      .eq('id', data.kelas_id)
      .single();
    if (kelasError) {
      console.error('Failed to fetch kelas info:', kelasError);
      document.getElementById('student-class').textContent = '-';
    } else {
      document.getElementById('student-class').textContent = kelasData.nama;
    }
  } else {
    document.getElementById('student-class').textContent = '-';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const siswaId = params.get('id');
  if (!siswaId) {
    alert("ID siswa tidak ditemukan.");
    return;
  }
  currentSiswaId = siswaId;
  await fetchStudentInfo(siswaId);
  await main();
});
