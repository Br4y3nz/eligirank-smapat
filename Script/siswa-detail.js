import supabase from '../Supabase/client.js';

class RaporManager {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.currentSiswaId = this.urlParams.get('id') || null;
    this.currentSemester = parseInt(this.urlParams.get('semester')) || 1;
    this.userRole = null;
  }

  async initializePage() {
    try {
      await this.getUserRole();
      this.setupEventListeners();
      await this.loadPageData();
      this.configureUIBasedOnRole();
    } catch (error) {
      console.error('Page initialization error:', error);
      alert('Gagal memuat halaman. Silakan coba lagi.');
    }
  }

  async getUserRole() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      this.userRole = null;
      return null;
    }

    const userId = session.user.id;
    const { data, error } = await supabase
      .from('akun')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      this.userRole = null;
      return null;
    }

    this.userRole = data.role;
    return this.userRole;
  }

  isAuthorized() {
    return ['admin', 'guru'].includes(this.userRole);
  }

  setupEventListeners() {
    this.updateStudentLinks();
    this.setupSemesterDropdown();
    this.setupModalListeners();
  }

  updateStudentLinks() {
    if (this.currentSiswaId) {
      document.querySelectorAll('a[href^="data-siswa2.html"]').forEach(link => {
        const baseUrl = link.getAttribute('href').split('?')[0];
        link.setAttribute('href', `${baseUrl}?id=${this.currentSiswaId}&semester=${this.currentSemester}`);
      });
    }
  }

  setupSemesterDropdown() {
    const semSelect = document.getElementById('semester-select');
    if (!semSelect) return;

    const semesterStr = this.currentSemester.toString();
    const optionExists = Array.from(semSelect.options).some(opt => opt.value === semesterStr);

    semSelect.value = optionExists ? semesterStr : semSelect.options[0].value;

    semSelect.addEventListener('change', e => {
      const newSemester = parseInt(e.target.value);
      if (!isNaN(newSemester) && this.currentSiswaId) {
        window.location.href = `data-siswa2.html?id=${this.currentSiswaId}&semester=${newSemester}`;
      }
    });
  }

  setupModalListeners() {
    const modalConfig = {
      'btn-add-mapel': { 
        modalId: 'modal-add-mapel', 
        formId: 'form-add-mapel', 
        handler: this.openAddModal.bind(this) 
      },
      'btn-cancel-add': { modalId: 'modal-add-mapel', handler: this.closeModal.bind(this) },
      'btn-close-add': { modalId: 'modal-add-mapel', handler: this.closeModal.bind(this) },
      'btn-cancel-edit': { modalId: 'modal-edit-mapel', handler: this.closeModal.bind(this) },
      'btn-close-edit': { modalId: 'modal-edit-mapel', handler: this.closeModal.bind(this) }
    };

    Object.entries(modalConfig).forEach(([btnId, config]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          if (config.handler) config.handler(config.modalId);
        });
      }
    });

    const formAdd = document.getElementById('form-add-mapel');
    const formEdit = document.getElementById('form-edit-mapel');

    if (formAdd) formAdd.addEventListener('submit', this.handleAddSubmit.bind(this));
    if (formEdit) formEdit.addEventListener('submit', this.handleEditSubmit.bind(this));
  }

  async loadPageData() {
    await Promise.all([
      this.loadStudentInfo(),
      this.populateMapelSelects(),
      this.loadCurrentRapor()
    ]);
  }

  configureUIBasedOnRole() {
    if (!this.isAuthorized()) {
      document.getElementById('btn-add-mapel')?.remove();
      const aksiHeader = document.querySelector('th.aksi') || document.querySelector('th:last-child');
      aksiHeader?.remove();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Actively blur the focused element first
    if (document.activeElement) {
      document.activeElement.blur();
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  }

  async openAddModal() {
    await this.populateMapelSelects();
    const modal = document.getElementById('modal-add-mapel');
    const form = document.getElementById('form-add-mapel');
    const infoText = document.getElementById('form-info-text');

    form.reset();
    document.getElementById('add-siswa-id').value = this.currentSiswaId;
    document.getElementById('add-semester').value = this.currentSemester;

    const nama = document.getElementById('student-name')?.textContent || '';
    const kelas = document.getElementById('student-class')?.textContent || '';
    infoText.innerHTML = `Data akan disimpan ke <strong>Semester ${this.currentSemester}</strong> untuk siswa <strong>${nama}</strong> (${kelas})`;

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }

  async handleAddSubmit(e) {
    e.preventDefault();
    const formData = this.validateFormData('add');
    if (!formData) return;

    const { error } = await supabase.from('rapor').insert([formData]);
    if (error) {
      console.error('Add error:', error);
      return alert('Gagal menambahkan.');
    }

    this.closeModal('modal-add-mapel');
    await this.loadCurrentRapor();
    this.attachMapelRowEvents(); // force reattach after add
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    const formData = this.validateFormData('edit');
    if (!formData) return;

    const { error } = await supabase
      .from('rapor')
      .update(formData)
      .eq('id', formData.id);

    if (error) {
      console.error('Edit error:', error);
      return alert('Gagal mengupdate.');
    }

    this.closeModal('modal-edit-mapel');
    await this.loadCurrentRapor();
  }

  validateFormData(type) {
    const idField = `${type}-rapor-id`;
    const mapelField = `${type}-mapel-select`;
    const nilaiField = `${type}-mapel-nilai`;

    const raporId = type === 'edit' ? document.getElementById(idField).value : null;
    const siswa_id = type === 'add' ? this.currentSiswaId : null;
    const mapel_id = document.getElementById(mapelField).value;
    const nilai = parseFloat(document.getElementById(nilaiField).value);
    const semester = type === 'add' ? this.currentSemester : null;

    if (!mapel_id || isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert('Pastikan semua field valid.');
      return null;
    }

    return {
      ...(raporId && { id: raporId }),
      ...(siswa_id && { siswa_id }),
      mapel_id,
      nilai,
      ...(semester && { semester })
    };
  }

  async populateMapelSelects() {
    const { data: options } = await supabase.from('mapel').select('id, nama').order('nama');
    const selects = ['add-mapel-select', 'edit-mapel-select'];
    selects.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;
      select.innerHTML = '';
      options?.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.id;
        option.textContent = opt.nama;
        select.appendChild(option);
      });
    });
  }

  async loadCurrentRapor() {
    if (!this.currentSiswaId) return;
    const { data, error } = await supabase
      .from('rapor')
      .select('*, mapel(nama)')
      .eq('siswa_id', this.currentSiswaId)
      .eq('semester', this.currentSemester);
    if (error) return alert('Gagal mengambil rapor.');
    this.tampilkanRapor(data);
  }

  tampilkanRapor(data = []) {
    const theadRow = document.querySelector('.rapor-table thead tr');
    if (!this.isAuthorized() && theadRow.children.length === 4) {
      theadRow.removeChild(theadRow.lastElementChild);
    }

    const tbody = document.getElementById('tabel-rapor');
    tbody.innerHTML = '';
    let total = 0;

    data.forEach(item => {
      const tr = document.createElement('tr');
      const grade = this.konversiGrade(item.nilai);
      const gradeClass = `grade-${grade.replace('+', 'plus').replace('-', 'minus')}`;

      tr.innerHTML = `
        <td>${item.mapel?.nama || '-'}</td>
        <td>${item.nilai}</td>
        <td class="${gradeClass}">${grade}</td>
        ${this.isAuthorized() ? `<td>
          <button class="btn-edit-mapel" data-id="${item.id}"><i class='bx bx-edit'></i></button>
          <button class="btn-delete-mapel" data-id="${item.id}"><i class='bx bx-trash'></i></button>
        </td>` : ''}
      `;

      tbody.appendChild(tr);
      total += item.nilai;
    });

    document.getElementById('rata-rata-unique').textContent = (total / data.length || 0).toFixed(2);
    this.attachMapelRowEvents();
  }

  konversiGrade(nilai) {
    if (nilai >= 98) return 'A+';
    if (nilai >= 94) return 'A';
    if (nilai >= 90) return 'A-';
    if (nilai >= 86) return 'B+';
    if (nilai >= 82) return 'B';
    if (nilai >= 78) return 'B-';
    if (nilai >= 74) return 'C+';
    if (nilai >= 70) return 'C';
    if (nilai >= 66) return 'C-';
    if (nilai >= 50) return 'D';
    return 'F';
  }

  attachMapelRowEvents() {
    console.log('Attaching events. Role:', this.userRole);
    if (!this.isAuthorized()) return;

    document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
      btn.onclick = async () => {
        console.log('Edit button clicked, raporId:', btn.dataset.id);
        const raporId = btn.dataset.id;
        const { data } = await supabase.from('rapor').select('*').eq('id', raporId).single();
        await this.populateMapelSelects();

        document.getElementById('edit-rapor-id').value = raporId;
        document.getElementById('edit-mapel-select').value = data.mapel_id;
        document.getElementById('edit-mapel-nilai').value = data.nilai;

        const modal = document.getElementById('modal-edit-mapel');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
      };
    });

    document.querySelectorAll('.btn-delete-mapel').forEach(btn => {
      btn.onclick = async () => {
        console.log('Delete button clicked, raporId:', btn.dataset.id);
        const raporId = btn.dataset.id;
        if (confirm('Yakin ingin menghapus data ini?')) {
          await supabase.from('rapor').delete().eq('id', raporId);
          await this.loadCurrentRapor();
          this.attachMapelRowEvents(); // force reattach after delete
        }
      };
    });
  }

  async loadStudentInfo() {
    const { data: siswa } = await supabase.from('siswa').select('nama, kelas_id').eq('id', this.currentSiswaId).single();
    if (!siswa) return;

    const namaElem = document.getElementById('student-name');
    const kelasElem = document.getElementById('student-class');

    namaElem.textContent = siswa.nama || '-';

    if (siswa.kelas_id) {
      const { data: kelas } = await supabase.from('kelas').select('nama').eq('id', siswa.kelas_id).single();
      kelasElem.textContent = kelas?.nama || '-';
    } else {
      kelasElem.textContent = '-';
    }
  }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const raporManager = new RaporManager();
  raporManager.initializePage();
});

// Export the class if needed for testing or external use
export default RaporManager;
