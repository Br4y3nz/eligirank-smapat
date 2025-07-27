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
  document.getElementById('top-siswa').innerHTML = `
    <h3>Top Siswa Semester Lalu</h3>
    <div class="podium">
      <div class="rank rank-2">2<br>Agus</div>
      <div class="rank rank-1">1<br>Rina</div>
      <div class="rank rank-3">3<br>Dewi</div>
    </div>
  `;
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

  announcements.slice(0, 5).forEach(item => {
    const card = document.createElement("div");
    card.className = "announcement-card";
    const title = document.createElement("h4");
    title.textContent = item.title;
    const date = document.createElement("span");
    date.textContent = new Date(item.date).toLocaleDateString("id-ID", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    card.append(title, date);
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
