
import supabase from '../Supabase/client.js';

let currentSiswaId = null;
let currentSemester = 1;
let mapelOptions = [];

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

function showLoading(show) {
  let loadingEl = document.getElementById('loading-indicator');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'loading-indicator';
    loadingEl.textContent = 'Loading...';
    loadingEl.style.position = 'fixed';
    loadingEl.style.top = '10px';
    loadingEl.style.right = '10px';
    loadingEl.style.padding = '8px 12px';
    loadingEl.style.backgroundColor = '#2563eb';
    loadingEl.style.color = 'white';
    loadingEl.style.borderRadius = '6px';
    loadingEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    loadingEl.style.zIndex = '1000';
    document.body.appendChild(loadingEl);
  }
  loadingEl.style.display = show ? 'block' : 'none';
}

function tampilkanRapor(data) {
  const tbody = document.getElementById("tabel-rapor");
  tbody.innerHTML = "";

  let total = 0;

  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.mapel}</td>
      <td>${item.nilai}</td>
      <td>${konversiGrade(item.nilai)}</td>
      <td>
        <button class="btn-edit-mapel" data-id="${item.id}">Edit</button>
        <button class="btn-delete-mapel" data-id="${item.id}">Hapus</button>
      </td>
    `;
    total += item.nilai;
    tbody.appendChild(tr);
  });

  const rata2 = data.length > 0 ? total / data.length : 0;
  document.getElementById("rata-rata").textContent = rata2.toFixed(2);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
  }
}

function attachEventDelegation() {
  const tbody = document.getElementById('tabel-rapor');

  tbody.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('btn-edit-mapel')) {
      const id = target.dataset.id;
      const row = target.closest('tr');
      const mapelName = row.children[0].textContent;
      const nilai = row.children[1].textContent;

      // Fill modal inputs
      document.getElementById('edit-mapel-name').value = mapelName;
      document.getElementById('edit-mapel-nilai').value = nilai;
      document.getElementById('form-edit-mapel').dataset.id = id;

      openModal('modal-edit-mapel');
    } else if (target.classList.contains('btn-delete-mapel')) {
      const id = target.dataset.id;
      if (!confirm("Yakin ingin menghapus mapel ini?")) return;
      showLoading(true);
      const { error } = await supabase.from('rapor').delete().eq('id', id);
      showLoading(false);
      if (error) {
        alert("Gagal menghapus data mapel.");
        console.error(error);
      } else {
        alert("Data mapel berhasil dihapus.");
        loadCurrentRapor();
      }
    }
  });
}

async function loadCurrentRapor() {
  if (!currentSiswaId) return;
  showLoading(true);
  const { data: rapor, error } = await supabase
    .from('rapor')
    .select('id, mapel, nilai')
    .eq('siswa_id', currentSiswaId)
    .eq('semester', currentSemester);
  showLoading(false);
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

document.getElementById('btn-add-mapel').addEventListener('click', async () => {
  if (!currentSiswaId) {
    alert("ID siswa tidak ditemukan.");
    return;
  }
  showLoading(true);
  const { data, error } = await supabase
    .from('mapel')
    .select('id, nama')
    .order('nama', { ascending: true });
  showLoading(false);
  if (error) {
    alert("Gagal mengambil daftar mapel.");
    console.error(error);
    return;
  }
  if (!data || data.length === 0) {
    alert("Daftar mapel kosong.");
    return;
  }
  mapelOptions = data;
  const select = document.getElementById('add-mapel-select');
  select.innerHTML = '';
  data.forEach(m => {
    const option = document.createElement('option');
    option.value = m.id;
    option.textContent = m.nama;
    select.appendChild(option);
  });
  document.getElementById('add-mapel-nilai').value = '';
  openModal('modal-add-mapel');
});

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
  closeModal('modal-edit-mapel');
});

document.getElementById('btn-cancel-add').addEventListener('click', () => {
  closeModal('modal-add-mapel');
});

document.getElementById('form-edit-mapel').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = e.target.dataset.id;
  const mapel = document.getElementById('edit-mapel-name').value.trim();
  const nilai = parseInt(document.getElementById('edit-mapel-nilai').value);
  if (!mapel) {
    alert('Nama mapel tidak boleh kosong.');
    return;
  }
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    alert('Nilai tidak valid.');
    return;
  }
  showLoading(true);
  const { error } = await supabase.from('rapor').update({ mapel, nilai }).eq('id', id);
  showLoading(false);
  if (error) {
    alert('Gagal mengupdate data mapel.');
    console.error(error);
  } else {
    alert('Data mapel berhasil diupdate.');
    closeModal('modal-edit-mapel');
    loadCurrentRapor();
  }
});

document.getElementById('form-add-mapel').addEventListener('submit', async (e) => {
  e.preventDefault();
  const mapelId = document.getElementById('add-mapel-select').value;
  const nilai = parseInt(document.getElementById('add-mapel-nilai').value);
  if (!mapelId) {
    alert('Pilih mapel terlebih dahulu.');
    return;
  }
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    alert('Nilai tidak valid.');
    return;
  }
  showLoading(true);
  const { error } = await supabase.from('rapor').insert([{ siswa_id: currentSiswaId, semester: currentSemester, mapel_id: mapelId, nilai }]);
  showLoading(false);
  if (error) {
    alert('Gagal menambahkan data mapel.');
    console.error(error);
  } else {
    alert('Data mapel berhasil ditambahkan.');
    closeModal('modal-add-mapel');
    loadCurrentRapor();
  }
});

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
    .select("id, mapel, nilai")
    .eq("siswa_id", siswaId)
    .eq("semester", currentSemester);

  if (raporError) {
    console.error("Error fetching rapor:", raporError);
    alert("Gagal mengambil data rapor.");
    return;
  }

  document.getElementById("student-name").textContent = siswa.nama;
  document.getElementById("student-class").textContent = siswa.kelas || "-";

  tampilkanRapor(rapor || []);
  attachEventDelegation();
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

  await loadRapor(siswaId);
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
