// Improved Dashboard JS with Supabase-based highlight logic and editable + persistent announcements
import supabase from '../Supabase/client.js';

document.addEventListener('DOMContentLoaded', async () => {
  loadUsername();
  loadStats();
  await renderAnnouncements();
  await renderTopSiswa();
  observeScrollFade();
  animateStatsOnScroll();
  renderChart();
  setupRoleSelector();
});

function setupRoleSelector() {
  document.querySelectorAll('.role-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const selectedRole = btn.dataset.role;
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return alert('Login diperlukan');

      const { error: updateErr } = await supabase
        .from('akun')
        .update({ role: selectedRole })
        .eq('id', user.id);

      if (updateErr) return alert('Gagal memperbarui peran');
      alert('Peran berhasil diperbarui ke: ' + selectedRole);
      location.reload();
    });
  });
}

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
    siswa: 710,
    guru: 52,
    prestasi: 92,
    organisasi: 7,
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

async function renderTopSiswa() {
  const container = document.querySelector('.highlights');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('rapor')
      .select('id, semester, nilai, siswa_id')
      .order('nilai', { ascending: false });

    if (error || !data) throw error;

    const siswaMap = new Map();

    for (const row of data) {
      if (!siswaMap.has(row.siswa_id)) siswaMap.set(row.siswa_id, []);
      siswaMap.get(row.siswa_id).push(row.nilai);
    }

    const avgList = [];
    for (const [siswaId, nilaiList] of siswaMap.entries()) {
      const avg = nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length;
      const { data: siswa } = await supabase.from('profiles').select('username').eq('id', siswaId).maybeSingle();
      avgList.push({ id: siswaId, name: siswa?.username || '-', avg: Math.round(avg) });
    }

    avgList.sort((a, b) => b.avg - a.avg);
    const top = avgList.slice(0, 3);

    const podiumHTML = `
      <div class="podium-wrapper">
        <div class="podium-card second-place">
          <span class="rank">2</span>
          <div class="student-info">${top[1]?.name || '-'}<br><small>${top[1]?.avg || '-'}</small></div>
        </div>
        <div class="podium-card first-place">
          <span class="rank">1</span>
          <div class="student-info">${top[0]?.name || '-'}<br><small>${top[0]?.avg || '-'}</small></div>
        </div>
        <div class="podium-card third-place">
          <span class="rank">3</span>
          <div class="student-info">${top[2]?.name || '-'}<br><small>${top[2]?.avg || '-'}</small></div>
        </div>
      </div>`;

    container.innerHTML = '<h2 style="text-align:center;"><i class="bx bxs-star"></i> Siswa Teratas</h2>' + podiumHTML;
  } catch (err) {
    console.error('Gagal memuat siswa teratas', err);
  }
}

async function renderAnnouncements() {
  const container = document.getElementById("announcement-list");
  container.innerHTML = "";

  let isAdmin = false;
  let userId = null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data } = await supabase
        .from("akun")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = data?.role === 'admin';
    }
  } catch {}

  const { data: dbAnnouncements } = await supabase.from('pengumuman').select('*').order('announcement_date', { ascending: false });

  dbAnnouncements?.forEach((item) => {
    const card = document.createElement("div");
    card.className = "announcement-card";

    const title = document.createElement("input");
    title.className = "announcement-title";
    title.value = item.title;
    title.disabled = true;

    const date = document.createElement("input");
    date.className = "announcement-date";
    date.type = "date";
    date.value = item.announcement_date;
    date.disabled = true;

    const content = document.createElement("div");
    content.className = "announcement-content";
    content.append(title, date);
    card.appendChild(content);

    if (isAdmin) {
      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.innerHTML = "<i class='bx bx-pencil'></i>";

      const confirmBtn = document.createElement("button");
      confirmBtn.className = "confirm-btn";
      confirmBtn.innerHTML = "<i class='bx bx-check'></i>";
      confirmBtn.style.display = 'none';

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "cancel-btn";
      cancelBtn.innerHTML = "<i class='bx bx-x'></i>";
      cancelBtn.style.display = 'none';

      const original = { title: title.value, date: date.value };

      editBtn.addEventListener('click', () => {
        title.disabled = false;
        date.disabled = false;
        editBtn.style.display = 'none';
        confirmBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
      });

      confirmBtn.addEventListener('click', async () => {
        const { error } = await supabase.from('pengumuman').update({
          title: title.value,
          announcement_date: date.value
        }).eq('id', item.id);

        if (!error) {
          original.title = title.value;
          original.date = date.value;
          title.disabled = true;
          date.disabled = true;
          editBtn.style.display = 'inline-block';
          confirmBtn.style.display = 'none';
          cancelBtn.style.display = 'none';
        } else {
          console.error('Update failed:', error);
        }
      });

      cancelBtn.addEventListener('click', () => {
        title.value = original.title;
        date.value = original.date;
        title.disabled = true;
        date.disabled = true;
        editBtn.style.display = 'inline-block';
        confirmBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
      });

      card.append(editBtn, confirmBtn, cancelBtn);
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
        data: [85, 88, 90],
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

export function initializeRoleModal() {
  const modal = document.getElementById('role-modal');
  const overlay = document.getElementById('overlay');
  const roleForm = modal?.querySelector('form');
  const radioButtons = modal?.querySelectorAll('input[name="role"]');
  const siswaFields = document.getElementById('siswa-fields');
  const guruFields = document.getElementById('guru-fields');

  radioButtons?.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'siswa') {
        siswaFields.style.display = 'block';
        guruFields.style.display = 'none';
      } else if (radio.value === 'guru') {
        siswaFields.style.display = 'none';
        guruFields.style.display = 'block';
      } else {
        siswaFields.style.display = 'none';
        guruFields.style.display = 'none';
      }
    });
  });

  const openBtn = document.getElementById('open-role-modal');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.classList.add('open');
      overlay.classList.add('open');
    });
  }

  document.getElementById('cancel-role-selection')?.addEventListener('click', () => {
    modal.classList.remove('open');
    overlay.classList.remove('open');
  });

  overlay?.addEventListener('click', () => {
    modal?.classList.remove('open');
    document.getElementById('user-info-modal')?.classList.remove('open');
    overlay.classList.remove('open');
  });

  if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selected = [...radioButtons].find(r => r.checked)?.value;
      if (!selected) return alert('Pilih peran terlebih dahulu.');

      const formData = new FormData(roleForm);
      const nis = formData.get('nis') || null;
      const nisn = formData.get('nisn') || null;
      const nik = formData.get('nik') || null;
      const nip = formData.get('nip') || null;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User belum login');

        const payload = { role: selected };
        if (selected === 'siswa') Object.assign(payload, { nis, nisn });
        if (selected === 'guru') Object.assign(payload, { nik, nip });

        const { error } = await supabase
          .from('akun')
          .update(payload)
          .eq('id', user.id);

        if (error) throw error;

        modal.classList.remove('open');
        overlay.classList.remove('open');
        alert(`Peran berhasil diperbarui menjadi: ${selected}`);
      } catch (err) {
        console.error('Gagal mengupdate role:', err);
        alert('Terjadi kesalahan saat memperbarui role.');
      }
    });
  }

}