// dashboard.js - dynamic content for dashboard page

import supabase from '../Supabase/client.js';

document.addEventListener('DOMContentLoaded', () => {
  loadUsername();
  loadStats();
  loadAnnouncements();
});

// Load username from profiles table and inject into greeting
export async function loadUsername() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      document.getElementById('dashboard-username').textContent = 'Guest';
      return;
    }
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching username:', error);
      document.getElementById('dashboard-username').textContent = 'User';
      return;
    }
    document.getElementById('dashboard-username').textContent = profile?.username || 'User';
  } catch (err) {
    console.error('Error loading username:', err);
    document.getElementById('dashboard-username').textContent = 'User';
  }
}

// Load stats counts for siswa, guru, prestasi, organisasi
export async function loadStats() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatsLoadingError();
      return;
    }

    // Fetch counts from respective tables
    const [siswaCount, guruCount, prestasiCount, organisasiCount] = await Promise.all([
      supabase.from('siswa').select('*', { count: 'exact' }).then(r => r.count || 0),
      supabase.from('guru').select('*', { count: 'exact' }).then(r => r.count || 0),
      supabase.from('prestasi').select('*', { count: 'exact' }).then(r => r.count || 0),
      supabase.from('organisasi').select('*', { count: 'exact' }).then(r => r.count || 0),
    ]);

    document.getElementById('stat-siswa').textContent = `Siswa: ${siswaCount}`;
    document.getElementById('stat-guru').textContent = `Guru: ${guruCount}`;
    document.getElementById('stat-prestasi').textContent = `Prestasi: ${prestasiCount}`;
    document.getElementById('stat-organisasi').textContent = `Organisasi: ${organisasiCount}`;
  } catch (err) {
    console.error('Error loading stats:', err);
    setStatsLoadingError();
  }
}

function setStatsLoadingError() {
  document.getElementById('stat-siswa').textContent = 'Error loading siswa';
  document.getElementById('stat-guru').textContent = 'Error loading guru';
  document.getElementById('stat-prestasi').textContent = 'Error loading prestasi';
  document.getElementById('stat-organisasi').textContent = 'Error loading organisasi';
}

// Load announcements from announcements table and inject into list
export async function loadAnnouncements() {
  try {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading announcements:', error);
      return;
    }

    const list = document.getElementById('announcement-list');
    list.innerHTML = '';

    if (!announcements || announcements.length === 0) {
      list.innerHTML = '<li>No announcements available.</li>';
      return;
    }

    announcements.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.title || 'Untitled announcement';
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading announcements:', err);
  }
}
