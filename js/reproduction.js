// Reproduction Management Module
const ReproductionManager = {
    currentMonth: new Date(),
    HEAT_CYCLE_DAYS: 21, // Default heat cycle for cattle
    GESTATION_DAYS: 114, // Gestation period for calculating due date

    // Helper to format date string without timezone issues
    formatDateString(dateStr) {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES');
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

    async render() {
        await this.renderHeatTable();
        await this.renderInseminationTable();
        await this.renderCalendar();
    },

    async renderHeatTable() {
        const tbody = document.getElementById('heatTableBody');
        if (!tbody) return;

        const reproductions = await DataManager.getAll(DB_KEYS.REPRODUCTION);
        const animals = await DataManager.getAll(DB_KEYS.ANIMALS);
        let heats = reproductions.filter(r => r.type === 'heat');
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

        tbody.innerHTML = heats.map(h => this.renderHeatRow(h, animals)).join('');

        tbody.querySelectorAll('.edit-heat').forEach(btn => {
            btn.addEventListener('click', () => this.showHeatForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-heat').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderHeatRow(heat, animals = []) {
        const animal = animals.find(a => a._id === heat.animalId || a.id === heat.animalId);
        const nextHeat = heat.nextHeatDate || this.calculateNextHeat(heat.date);
        const dueDate = heat.dueDate || this.calculateDueDate(heat.date);
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
                        <button class="btn btn-icon edit-heat" data-id="${heat._id || heat.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-heat" data-id="${heat._id || heat.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    async renderInseminationTable() {
        const tbody = document.getElementById('inseminationTableBody');
        if (!tbody) return;

        const reproductions = await DataManager.getAll(DB_KEYS.REPRODUCTION);
        const animals = await DataManager.getAll(DB_KEYS.ANIMALS);
        let inseminations = reproductions.filter(r => r.type === 'insemination');
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

        tbody.innerHTML = inseminations.map(i => this.renderInseminationRow(i, animals)).join('');

        tbody.querySelectorAll('.edit-insemination').forEach(btn => {
            btn.addEventListener('click', () => this.showInseminationForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-insemination').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderInseminationRow(insemination, animals = []) {
        const animal = animals.find(a => a._id === insemination.animalId || a.id === insemination.animalId);
        const methodLabels = { natural: 'Natural', artificial: 'Artificial' };
        const resultLabels = { pending: 'Pendiente', success: 'Exitosa', failed: 'Fallida' };
        const dueDate = insemination.dueDate || this.calculateDueDate(insemination.date);

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
                        <button class="btn btn-icon edit-insemination" data-id="${insemination._id || insemination.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-insemination" data-id="${insemination._id || insemination.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    async showHeatForm(id = null) {
        const heat = id ? await DataManager.getById(DB_KEYS.REPRODUCTION, id) : null;
        const isEdit = !!heat;
        const animalOptions = await AnimalsManager.getSelectOptions('female');

        Modal.show({
            title: isEdit ? 'Editar Registro de Celo' : 'Nuevo Registro de Celo',
            content: `
                <form id="heatForm">
                    <div class="form-group">
                        <label class="form-label">Animal (Hembra) *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha de Celo *</label>
                            <input type="date" class="form-input" name="date" value="${heat?.date ? heat.date.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
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
            onConfirm: async () => {
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

                try {
                    if (isEdit) {
                        await DataManager.update(DB_KEYS.REPRODUCTION, id, data);
                        Toast.show('Registro actualizado correctamente', 'success');
                    } else {
                        await DataManager.add(DB_KEYS.REPRODUCTION, data);
                        Toast.show('Celo registrado correctamente', 'success');
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

        if (heat?.animalId) {
            setTimeout(() => {
                const select = document.querySelector('[name="animalId"]');
                if (select) select.value = heat.animalId;
            }, 100);
        }
    },

    async showInseminationForm(id = null) {
        const insemination = id ? await DataManager.getById(DB_KEYS.REPRODUCTION, id) : null;
        const isEdit = !!insemination;
        const animalOptions = await AnimalsManager.getSelectOptions('female');

        Modal.show({
            title: isEdit ? 'Editar Inseminación' : 'Nueva Inseminación',
            content: `
                <form id="inseminationForm">
                    <div class="form-group">
                        <label class="form-label">Animal (Hembra) *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha *</label>
                            <input type="date" class="form-input" name="date" value="${insemination?.date ? insemination.date.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
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
            onConfirm: async () => {
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

                try {
                    if (isEdit) {
                        await DataManager.update(DB_KEYS.REPRODUCTION, id, data);
                        Toast.show('Registro actualizado correctamente', 'success');
                    } else {
                        await DataManager.add(DB_KEYS.REPRODUCTION, data);
                        Toast.show('Inseminación registrada correctamente', 'success');
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

        if (insemination?.animalId) {
            setTimeout(() => {
                const select = document.querySelector('[name="animalId"]');
                if (select) select.value = insemination.animalId;
            }, 100);
        }
    },

    async delete(id) {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            try {
                await DataManager.delete(DB_KEYS.REPRODUCTION, id);
                Toast.show('Registro eliminado correctamente', 'success');
                await this.render();
                await App.updateDashboard();
            } catch (error) {
                Toast.show(error.message, 'error');
            }
        }
    },

    calculateNextHeat(dateStr) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + this.HEAT_CYCLE_DAYS);
        return date.toISOString();
    },

    calculateDueDate(dateStr) {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + this.GESTATION_DAYS);
        return date.toISOString();
    },

    changeMonth(delta) {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
        this.renderCalendar();
    },

    async renderCalendar() {
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

        // Get reproduction events
        const reproductions = await DataManager.getAll(DB_KEYS.REPRODUCTION);
        const animals = await DataManager.getAll(DB_KEYS.ANIMALS);
        const heats = reproductions.filter(r => r.type === 'heat');
        const inseminations = reproductions.filter(r => r.type === 'insemination');

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

            const dayHeats = heats.filter(h => h.date && h.date.split('T')[0] === dateStr);
            const dayInseminations = inseminations.filter(i => i.date && i.date.split('T')[0] === dateStr);

            let eventDots = '';
            dayHeats.forEach(h => {
                const animal = animals.find(a => a._id === h.animalId || a.id === h.animalId);
                const animalName = animal ? `${animal.identifier} - ${animal.name}` : 'Animal desconocido';
                eventDots += `<span class="event-dot heat" title="❤️ Celo: ${animalName}"></span>`;
            });
            dayInseminations.forEach(i => {
                const animal = animals.find(a => a._id === i.animalId || a.id === i.animalId);
                const animalName = animal ? `${animal.identifier} - ${animal.name}` : 'Animal desconocido';
                eventDots += `<span class="event-dot insemination" title="🧬 Inseminación: ${animalName}"></span>`;
            });

            html += `
                <div class="calendar-day ${isToday ? 'today' : ''}">
                    <span>${day}</span>
                    ${eventDots ? `<div class="events">${eventDots}</div>` : ''}
                </div>
            `;
        }

        calendar.innerHTML = html;
    },

    async getUpcomingEvents() {
        const result = await DataManager.getUpcomingHeats(14);
        return result.success ? result.data : [];
    }
};
