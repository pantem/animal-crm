// Feeding Management Module
const FeedingManager = {
    chart: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('addFeedingBtn')?.addEventListener('click', () => this.showForm());
        document.getElementById('feedingAnimalFilter')?.addEventListener('change', () => this.render());
        document.getElementById('feedingDateFrom')?.addEventListener('change', () => this.render());
        document.getElementById('feedingDateTo')?.addEventListener('change', () => this.render());
    },

    render() {
        this.updateAnimalFilter();
        this.renderStats();
        this.renderTable();
        this.renderChart();
    },

    updateAnimalFilter() {
        const select = document.getElementById('feedingAnimalFilter');
        if (!select) return;

        const current = select.value;
        select.innerHTML = '<option value="">Todos los animales</option>' + AnimalsManager.getSelectOptions();
        select.value = current;
    },

    renderStats() {
        const feedings = DataManager.getAll(DB_KEYS.FEEDING);
        const today = new Date().toISOString().split('T')[0];

        const todayTotal = feedings
            .filter(f => f.date === today)
            .reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const weekTotal = feedings
            .filter(f => new Date(f.date) >= weekStart)
            .reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        const monthTotal = feedings
            .filter(f => new Date(f.date) >= monthStart)
            .reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0);

        document.getElementById('todayFeeding').textContent = `${todayTotal.toFixed(1)} kg`;
        document.getElementById('weekFeeding').textContent = `${weekTotal.toFixed(1)} kg`;
        document.getElementById('monthFeeding').textContent = `${monthTotal.toFixed(1)} kg`;
    },

    renderTable() {
        const tbody = document.getElementById('feedingTableBody');
        if (!tbody) return;

        let feedings = DataManager.getAll(DB_KEYS.FEEDING);
        const animalFilter = document.getElementById('feedingAnimalFilter')?.value || '';
        const dateFrom = document.getElementById('feedingDateFrom')?.value || '';
        const dateTo = document.getElementById('feedingDateTo')?.value || '';

        if (animalFilter) {
            feedings = feedings.filter(f => f.animalId === animalFilter);
        }
        if (dateFrom) {
            feedings = feedings.filter(f => f.date >= dateFrom);
        }
        if (dateTo) {
            feedings = feedings.filter(f => f.date <= dateTo);
        }

        // Sort by date descending
        feedings.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (feedings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-container">
                        <div class="empty-state-icon">🍽️</div>
                        <div class="empty-state-text">No hay registros de alimentación</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = feedings.map(f => this.renderRow(f)).join('');

        tbody.querySelectorAll('.edit-feeding').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-feeding').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderRow(feeding) {
        const animal = DataManager.getById(DB_KEYS.ANIMALS, feeding.animalId);

        return `
            <tr>
                <td>${animal ? `${animal.identifier} - ${animal.name}` : 'N/A'}</td>
                <td>${feeding.foodType}</td>
                <td><strong>${feeding.quantity} ${feeding.unit || 'kg'}</strong></td>
                <td>${new Date(feeding.date).toLocaleDateString('es-ES')}</td>
                <td>${feeding.notes || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-icon edit-feeding" data-id="${feeding.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-feeding" data-id="${feeding.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    renderChart() {
        const canvas = document.getElementById('feedingDetailChart');
        if (!canvas) return;

        const feedings = DataManager.getAll(DB_KEYS.FEEDING);

        // Get last 14 days
        const days = [];
        const data = [];

        for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            days.push(date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));

            const dayTotal = feedings
                .filter(f => f.date === dateStr)
                .reduce((sum, f) => sum + (parseFloat(f.quantity) || 0), 0);

            data.push(dayTotal);
        }

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Consumo (kg)',
                    data: data,
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94A3B8'
                        }
                    }
                }
            }
        });
    },

    showForm(id = null) {
        const feeding = id ? DataManager.getById(DB_KEYS.FEEDING, id) : null;
        const isEdit = !!feeding;

        Modal.show({
            title: isEdit ? 'Editar Registro' : 'Nuevo Registro de Alimentación',
            content: `
                <form id="feedingForm">
                    <div class="form-group">
                        <label class="form-label">Animal *</label>
                        <select class="form-select" name="animalId" required>
                            <option value="">Seleccionar...</option>
                            ${AnimalsManager.getSelectOptions()}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Tipo de Alimento *</label>
                        <input type="text" class="form-input" name="foodType" value="${feeding?.foodType || ''}" required 
                            list="foodTypes" placeholder="Ej: Concentrado, Pasto, Heno">
                        <datalist id="foodTypes">
                            <option value="Concentrado">
                            <option value="Pasto fresco">
                            <option value="Heno">
                            <option value="Ensilaje">
                            <option value="Grano">
                            <option value="Balanceado">
                            <option value="Suplemento mineral">
                        </datalist>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Cantidad *</label>
                            <input type="number" class="form-input" name="quantity" value="${feeding?.quantity || ''}" required step="0.1" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Unidad</label>
                            <select class="form-select" name="unit">
                                <option value="kg" ${feeding?.unit === 'kg' ? 'selected' : ''}>Kilogramos (kg)</option>
                                <option value="lb" ${feeding?.unit === 'lb' ? 'selected' : ''}>Libras (lb)</option>
                                <option value="g" ${feeding?.unit === 'g' ? 'selected' : ''}>Gramos (g)</option>
                                <option value="L" ${feeding?.unit === 'L' ? 'selected' : ''}>Litros (L)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha *</label>
                        <input type="date" class="form-input" name="date" value="${feeding?.date || new Date().toISOString().split('T')[0]}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-textarea" name="notes">${feeding?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: () => {
                const form = document.getElementById('feedingForm');
                const formData = new FormData(form);

                const data = {
                    animalId: formData.get('animalId'),
                    foodType: formData.get('foodType'),
                    quantity: formData.get('quantity'),
                    unit: formData.get('unit'),
                    date: formData.get('date'),
                    notes: formData.get('notes')
                };

                if (!data.animalId || !data.foodType || !data.quantity || !data.date) {
                    Toast.show('Por favor complete los campos requeridos', 'error');
                    return false;
                }

                if (isEdit) {
                    DataManager.update(DB_KEYS.FEEDING, id, data);
                    Toast.show('Registro actualizado correctamente', 'success');
                } else {
                    DataManager.add(DB_KEYS.FEEDING, data);
                    Toast.show('Registro creado correctamente', 'success');
                }

                this.render();
                App.updateDashboard();
                return true;
            }
        });

        // Pre-select animal if editing
        if (feeding?.animalId) {
            setTimeout(() => {
                const select = document.querySelector('[name="animalId"]');
                if (select) select.value = feeding.animalId;
            }, 100);
        }
    },

    delete(id) {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            DataManager.delete(DB_KEYS.FEEDING, id);
            Toast.show('Registro eliminado correctamente', 'success');
            this.render();
            App.updateDashboard();
        }
    }
};
