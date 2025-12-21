// Reproduction Management Module
const ReproductionManager = {
    currentMonth: new Date(),
    HEAT_CYCLE_DAYS: 21, // Default heat cycle for cattle
    GESTATION_DAYS: 114, // Gestation period for calculating due date

    // Helper to format date string without timezone issues
    formatDateString(dateStr) {
        if (!dateStr) return 'N/A';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('addHeatBtn')?.addEventListener('click', () => this.showHeatForm());
        document.getElementById('addInseminationBtn')?.addEventListener('click', () => this.showInseminationForm());
        document.getElementById('prevReproMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextReproMonth')?.addEventListener('click', () => this.changeMonth(1));

        // Tab handling
        document.querySelectorAll('[data-tab^="heat"], [data-tab^="insemination"], [data-tab^="reproduction-calendar"]').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
    },

    switchTab(tabId) {
        document.querySelectorAll('#reproductionPage .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('#reproductionPage .tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');

        if (tabId === 'reproduction-calendar') {
            this.renderCalendar();
        }
    },

    render() {
        this.renderHeatTable();
        this.renderInseminationTable();
        this.renderCalendar();
    },

    renderHeatTable() {
        const tbody = document.getElementById('heatTableBody');
        if (!tbody) return;

        let heats = DataManager.getAll(DB_KEYS.REPRODUCTION).filter(r => r.type === 'heat');
        heats.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (heats.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state-container">
                        <div class="empty-state-icon">❤️</div>
                        <div class="empty-state-text">No hay registros de celo</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = heats.map(h => this.renderHeatRow(h)).join('');

        tbody.querySelectorAll('.edit-heat').forEach(btn => {
            btn.addEventListener('click', () => this.showHeatForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-heat').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderHeatRow(heat) {
        const animal = DataManager.getById(DB_KEYS.ANIMALS, heat.animalId);
        const nextHeat = this.calculateNextHeat(heat.date);
        const dueDate = this.calculateDueDate(heat.date);
        const intensityLabels = { low: 'Baja', medium: 'Media', high: 'Alta' };

        return `
            <tr>
                <td>${animal ? `${animal.identifier} - ${animal.name}` : 'N/A'}</td>
                <td>${this.formatDateString(heat.date)}</td>
                <td><span class="status-badge pending">${this.formatDateString(nextHeat)}</span></td>
                <td><span class="status-badge success">🐣 ${this.formatDateString(dueDate)}</span></td>
                <td>${intensityLabels[heat.intensity] || '-'}</td>
                <td>${heat.notes || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-icon edit-heat" data-id="${heat.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-heat" data-id="${heat.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    renderInseminationTable() {
        const tbody = document.getElementById('inseminationTableBody');
        if (!tbody) return;

        let inseminations = DataManager.getAll(DB_KEYS.REPRODUCTION).filter(r => r.type === 'insemination');
        inseminations.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (inseminations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-container">
                        <div class="empty-state-icon">🧬</div>
                        <div class="empty-state-text">No hay registros de inseminación</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = inseminations.map(i => this.renderInseminationRow(i)).join('');

        tbody.querySelectorAll('.edit-insemination').forEach(btn => {
            btn.addEventListener('click', () => this.showInseminationForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-insemination').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderInseminationRow(insemination) {
        const animal = DataManager.getById(DB_KEYS.ANIMALS, insemination.animalId);
        const methodLabels = { natural: 'Natural', artificial: 'Artificial' };
        const resultLabels = { pending: 'Pendiente', success: 'Exitosa', failed: 'Fallida' };
        const dueDate = this.calculateDueDate(insemination.date);

        return `
            <tr>
                <td>${animal ? `${animal.identifier} - ${animal.name}` : 'N/A'}</td>
                <td>${this.formatDateString(insemination.date)}</td>
                <td>${methodLabels[insemination.method] || '-'}</td>
                <td>${insemination.sireCode || '-'}</td>
                <td><span class="status-badge success">🐣 ${this.formatDateString(dueDate)}</span></td>
                <td><span class="status-badge ${insemination.result || 'pending'}">${resultLabels[insemination.result] || 'Pendiente'}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-icon edit-insemination" data-id="${insemination.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-insemination" data-id="${insemination.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    showHeatForm(id = null) {
        const heat = id ? DataManager.getById(DB_KEYS.REPRODUCTION, id) : null;
        const isEdit = !!heat;

        Modal.show({
            title: isEdit ? 'Editar Registro de Celo' : 'Nuevo Registro de Celo',
            content: `
                <form id="heatForm">
                    <div class="form-group">
                        <label class="form-label">Animal (Hembra) *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${AnimalsManager.getSelectOptions('female')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha de Celo *</label>
                            <input type="date" class="form-input" name="date" value="${heat?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Intensidad</label>
                            <select class="form-select" name="intensity">
                                <option value="">Seleccionar...</option>
                                <option value="low" ${heat?.intensity === 'low' ? 'selected' : ''}>Baja</option>
                                <option value="medium" ${heat?.intensity === 'medium' ? 'selected' : ''}>Media</option>
                                <option value="high" ${heat?.intensity === 'high' ? 'selected' : ''}>Alta</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Signos Observados</label>
                        <textarea class="form-textarea" name="notes" placeholder="Ej: Monta a otras hembras, mucosidad, inquietud...">${heat?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: () => {
                const form = document.getElementById('heatForm');
                const formData = new FormData(form);

                const data = {
                    type: 'heat',
                    animalId: formData.get('animalId'),
                    date: formData.get('date'),
                    intensity: formData.get('intensity'),
                    notes: formData.get('notes')
                };

                if (!data.animalId || !data.date) {
                    Toast.show('Por favor complete los campos requeridos', 'error');
                    return false;
                }

                if (isEdit) {
                    DataManager.update(DB_KEYS.REPRODUCTION, id, data);
                    Toast.show('Registro actualizado correctamente', 'success');
                } else {
                    DataManager.add(DB_KEYS.REPRODUCTION, data);
                    Toast.show('Celo registrado correctamente', 'success');
                }

                this.render();
                App.updateDashboard();
                return true;
            }
        });

        if (heat?.animalId) {
            setTimeout(() => {
                const select = document.querySelector('[name="animalId"]');
                if (select) select.value = heat.animalId;
            }, 100);
        }
    },

    showInseminationForm(id = null) {
        const insemination = id ? DataManager.getById(DB_KEYS.REPRODUCTION, id) : null;
        const isEdit = !!insemination;

        Modal.show({
            title: isEdit ? 'Editar Inseminación' : 'Nueva Inseminación',
            content: `
                <form id="inseminationForm">
                    <div class="form-group">
                        <label class="form-label">Animal (Hembra) *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${AnimalsManager.getSelectOptions('female')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha *</label>
                            <input type="date" class="form-input" name="date" value="${insemination?.date || new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Método</label>
                            <select class="form-select" name="method">
                                <option value="artificial" ${insemination?.method === 'artificial' ? 'selected' : ''}>Artificial</option>
                                <option value="natural" ${insemination?.method === 'natural' ? 'selected' : ''}>Natural</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Semental / Código de Pajilla</label>
                            <input type="text" class="form-input" name="sireCode" value="${insemination?.sireCode || ''}" placeholder="Ej: TORO-001 o código de pajilla">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Resultado</label>
                            <select class="form-select" name="result">
                                <option value="pending" ${insemination?.result === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="success" ${insemination?.result === 'success' ? 'selected' : ''}>Exitosa (Preñada)</option>
                                <option value="failed" ${insemination?.result === 'failed' ? 'selected' : ''}>Fallida</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Técnico Inseminador</label>
                        <input type="text" class="form-input" name="technician" value="${insemination?.technician || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-textarea" name="notes">${insemination?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: () => {
                const form = document.getElementById('inseminationForm');
                const formData = new FormData(form);

                const data = {
                    type: 'insemination',
                    animalId: formData.get('animalId'),
                    date: formData.get('date'),
                    method: formData.get('method'),
                    sireCode: formData.get('sireCode'),
                    result: formData.get('result'),
                    technician: formData.get('technician'),
                    notes: formData.get('notes')
                };

                if (!data.animalId || !data.date) {
                    Toast.show('Por favor complete los campos requeridos', 'error');
                    return false;
                }

                if (isEdit) {
                    DataManager.update(DB_KEYS.REPRODUCTION, id, data);
                    Toast.show('Registro actualizado correctamente', 'success');
                } else {
                    DataManager.add(DB_KEYS.REPRODUCTION, data);
                    Toast.show('Inseminación registrada correctamente', 'success');
                }

                this.render();
                App.updateDashboard();
                return true;
            }
        });

        if (insemination?.animalId) {
            setTimeout(() => {
                const select = document.querySelector('[name="animalId"]');
                if (select) select.value = insemination.animalId;
            }, 100);
        }
    },

    delete(id) {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            DataManager.delete(DB_KEYS.REPRODUCTION, id);
            Toast.show('Registro eliminado correctamente', 'success');
            this.render();
            App.updateDashboard();
        }
    },

    calculateNextHeat(lastHeatDate) {
        const parts = lastHeatDate.split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setDate(date.getDate() + this.HEAT_CYCLE_DAYS);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    calculateDueDate(dateStr) {
        const parts = dateStr.split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setDate(date.getDate() + this.GESTATION_DAYS);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    },

    renderCalendar() {
        const calendar = document.getElementById('reproductionCalendar');
        const monthLabel = document.getElementById('currentReproMonth');
        if (!calendar || !monthLabel) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();

        monthLabel.textContent = new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        // Get reproduction events and predicted heats
        const reproductions = DataManager.getAll(DB_KEYS.REPRODUCTION);
        const heats = reproductions.filter(r => r.type === 'heat');
        const inseminations = reproductions.filter(r => r.type === 'insemination');

        // Calculate predicted heats
        const predictedHeats = heats.map(h => ({
            animalId: h.animalId,
            date: this.calculateNextHeat(h.date).toISOString().split('T')[0]
        }));

        // Build calendar
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let html = days.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day other-month"></div>';
        }

        const today = new Date();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = date.toDateString() === today.toDateString();

            const dayHeats = heats.filter(h => h.date === dateStr);
            const dayInseminations = inseminations.filter(i => i.date === dateStr);
            const dayPredicted = predictedHeats.filter(p => p.date === dateStr);

            let eventDots = '';
            dayHeats.forEach(() => eventDots += '<span class="event-dot heat"></span>');
            dayInseminations.forEach(() => eventDots += '<span class="event-dot insemination"></span>');
            dayPredicted.forEach(() => eventDots += '<span class="event-dot predicted"></span>');

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <span>${day}</span>
                    ${eventDots ? `<div class="events">${eventDots}</div>` : ''}
                </div>
            `;
        }

        calendar.innerHTML = html;
    },

    getUpcomingEvents() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 14);

        const heats = DataManager.getAll(DB_KEYS.REPRODUCTION).filter(r => r.type === 'heat');

        return heats.map(h => {
            const animal = DataManager.getById(DB_KEYS.ANIMALS, h.animalId);
            const predictedDate = this.calculateNextHeat(h.date);
            return { animal, predictedDate, type: 'predicted_heat' };
        }).filter(e => e.predictedDate >= today && e.predictedDate <= nextWeek)
            .sort((a, b) => a.predictedDate - b.predictedDate);
    }
};
