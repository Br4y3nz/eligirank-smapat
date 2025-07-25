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

  attachMapelRowEvents();
}

function attachMapelRowEvents() {
  document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
    btn.onclick = async function() {
      const id = this.dataset.id;
      const mapel = prompt("Masukkan nama mapel baru:");
      if (!mapel) return;
      const nilaiStr = prompt("Masukkan nilai baru (0-100):");
      const nilai = parseInt(nilaiStr);
      if (isNaN(nilai) || nilai < 0 || nilai > 100) {
        alert("Nilai tidak valid.");
        return;
      }
      const { error } = await supabase.from('rapor').update({ mapel, nilai }).eq('id', id);
      if (error) {
        alert("Gagal mengupdate data mapel.");
        console.error(error);
      } else {
        alert("Data mapel berhasil diupdate.");
        loadCurrentRapor();
      }
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

let currentSiswaId = null;
let currentSemester = 1;

async function loadCurrentRapor() {
  if (!currentSiswaId) return;
  const { data: rapor, error } = await supabase
    .from('rapor')
    .select('*')
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

document.getElementById('btn-add-mapel').onclick = async function() {
  if (!currentSiswaId) {
    alert("ID siswa tidak ditemukan.");
    return;
  }
  // Fetch mapel options from supabase
  const { data: mapelOptions, error: mapelError } = await supabase
    .from('mapel')
    .select('id, nama')
    .order('nama', { ascending: true });
  if (mapelError) {
    alert("Gagal mengambil daftar mapel.");
    console.error(mapelError);
    return;
  }
  if (!mapelOptions || mapelOptions.length === 0) {
    alert("Daftar mapel kosong.");
    return;
  }
  // Create a prompt with options
  const mapelNames = mapelOptions.map(m => m.nama);
  let mapelChoice = prompt("Pilih mapel:\n" + mapelNames.map((name, i) => `${i + 1}. ${name}`).join('\n'));
  if (!mapelChoice) return;
  // If user entered a number, convert to mapel name
  const mapelIndex = parseInt(mapelChoice);
  if (!isNaN(mapelIndex) && mapelIndex >= 1 && mapelIndex <= mapelNames.length) {
    mapelChoice = mapelNames[mapelIndex - 1];
  }
  if (!mapelNames.includes(mapelChoice)) {
    alert("Mapel tidak valid.");
    return;
  }
  // Find mapel id by name
  const selectedMapel = mapelOptions.find(m => m.nama === mapelChoice);
  if (!selectedMapel) {
    alert("Mapel tidak ditemukan.");
    return;
  }
  const nilaiStr = prompt("Masukkan nilai (0-100):");
  const nilai = parseInt(nilaiStr);
  if (isNaN(nilai) || nilai < 0 || nilai > 100) {
    alert("Nilai tidak valid.");
    return;
  }
  const { error } = await supabase.from('rapor').insert([{ siswa_id: currentSiswaId, semester: currentSemester, mapel_id: selectedMapel.id, nilai }]);
  if (error) {
    alert("Gagal menambahkan data mapel.");
    console.error(error);
  } else {
    alert("Data mapel berhasil ditambahkan.");
    loadCurrentRapor();
  }
};

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

  document.getElementById("nama").textContent = siswa.nama;
  document.getElementById("kelas").textContent = siswa.kelas || "-";

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

  // Adjust margins if navbar and sidebar are detected
  const sidebar = document.getElementById('sidebar-container');
  const navbar = document.querySelector('nav'); // Assuming navbar is a <nav> element
  const mainContent = document.querySelector('main.rapor-container');

  if (navbar) {
    if (window.innerWidth <= 768) {
      // Mobile: add bottom margin to main content to avoid overlap with navbar
      mainContent.style.marginBottom = '70px';
    } else {
      // Desktop: add left margin to main content to avoid overlap with sidebar
      mainContent.style.marginLeft = '80px';
    }
  }
});
