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

    console.log('Setting up form listeners. Form add exists:', !!formAdd, 'Form edit exists:', !!formEdit);
    
    if (formAdd) {
      formAdd.addEventListener('submit', this.handleAddSubmit.bind(this));
      console.log('Added submit listener to form-add-mapel');
    }
    if (formEdit) {
      formEdit.addEventListener('submit', this.handleEditSubmit.bind(this));
      console.log('Added submit listener to form-edit-mapel');
    }
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
    console.log('Handle add submit called');
    const formData = this.validateFormData('add');
    if (!formData) return;

    console.log('Inserting new rapor:', formData);
    const { error } = await supabase.from('rapor').insert([formData]);
    if (error) {
      console.error('Add error:', error);
      return alert('Gagal menambahkan.');
    }

    console.log('Add successful');
    this.closeModal('modal-add-mapel');
    await this.loadCurrentRapor();
    this.attachMapelRowEvents(); // force reattach after add
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    console.log('Handle edit submit called');
    const formData = this.validateFormData('edit');
    if (!formData) {
      console.log('Form validation failed, not submitting');
      return;
    }

    // Extract the ID and create data object without ID for update
    const { id, ...updateData } = formData;
    
    console.log('Updating rapor with ID:', id, 'Data:', updateData);

    const { data, error } = await supabase
      .from('rapor')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Edit error:', error);
      alert('Gagal mengupdate: ' + error.message);
      return;
    }

    console.log('Update successful for rapor ID:', id, 'Response data:', data);
    this.closeModal('modal-edit-mapel');
    await this.loadCurrentRapor();
    this.attachMapelRowEvents(); // force reattach after edit
  }

  validateFormData(type) {
    const idField = `${type}-rapor-id`;
    const mapelField = `${type}-mapel-select`;
    const nilaiField = `${type}-mapel-nilai`;

    // Get values from form elements
    const raporId = type === 'edit' ? document.getElementById(idField)?.value : null;
    const siswa_id = type === 'add' ? this.currentSiswaId : null;
    const mapel_id = document.getElementById(mapelField)?.value;
    const nilaiInput = document.getElementById(nilaiField)?.value;
    const nilai = parseFloat(nilaiInput);
    const semester = type === 'add' ? this.currentSemester : null;

    // Validate required fields
    if (!mapel_id || !nilaiInput) {
      alert('Pastikan semua field diisi.');
      return null;
    }

    // Validate nilai range
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert('Nilai harus antara 0 dan 100.');
      return null;
    }

    console.log(`Form data for ${type}:`, { raporId, siswa_id, mapel_id, nilai, semester });

    const result = {
      ...(raporId && { id: raporId }),
      ...(siswa_id && { siswa_id }),
      mapel_id,
      nilai,
      ...(semester && { semester })
    };

    console.log(`Validated form data for ${type}:`, result);
    return result;
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
    console.log('Loading current rapor for siswa:', this.currentSiswaId, 'semester:', this.currentSemester);
    if (!this.currentSiswaId) {
      console.log('No currentSiswaId, skipping rapor load');
      return;
    }
    const { data, error } = await supabase
      .from('rapor')
      .select('*, mapel(nama)')
      .eq('siswa_id', this.currentSiswaId)
      .eq('semester', this.currentSemester);
    if (error) {
      console.error('Error loading rapor:', error);
      return alert('Gagal mengambil rapor.');
    }
    console.log('Loaded rapor data:', data);
    this.tampilkanRapor(data);
  }

  tampilkanRapor(data = []) {
    console.log('Rendering rapor data:', data);
    const theadRow = document.querySelector('.rapor-table thead tr');
    if (!this.isAuthorized() && theadRow.children.length === 4) {
      theadRow.removeChild(theadRow.lastElementChild);
    }

    const tbody = document.getElementById('tabel-rapor');
    if (!tbody) {
      console.error('Table body element not found');
      return;
    }
    
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

    console.log('Rendered', data.length, 'rapor items');
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
    if (!this.isAuthorized()) {
      console.log('User not authorized, skipping event attachment');
      return;
    }

    const editButtons = document.querySelectorAll('.btn-edit-mapel');
    const deleteButtons = document.querySelectorAll('.btn-delete-mapel');
    
    console.log('Found', editButtons.length, 'edit buttons and', deleteButtons.length, 'delete buttons');
    
    editButtons.forEach(btn => {
      btn.onclick = async () => {
        console.log('Edit button clicked, raporId:', btn.dataset.id);
        const raporId = btn.dataset.id;
        if (!raporId) {
          console.error('No raporId found in button data');
          alert('ID data tidak ditemukan.');
          return;
        }
        
        const { data, error } = await supabase.from('rapor').select('*').eq('id', raporId).single();
        
        if (error) {
          console.error('Error fetching rapor data:', error);
          alert('Gagal mengambil data.');
          return;
        }
        
        console.log('Fetched rapor data:', data);
        await this.populateMapelSelects();

        const idElement = document.getElementById('edit-rapor-id');
        const mapelElement = document.getElementById('edit-mapel-select');
        const nilaiElement = document.getElementById('edit-mapel-nilai');
        
        if (!idElement || !mapelElement || !nilaiElement) {
          console.error('Edit form elements not found');
          alert('Form edit tidak ditemukan.');
          return;
        }
        
        idElement.value = raporId;
        mapelElement.value = data.mapel_id;
        nilaiElement.value = data.nilai;
        
        console.log('Pre-filled edit form with:', { 
          id: raporId, 
          mapel_id: data.mapel_id, 
          nilai: data.nilai 
        });

        const modal = document.getElementById('modal-edit-mapel');
        if (!modal) {
          console.error('Edit modal not found');
          alert('Modal edit tidak ditemukan.');
          return;
        }
        
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
      };
    });

    deleteButtons.forEach(btn => {
      btn.onclick = async () => {
        console.log('Delete button clicked, raporId:', btn.dataset.id);
        const raporId = btn.dataset.id;
        if (confirm('Yakin ingin menghapus data ini?')) {
          console.log('Deleting rapor with ID:', raporId);
          const { error } = await supabase.from('rapor').delete().eq('id', raporId);
          
          if (error) {
            console.error('Delete error:', error);
            alert('Gagal menghapus data.');
            return;
          }
          
          console.log('Delete successful for rapor ID:', raporId);
          await this.loadCurrentRapor();
          this.attachMapelRowEvents(); // force reattach after delete
        }
      };
    });
    
    console.log('Finished attaching events');
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
