// dashboard.js - dynamic content for dashboard page

// Since the Supabase tables "announcements", "siswa", "guru", "prestasi", and "organisasi" do not exist,
// we will provide mock data for demonstration purposes.

document.addEventListener('DOMContentLoaded', () => {
  loadUsername();
  loadStats();
  loadAnnouncements();
});

// Load username - mock implementation
export async function loadUsername() {
  // Mock username
  const username = "User";
  document.getElementById('dashboard-username').textContent = username;
}

// Load stats - mock implementation
export async function loadStats() {
  const stats = {
    siswa: 120,
    guru: 15,
    prestasi: 30,
    organisasi: 5,
  };

  document.getElementById('stat-siswa').textContent = `Siswa: ${stats.siswa}`;
  document.getElementById('stat-guru').textContent = `Guru: ${stats.guru}`;
  document.getElementById('stat-prestasi').textContent = `Prestasi: ${stats.prestasi}`;
  document.getElementById('stat-organisasi').textContent = `Organisasi: ${stats.organisasi}`;
}

// Load announcements - mock implementation
export async function loadAnnouncements() {
  const announcements = [
    { title: "Pengumuman 1: Libur sekolah tanggal 1 Mei" },
    { title: "Pengumuman 2: Jadwal ujian semester" },
    { title: "Pengumuman 3: Kegiatan ekstrakurikuler" },
  ];

  const list = document.getElementById('announcement-list');
  list.innerHTML = '';

  announcements.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.title;
    list.appendChild(li);
  });
}
