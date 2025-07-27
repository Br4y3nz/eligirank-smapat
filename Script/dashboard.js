// Improved Dashboard JS with cleaner logic and no redundancy
import supabase from '../Supabase/client.js';

document.addEventListener('DOMContentLoaded', async () => {
  loadUsername();
  loadStats();
  await renderAnnouncements();
  renderTopSiswa();
  observeScrollFade();
  animateStatsOnScroll();
  renderChart();
});

async function loadUsername() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    const usernameEl = document.getElementById('dashboard-username');
    if (error || !session) return usernameEl.textContent = 'Guest';

    const { data, error: profileErr } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .maybeSingle();

    usernameEl.textContent = profileErr || !data?.username ? 'User' : data.username;
  } catch (err) {
    document.getElementById('dashboard-username').textContent = 'User';
  }
}

async function loadStats() {
  const stats = {
    siswa: 120,
    guru: 15,
    prestasi: 30,
    organisasi: 5,
  };
  Object.entries(stats).forEach(([key, val]) => {
    document.getElementById(`stat-${key}`).setAttribute('data-count', val);
    document.querySelector(`#stat-${key} .stat-value`).textContent = '0';
  });
}

function animateNumber(el, count) {
  let current = 0;
  const step = Math.ceil(count / 50);
  const valueEl = el.querySelector('.stat-value');
  const interval = setInterval(() => {
    current += step;
    if (current >= count) {
      valueEl.textContent = count;
      clearInterval(interval);
    } else {
      valueEl.textContent = current;
    }
  }, 20);
}

function animateStatsOnScroll() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const count = parseInt(el.getAttribute('data-count'), 10);
        if (!isNaN(count)) animateNumber(el, count);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-card').forEach(el => observer.observe(el));
}

function observeScrollFade() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-fade').forEach(el => observer.observe(el));
}

function renderTopSiswa() {
  const topSiswa = [
    { name: 'Agus', score: 92 },
    { name: 'Rina', score: 95 },
    { name: 'Dewi', score: 90 },
  ];

  const podiumHTML = `
    <div class="podium-wrapper">
      <div class="podium-card second-place">
        <span class="rank">2</span>
        <div class="student-info">${topSiswa[0].name}<br><small>${topSiswa[0].score}</small></div>
      </div>
      <div class="podium-card first-place">
        <span class="rank">1</span>
        <div class="student-info">${topSiswa[1].name}<br><small>${topSiswa[1].score}</small></div>
      </div>
      <div class="podium-card third-place">
        <span class="rank">3</span>
        <div class="student-info">${topSiswa[2].name}<br><small>${topSiswa[2].score}</small></div>
      </div>
    </div>`;

  const highlightSection = document.querySelector('.highlights');
  if (highlightSection) highlightSection.innerHTML += podiumHTML;
}

const announcements = [
  { title: 'Libur sekolah tanggal 1 Mei', date: '2025-01-01' },
  { title: 'Jadwal ujian semester', date: '2025-02-15' },
  { title: 'Kegiatan ekstrakurikuler', date: '2025-03-20' },
  { title: 'Pengumuman tambahan 1', date: '2025-04-10' },
  { title: 'Pengumuman tambahan 2', date: '2025-05-05' }
];

async function renderAnnouncements() {
  const container = document.getElementById("announcement-list");
  container.innerHTML = "";

  let isAdmin = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("akun")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = data?.role === 'admin';
    }
  } catch {}

  announcements.slice(0, 5).forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "announcement-card";

    const title = document.createElement("input");
    title.className = "announcement-title";
    title.value = item.title;
    title.disabled = true;

    const date = document.createElement("input");
    date.className = "announcement-date";
    date.type = "date";
    date.value = item.date;
    date.disabled = true;

    const content = document.createElement("div");
    content.className = "announcement-content";
    content.append(title, date);

    card.appendChild(content);

    if (isAdmin) {
      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.innerHTML = "<i class='bx bx-pencil'></i>";
      editBtn.title = "Edit Pengumuman";
      card.appendChild(editBtn);
    }

    container.appendChild(card);
  });
}

function renderChart() {
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = drawChart;
    document.head.appendChild(script);
  } else drawChart();
}

function drawChart() {
  const ctx = document.getElementById('chart-nilai-canvas')?.getContext('2d');
  if (!ctx) return;

  if (window.chartInstance) {
    window.chartInstance.destroy();
    window.chartInstance = null;
  }

  window.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
      datasets: [{
        label: 'Nilai Rata-rata',
        data: [78, 85, 82],
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } }
    }
  });
}
