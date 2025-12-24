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

    async render() {
        await this.updateAnimalFilter();
        await this.renderTable();
        await this.renderCalendar();
    },

    async updateAnimalFilter() {
        const select = document.getElementById('vaccinationAnimalFilter');
        if (!select) return;

        const current = select.value;
        const options = await AnimalsManager.getSelectOptions();
        select.innerHTML = '<option value="">Todos los animales</option>' + options;
        select.value = current;
    },

    async renderTable() {
        const tbody = document.getElementById('vaccinationsTableBody');
        if (!tbody) return;

        let vaccinations = await DataManager.getAll(DB_KEYS.VACCINATIONS);
        const animals = await DataManager.getAll(DB_KEYS.ANIMALS);
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

        tbody.innerHTML = vaccinations.map(v => this.renderRow(v, animals)).join('');

        tbody.querySelectorAll('.edit-vaccination').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-vaccination').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderRow(vaccination, animals = []) {
        const animal = animals.find(a => a._id === vaccination.animalId || a.id === vaccination.animalId);
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
                        <button class="btn btn-icon edit-vaccination" data-id="${vaccination._id || vaccination.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-vaccination" data-id="${vaccination._id || vaccination.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    async showForm(id = null) {
        const vaccination = id ? await DataManager.getById(DB_KEYS.VACCINATIONS, id) : null;
        const isEdit = !!vaccination;
        const animalOptions = await AnimalsManager.getSelectOptions();

        Modal.show({
            title: isEdit ? 'Editar Vacunación' : 'Nueva Vacunación',
            content: `
                <form id="vaccinationForm">
                    <div class="form-group">
                        <label class="form-label">Animal *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nombre de la Vacuna *</label>
                        <input type="text" class="form-input" name="vaccineName" value="${vaccination?.vaccineName || ''}" required placeholder="Ej: Aftosa, Brucelosis">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha de Aplicación *</label>
                            <input type="date" class="form-input" name="applicationDate" value="${vaccination?.applicationDate ? vaccination.applicationDate.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Próxima Dosis</label>
                            <input type="date" class="form-input" name="nextDoseDate" value="${vaccination?.nextDoseDate ? vaccination.nextDoseDate.split('T')[0] : ''}">
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
            onConfirm: async () => {
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

                try {
                    if (isEdit) {
                        await DataManager.update(DB_KEYS.VACCINATIONS, id, data);
                        Toast.show('Vacunación actualizada correctamente', 'success');
                    } else {
                        await DataManager.add(DB_KEYS.VACCINATIONS, data);
                        Toast.show('Vacunación registrada correctamente', 'success');
                    }

                    await this.render();
                    await App.updateDashboard();
                    return true;
                } catch (error) {
                    Toast.show(error.message, 'error');
                    return false;
                }
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

    async delete(id) {
        if (confirm('¿Está seguro de eliminar este registro de vacunación?')) {
            try {
                await DataManager.delete(DB_KEYS.VACCINATIONS, id);
                Toast.show('Registro eliminado correctamente', 'success');
                await this.render();
                await App.updateDashboard();
            } catch (error) {
                Toast.show(error.message, 'error');
            }
        }
    },

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    },

    async renderCalendar() {
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
        const allVaccinations = await DataManager.getAll(DB_KEYS.VACCINATIONS);
        const vaccinations = allVaccinations.filter(v => {
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

            const dayVaccinations = vaccinations.filter(v => v.nextDoseDate && v.nextDoseDate.split('T')[0] === dateStr);

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

    async getPendingVaccinations() {
        const result = await DataManager.getPendingVaccinations(7);
        return result.success ? result.data : [];
    }
};
