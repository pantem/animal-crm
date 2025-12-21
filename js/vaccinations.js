// Vaccinations Management Module
const VaccinationsManager = {
    currentMonth: new Date(),

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('addVaccinationBtn')?.addEventListener('click', () => this.showForm());
        document.getElementById('vaccinationSearch')?.addEventListener('input', () => this.render());
        document.getElementById('vaccinationAnimalFilter')?.addEventListener('change', () => this.render());
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));

        // Tab handling
        document.querySelectorAll('[data-tab^="vaccinations"]').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    },

    switchTab(tabId) {
        document.querySelectorAll('#vaccinationsPage .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#vaccinationsPage .tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        if (tabId === 'vaccinations-calendar') {
            this.renderCalendar();
        }
    },

    render() {
        this.updateAnimalFilter();
        this.renderTable();
        this.renderCalendar();
    },

    updateAnimalFilter() {
        const select = document.getElementById('vaccinationAnimalFilter');
        if (!select) return;

        const current = select.value;
        select.innerHTML = '<option value="">Todos los animales</option>' + AnimalsManager.getSelectOptions();
        select.value = current;
    },

    renderTable() {
        const tbody = document.getElementById('vaccinationsTableBody');
        if (!tbody) return;

        let vaccinations = DataManager.getAll(DB_KEYS.VACCINATIONS);
        const search = document.getElementById('vaccinationSearch')?.value.toLowerCase() || '';
        const animalFilter = document.getElementById('vaccinationAnimalFilter')?.value || '';

        if (search) {
            vaccinations = vaccinations.filter(v =>
                v.vaccineName.toLowerCase().includes(search) ||
                v.veterinarian?.toLowerCase().includes(search)
            );
        }
        if (animalFilter) {
            vaccinations = vaccinations.filter(v => v.animalId === animalFilter);
        }

        // Sort by date descending
        vaccinations.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

        if (vaccinations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-container">
                        <div class="empty-state-icon">💉</div>
                        <div class="empty-state-text">No hay vacunaciones registradas</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = vaccinations.map(v => this.renderRow(v)).join('');

        tbody.querySelectorAll('.edit-vaccination').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-vaccination').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderRow(vaccination) {
        const animal = DataManager.getById(DB_KEYS.ANIMALS, vaccination.animalId);
        const isPending = vaccination.nextDoseDate && new Date(vaccination.nextDoseDate) > new Date();
        const isOverdue = vaccination.nextDoseDate && new Date(vaccination.nextDoseDate) < new Date();

        return `
            <tr>
                <td>${animal ? `${animal.identifier} - ${animal.name}` : 'N/A'}</td>
                <td><strong>${vaccination.vaccineName}</strong></td>
                <td>${new Date(vaccination.applicationDate).toLocaleDateString('es-ES')}</td>
                <td>
                    ${vaccination.nextDoseDate ? `
                        <span class="status-badge ${isOverdue ? 'failed' : 'pending'}">
                            ${new Date(vaccination.nextDoseDate).toLocaleDateString('es-ES')}
                        </span>
                    ` : '-'}
                </td>
                <td>${vaccination.veterinarian || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-icon edit-vaccination" data-id="${vaccination.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-vaccination" data-id="${vaccination.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    showForm(id = null) {
        const vaccination = id ? DataManager.getById(DB_KEYS.VACCINATIONS, id) : null;
        const isEdit = !!vaccination;

        Modal.show({
            title: isEdit ? 'Editar Vacunación' : 'Nueva Vacunación',
            content: `
                <form id="vaccinationForm">
                    <div class="form-group">
                        <label class="form-label">Animal *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${AnimalsManager.getSelectOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nombre de la Vacuna *</label>
                        <input type="text" class="form-input" name="vaccineName" value="${vaccination?.vaccineName || ''}" required placeholder="Ej: Aftosa, Brucelosis">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha de Aplicación *</label>
                            <input type="date" class="form-input" name="applicationDate" value="${vaccination?.applicationDate || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Próxima Dosis</label>
                            <input type="date" class="form-input" name="nextDoseDate" value="${vaccination?.nextDoseDate || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Veterinario</label>
                        <input type="text" class="form-input" name="veterinarian" value="${vaccination?.veterinarian || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Lote</label>
                        <input type="text" class="form-input" name="batch" value="${vaccination?.batch || ''}" placeholder="Número de lote de la vacuna">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-textarea" name="notes">${vaccination?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: () => {
                const form = document.getElementById('vaccinationForm');
                const formData = new FormData(form);

                const data = {
                    animalId: formData.get('animalId'),
                    vaccineName: formData.get('vaccineName'),
                    applicationDate: formData.get('applicationDate'),
                    nextDoseDate: formData.get('nextDoseDate'),
                    veterinarian: formData.get('veterinarian'),
                    batch: formData.get('batch'),
                    notes: formData.get('notes')
                };

                if (!data.animalId || !data.vaccineName || !data.applicationDate) {
                    Toast.show('Por favor complete los campos requeridos', 'error');
                    return false;
                }

                if (isEdit) {
                    DataManager.update(DB_KEYS.VACCINATIONS, id, data);
                    Toast.show('Vacunación actualizada correctamente', 'success');
                } else {
                    DataManager.add(DB_KEYS.VACCINATIONS, data);
                    Toast.show('Vacunación registrada correctamente', 'success');
                }

                this.render();
                App.updateDashboard();
                return true;
            }
        });

        // Pre-select animal if editing
        if (vaccination?.animalId) {
            setTimeout(() => {
                const select = document.querySelector('[name="animalId"]');
                if (select) select.value = vaccination.animalId;
            }, 100);
        }
    },

    delete(id) {
        if (confirm('¿Está seguro de eliminar este registro de vacunación?')) {
            DataManager.delete(DB_KEYS.VACCINATIONS, id);
            Toast.show('Registro eliminado correctamente', 'success');
            this.render();
            App.updateDashboard();
        }
    },

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    },

    renderCalendar() {
        const calendar = document.getElementById('vaccinationCalendar');
        const monthLabel = document.getElementById('currentMonth');
        if (!calendar || !monthLabel) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        monthLabel.textContent = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Get vaccinations for this month
        const vaccinations = DataManager.getAll(DB_KEYS.VACCINATIONS).filter(v => {
            if (v.nextDoseDate) {
                const date = new Date(v.nextDoseDate);
                return date.getMonth() === month && date.getFullYear() === year;
            }
            return false;
        });

        // Build calendar
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let html = days.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

        // Empty cells for days before month starts
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }

        const today = new Date();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = date.toDateString() === today.toDateString();

            const dayVaccinations = vaccinations.filter(v => v.nextDoseDate === dateStr);

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <span>${day}</span>
                    ${dayVaccinations.length > 0 ? `
                        <div class="events">
                            ${dayVaccinations.map(() => '<span class="event-dot" style="background: var(--primary);"></span>').join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        calendar.innerHTML = html;
    },

    getPendingVaccinations() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return DataManager.getAll(DB_KEYS.VACCINATIONS).filter(v => {
            if (!v.nextDoseDate) return false;
            const nextDate = new Date(v.nextDoseDate);
            return nextDate >= today && nextDate <= nextWeek;
        }).map(v => {
            const animal = DataManager.getById(DB_KEYS.ANIMALS, v.animalId);
            return { ...v, animal };
        });
    }
};
