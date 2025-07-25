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
    `;
    total += item.nilai;
    tbody.appendChild(tr);
  });

  const rata2 = data.length > 0 ? total / data.length : 0;
  document.getElementById("rata-rata").textContent = rata2.toFixed(2);
}

async function loadRapor(siswaId) {
  const currentSemester = 1; // You can adjust this or make dynamic

  const { data: siswa, error: siswaError } = await supabase
    .from("siswa")
    .select("*")
    .eq("id", siswaId)
    .single();

  if (siswaError || !siswa) {
    alert("Data siswa tidak ditemukan.");
    return;
  }

  const { data: rapor, error: raporError } = await supabase
    .from("rapor")
    .select("*")
    .eq("siswa_id", siswaId)
    .eq("semester", currentSemester);

  if (raporError) {
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

document.addEventListener("DOMContentLoaded", main);
