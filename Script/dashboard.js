import supabase from '../Supabase/client.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded event fired');
  loadUsername();
  loadStats();
  await renderAnnouncements();
  renderTopSiswa();
  observeScrollFade();
  animateStatsOnScroll();
  renderChart();
  // Removed initVMGSlider call as VMG section is removed
});

// Load username from Supabase profiles table
async function loadUsername() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error("No session or session error:", sessionError);
      document.getElementById('dashboard-username').textContent = "Guest";
      return;
    }
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !profileData?.username) {
      console.error("Error fetching username:", error);
      document.getElementById('dashboard-username').textContent = "User";
      return;
    }

    document.getElementById('dashboard-username').textContent = profileData.username;
  } catch (err) {
    console.error("Unexpected error loading username:", err);
    document.getElementById('dashboard-username').textContent = "User";
  }
}

// Save profile data from modal
document.addEventListener('DOMContentLoaded', () => {
  const userInfoForm = document.getElementById('user-info-form');
  if (userInfoForm) {
    userInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('username-input');
      const phoneInput = document.getElementById('phone-input');

      const username = usernameInput?.value.trim();
      const phone = phoneInput?.value.trim();

      if (!username) {
        alert('Username is required.');
        return;
      }
      if (!phone) {
        alert('Phone number is required.');
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          alert('You must be logged in to save your profile.');
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: session.user.id,
            username: username,
            phone: phone,
          }, { onConflict: 'id' });

        if (error) {
          alert('Failed to save profile: ' + error.message);
          console.error('Profile save error:', error);
          return;
        }

        alert('Profile saved successfully!');
        // Close modal and overlay
        const userInfoModal = document.getElementById('user-info-modal');
        const overlay = document.getElementById('overlay');
        if (userInfoModal && overlay) {
          userInfoModal.classList.remove('open');
          userInfoModal.classList.add('close');
          overlay.classList.remove('open');
          overlay.classList.add('close');
        }
        // Optionally reload or update UI
        loadUsername();
      } catch (err) {
        alert('Unexpected error saving profile.');
        console.error('Unexpected error:', err);
      }
    });
  }
});

// Load stats - mock implementation
async function loadStats() {
  const stats = {
    siswa: 120,
    guru: 15,
    prestasi: 30,
    organisasi: 5,
  };

  document.getElementById('stat-siswa').setAttribute('data-count', stats.siswa);
  document.getElementById('stat-guru').setAttribute('data-count', stats.guru);
  document.getElementById('stat-prestasi').setAttribute('data-count', stats.prestasi);
  document.getElementById('stat-organisasi').setAttribute('data-count', stats.organisasi);

  // Initialize with 0
  document.querySelector('#stat-siswa .stat-value').textContent = '0';
  document.querySelector('#stat-guru .stat-value').textContent = '0';
  document.querySelector('#stat-prestasi .stat-value').textContent = '0';
  document.querySelector('#stat-organisasi .stat-value').textContent = '0';
}

// Animate numbers on scroll into view
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
  const stats = document.querySelectorAll('.stat-card');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const count = parseInt(el.getAttribute('data-count'), 10);
        if (!isNaN(count)) {
          animateNumber(el, count);
        }
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
}

// Scroll fade animation
function observeScrollFade() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.scroll-fade').forEach(el => observer.observe(el));
}

function renderTopSiswa() {
  const topSiswaDiv = document.getElementById('top-siswa');
  topSiswaDiv.innerHTML = `
    <h3>Top Siswa Semester Lalu</h3>
    <ul>
      <li>Rina Putri</li>
      <li>Agus Santoso</li>
      <li>Dewi Lestari</li>
    </ul>
  `;
}

let isEditingAnnouncements = false;
let announcements = [
  { title: 'Libur sekolah tanggal 1 Mei', date: '2025-01-01' },
  { title: 'Jadwal ujian semester', date: '2025-02-15' },
  { title: 'Kegiatan ekstrakurikuler', date: '2025-03-20' },
  { title: 'Pengumuman tambahan 1', date: '2025-04-10' },
  { title: 'Pengumuman tambahan 2', date: '2025-05-05' }
];

async function renderAnnouncements() {
  const container = document.getElementById("announcement-list");
  container.innerHTML = "";

  // Fetch user role to determine if admin
  let isAdmin = false;
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("User not authenticated");
      isAdmin = false;
    } else {
      const { data, error } = await supabase
        .from("akun")
        .select("role")
        .eq("id", user.id);
      if (error) {
        console.error("Supabase query error:", error);
        isAdmin = false;
      } else {
        const userRole = data[0]?.role;
        if (userRole === "admin") {
          isAdmin = true;
        }
      }
    }
  } catch (err) {
    console.error("Error fetching user role:", err);
    isAdmin = false;
  }

  // Deduplicate announcements by title and date
  const uniqueAnnouncements = [];
  const seen = new Set();
  for (const item of announcements) {
    const key = item.title + '|' + item.date;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAnnouncements.push(item);
    }
  }

  uniqueAnnouncements.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "announcement-card";

    if (isEditingAnnouncements && isAdmin) {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.value = item.title;
      titleInput.className = "announcement-title-input";
      titleInput.dataset.index = index;

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = item.date;
      dateInput.className = "announcement-date-input";
      dateInput.dataset.index = index;

      card.appendChild(titleInput);
      card.appendChild(dateInput);
    } else {
      const title = document.createElement("h4");
      title.textContent = item.title;

      const date = document.createElement("span");
      const formattedDate = new Date(item.date).toLocaleDateString("id-ID", {
        day: "2-digit", month: "2-digit", year: "numeric"
      });
      date.textContent = formattedDate;

      card.appendChild(title);
      card.appendChild(date);
    }

    container.appendChild(card);
  });

  // Show or hide edit/save buttons based on admin status
  const editBtn = document.getElementById('edit-announcements-btn');
  const saveBtn = document.getElementById('save-announcements-btn');
  if (isAdmin) {
    editBtn.style.display = isEditingAnnouncements ? 'none' : 'inline-block';
    saveBtn.style.display = isEditingAnnouncements ? 'inline-block' : 'none';
  } else {
    editBtn.style.display = 'none';
    saveBtn.style.display = 'none';
  }
}

document.getElementById('edit-announcements-btn').addEventListener('click', () => {
  isEditingAnnouncements = true;
  document.getElementById('edit-announcements-btn').style.display = 'none';
  document.getElementById('save-announcements-btn').style.display = 'inline-block';
  renderAnnouncements();
});

document.getElementById('save-announcements-btn').addEventListener('click', () => {
  const titleInputs = document.querySelectorAll('.announcement-title-input');
  const dateInputs = document.querySelectorAll('.announcement-date-input');

  titleInputs.forEach(input => {
    const index = input.dataset.index;
    announcements[index].title = input.value;
  });

  dateInputs.forEach(input => {
    const index = input.dataset.index;
    announcements[index].date = input.value;
  });

  isEditingAnnouncements = false;
  document.getElementById('edit-announcements-btn').style.display = 'inline-block';
  document.getElementById('save-announcements-btn').style.display = 'none';
  renderAnnouncements();
});

document.addEventListener('DOMContentLoaded', () => {
  loadUsername();
  loadStats();
  renderAnnouncements();
  renderTopSiswa();
  observeScrollFade();
  animateStatsOnScroll();
  renderChart();
  // Removed initVMGSlider call as VMG section is removed
});

// Render chart for average student scores per class using Chart.js
function renderChart() {
  // Load Chart.js dynamically if not already loaded
  if (!window.Chart) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => drawChart();
    document.head.appendChild(script);
  } else {
    drawChart();
  }
}

let chartInstance = null;

function drawChart() {
  const canvas = document.getElementById('chart-nilai-canvas');
  if (!canvas) {
    console.error('Chart canvas element not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Destroy existing chart instance if exists to prevent error
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // Mock data for average scores per class
  const data = {
    labels: ['Kelas 10', 'Kelas 11', 'Kelas 12'],
    datasets: [{
      label: 'Nilai Rata-rata',
      data: [78, 85, 82],
      backgroundColor: 'rgba(37, 99, 235, 0.6)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 1,
      borderRadius: 5,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: options
  });
}

// Role selection and dynamic fields
const roleForm = document.getElementById('role-form');
if (roleForm) {
  // Add event listeners to role radio buttons to show/hide fields on change
  const roleRadios = document.querySelectorAll('input[name="role"]');
  const studentFields = document.getElementById("student-fields");
  const teacherFields = document.getElementById("teacher-fields");

  roleRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === "student" && radio.checked) {
        if (studentFields) studentFields.style.display = "block";
        if (teacherFields) teacherFields.style.display = "none";
      } else if (radio.value === "teacher" && radio.checked) {
        if (studentFields) studentFields.style.display = "none";
        if (teacherFields) teacherFields.style.display = "block";
      }
    });
  });

  roleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const role = document.querySelector('input[name="role"]:checked')?.value;
    if (!role) {
      alert("Please select a role.");
      return;
    }

    // Disable/enable fields based on role to avoid HTML validation errors
    const classSelect = document.getElementById("class-select");
    const classWrapper = document.getElementById("class-wrapper");
    const subjectCheckboxes = document.getElementById("subject-checkboxes");
    if (role === "teacher") {
      if (classSelect) {
        classSelect.removeAttribute("required");
        classSelect.disabled = true;
      }
      if (classWrapper) classWrapper.style.display = "none";
      if (subjectCheckboxes) {
        subjectCheckboxes.style.display = "block";
        // Enable all checkboxes inside subjectCheckboxes
        subjectCheckboxes.querySelectorAll("input[type=checkbox]").forEach(cb => cb.disabled = false);
      }
    } else {
      if (classSelect) {
        classSelect.setAttribute("required", "true");
        classSelect.disabled = false;
      }
      if (classWrapper) classWrapper.style.display = "block";
      if (subjectCheckboxes) {
        subjectCheckboxes.style.display = "none";
        // Disable all checkboxes inside subjectCheckboxes
        subjectCheckboxes.querySelectorAll("input[type=checkbox]").forEach(cb => cb.disabled = true);
      }
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (!session || sessionError) {
      console.error("Session fetch failed:", sessionError);
      return;
    }

    if (role === "student") {
      // Insert siswa data first
      const nis = document.getElementById("nis")?.value.trim();
      const nisn = document.getElementById("nisn")?.value.trim();
      const selectedClassName = document.getElementById("class-select")?.value;
      if (!nis || !nisn || !selectedClassName) {
        alert("Please fill in all student fields.");
        return;
      }

      // Fetch kelas id by class name
      const { data: kelasData, error: kelasError } = await supabase
        .from('kelas')
        .select('id, nama')
        .eq('nama', selectedClassName)
        .single();

      if (kelasError || !kelasData) {
        alert("Selected class not found in database.");
        console.error(kelasError);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("User not authenticated.");
        return;
      }

      // Check if siswa already exists
      const { data: existingSiswa } = await supabase
        .from('siswa')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingSiswa) {
        alert("You have already registered as a student.");
        return;
      }

      const { error: siswaError } = await supabase
        .from('siswa')
        .insert({
          id: user.id,
          nis,
          nisn,
          kelas_id: kelasData.id
        });

      if (siswaError) {
        alert("Error saving student data: " + siswaError.message);
        console.error(siswaError);
        return;
      }

      // Upsert role in akun table
      const { error: akunError } = await supabase
        .from('akun')
        .upsert({
          id: user.id,
          role: 'siswa',
          role_id: user.id
        });

      if (akunError) {
        alert("Error saving user role: " + akunError.message);
        console.error(akunError);
        return;
      }

      alert("Registration successful! You can now log in.");
      // Optionally, redirect to login or auto-login
      // window.location.href = '/login';
    } else if (role === "teacher") {
      // Insert guru data
      const nip = document.getElementById("nip")?.value.trim();
      const selectedMapel = document.getElementById("mapel-select")?.value;
      if (!nip || !selectedMapel) {
        alert("Please fill in all teacher fields.");
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("User not authenticated.");
        return;
      }

      // Check if guru already exists
      const { data: existingGuru } = await supabase
        .from('guru')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (existingGuru) {
        alert("You have already registered as a teacher.");
        return;
      }

      const { error: guruError } = await supabase
        .from('guru')
        .insert({
          id: user.id,
          nip
        });

      if (guruError) {
        alert("Error saving teacher data: " + guruError.message);
        console.error(guruError);
        return;
      }

      // Insert into guru_mapel
      const { error: guruMapelError } = await supabase
        .from('guru_mapel')
        .insert({
          guru_id: user.id,
          mapel_id: selectedMapel
        });

      if (guruMapelError) {
        alert("Error saving teacher subject data: " + guruMapelError.message);
        console.error(guruMapelError);
        return;
      }

      // Upsert role in akun table
      const { error: akunError } = await supabase
        .from('akun')
        .upsert({
          id: user.id,
          role: 'guru',
          role_id: user.id
        });

      if (akunError) {
        alert("Error saving user role: " + akunError.message);
        console.error(akunError);
        return;
      }

      alert("Teacher registration successful!");
      // Optionally, redirect or show success message
    }
  });
}
