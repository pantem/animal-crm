// Animals Management Module
const AnimalsManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('addAnimalBtn')?.addEventListener('click', () => this.showForm());
        document.getElementById('animalSearch')?.addEventListener('input', (e) => this.filter());
        document.getElementById('speciesFilter')?.addEventListener('change', () => this.filter());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filter());
    },

    render() {
        this.updateSpeciesFilter();
        const animals = this.getFilteredAnimals();
        const tbody = document.getElementById('animalsTableBody');
        if (!tbody) return;

        if (animals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-container">
                        <div class="empty-state-icon">🐄</div>
                        <div class="empty-state-text">No hay animales registrados</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = animals.map(a => this.renderRow(a)).join('');

        tbody.querySelectorAll('.view-animal').forEach(btn => {
            btn.addEventListener('click', () => this.showDetails(btn.dataset.id));
        });
        tbody.querySelectorAll('.edit-animal').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });
        tbody.querySelectorAll('.delete-animal').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
    },

    renderRow(animal) {
        const species = DataManager.getById(DB_KEYS.SPECIES, animal.speciesId);
        const statusClass = animal.status || 'active';
        const statusLabels = { active: 'Activo', sold: 'Vendido', deceased: 'Fallecido' };

        return `
            <tr>
                <td><strong>${animal.identifier}</strong></td>
                <td>${animal.name}</td>
                <td>${species ? `${species.icon} ${species.name}` : 'N/A'}</td>
                <td>${animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('es-ES') : 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusLabels[statusClass]}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-icon view-animal" data-id="${animal.id}" title="Ver detalles">👁️</button>
                        <button class="btn btn-icon edit-animal" data-id="${animal.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-animal" data-id="${animal.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    getFilteredAnimals() {
        let animals = DataManager.getAll(DB_KEYS.ANIMALS);
        const search = document.getElementById('animalSearch')?.value.toLowerCase() || '';
        const speciesFilter = document.getElementById('speciesFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';

        if (search) {
            animals = animals.filter(a =>
                a.name.toLowerCase().includes(search) ||
                a.identifier.toLowerCase().includes(search)
            );
        }
        if (speciesFilter) {
            animals = animals.filter(a => a.speciesId === speciesFilter);
        }
        if (statusFilter) {
            animals = animals.filter(a => a.status === statusFilter);
        }

        return animals;
    },

    filter() {
        this.render();
    },

    updateSpeciesFilter() {
        const select = document.getElementById('speciesFilter');
        if (!select) return;

        const current = select.value;
        select.innerHTML = '<option value="">Todas las especies</option>' + SpeciesManager.getSelectOptions();
        select.value = current;
    },

    showForm(id = null) {
        const animal = id ? DataManager.getById(DB_KEYS.ANIMALS, id) : null;
        const isEdit = !!animal;
        const species = DataManager.getAll(DB_KEYS.SPECIES);

        Modal.show({
            title: isEdit ? 'Editar Animal' : 'Nuevo Animal',
            content: `
                <form id="animalForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Identificador *</label>
                            <input type="text" class="form-input" name="identifier" value="${animal?.identifier || ''}" required placeholder="Ej: BOV-001">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nombre *</label>
                            <input type="text" class="form-input" name="name" value="${animal?.name || ''}" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Especie *</label>
                            <select class="form-select" name="speciesId" id="animalSpeciesSelect" required>
                                <option value="">Seleccionar...</option>
                                ${species.map(s => `<option value="${s.id}" ${animal?.speciesId === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de Nacimiento</label>
                            <input type="date" class="form-input" name="birthDate" value="${animal?.birthDate || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Sexo</label>
                            <select class="form-select" name="sex">
                                <option value="">Seleccionar...</option>
                                <option value="male" ${animal?.sex === 'male' ? 'selected' : ''}>Macho</option>
                                <option value="female" ${animal?.sex === 'female' ? 'selected' : ''}>Hembra</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Estado</label>
                            <select class="form-select" name="status">
                                <option value="active" ${animal?.status === 'active' ? 'selected' : ''}>Activo</option>
                                <option value="sold" ${animal?.status === 'sold' ? 'selected' : ''}>Vendido</option>
                                <option value="deceased" ${animal?.status === 'deceased' ? 'selected' : ''}>Fallecido</option>
                            </select>
                        </div>
                    </div>
                    <div id="customAttributesContainer"></div>
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-textarea" name="notes">${animal?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: () => {
                const form = document.getElementById('animalForm');
                const formData = new FormData(form);

                const data = {
                    identifier: formData.get('identifier'),
                    name: formData.get('name'),
                    speciesId: formData.get('speciesId'),
                    birthDate: formData.get('birthDate'),
                    sex: formData.get('sex'),
                    status: formData.get('status'),
                    notes: formData.get('notes'),
                    customAttributes: {}
                };

                // Get custom attributes
                form.querySelectorAll('[data-custom-attr]').forEach(input => {
                    const key = input.dataset.customAttr;
                    if (input.type === 'checkbox') {
                        data.customAttributes[key] = input.checked;
                    } else {
                        data.customAttributes[key] = input.value;
                    }
                });

                if (!data.identifier || !data.name || !data.speciesId) {
                    Toast.show('Por favor complete los campos requeridos', 'error');
                    return false;
                }

                if (isEdit) {
                    DataManager.update(DB_KEYS.ANIMALS, id, data);
                    Toast.show('Animal actualizado correctamente', 'success');
                } else {
                    DataManager.add(DB_KEYS.ANIMALS, data);
                    Toast.show('Animal registrado correctamente', 'success');
                }

                this.render();
                App.updateDashboard();
                return true;
            }
        });

        // Handle species change to load custom attributes
        setTimeout(() => {
            const speciesSelect = document.getElementById('animalSpeciesSelect');
            speciesSelect?.addEventListener('change', () => {
                this.loadCustomAttributes(speciesSelect.value, animal?.customAttributes);
            });

            if (animal?.speciesId) {
                this.loadCustomAttributes(animal.speciesId, animal.customAttributes);
            }
        }, 100);
    },

    loadCustomAttributes(speciesId, existingValues = {}) {
        const container = document.getElementById('customAttributesContainer');
        if (!container) return;

        const species = DataManager.getById(DB_KEYS.SPECIES, speciesId);
        if (!species || !species.attributes || species.attributes.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div style="margin: 1rem 0; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
                <h4 style="margin-bottom: 1rem; color: var(--text-secondary);">Atributos de ${species.name}</h4>
                ${species.attributes.map(attr => this.renderCustomAttributeField(attr, existingValues[attr.id])).join('')}
            </div>
        `;
    },

    renderCustomAttributeField(attr, value = '') {
        const required = attr.required ? 'required' : '';
        const requiredMark = attr.required ? ' *' : '';

        switch (attr.type) {
            case 'number':
                return `
                    <div class="form-group">
                        <label class="form-label">${attr.name}${requiredMark}</label>
                        <input type="number" class="form-input" data-custom-attr="${attr.id}" value="${value || ''}" ${required}>
                    </div>
                `;
            case 'date':
                return `
                    <div class="form-group">
                        <label class="form-label">${attr.name}${requiredMark}</label>
                        <input type="date" class="form-input" data-custom-attr="${attr.id}" value="${value || ''}" ${required}>
                    </div>
                `;
            case 'select':
                const options = (attr.options || '').split(',').filter(o => o.trim());
                return `
                    <div class="form-group">
                        <label class="form-label">${attr.name}${requiredMark}</label>
                        <select class="form-select" data-custom-attr="${attr.id}" ${required}>
                            <option value="">Seleccionar...</option>
                            ${options.map(o => `<option value="${o.trim()}" ${value === o.trim() ? 'selected' : ''}>${o.trim()}</option>`).join('')}
                        </select>
                    </div>
                `;
            case 'boolean':
                return `
                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" data-custom-attr="${attr.id}" ${value ? 'checked' : ''}>
                            <span>${attr.name}</span>
                        </label>
                    </div>
                `;
            default:
                return `
                    <div class="form-group">
                        <label class="form-label">${attr.name}${requiredMark}</label>
                        <input type="text" class="form-input" data-custom-attr="${attr.id}" value="${value || ''}" ${required}>
                    </div>
                `;
        }
    },

    showDetails(id) {
        const animal = DataManager.getById(DB_KEYS.ANIMALS, id);
        if (!animal) return;

        const species = DataManager.getById(DB_KEYS.SPECIES, animal.speciesId);
        const vaccinations = DataManager.getAll(DB_KEYS.VACCINATIONS).filter(v => v.animalId === id);
        const feedings = DataManager.getAll(DB_KEYS.FEEDING).filter(f => f.animalId === id).slice(-5);
        const reproductions = DataManager.getAll(DB_KEYS.REPRODUCTION).filter(r => r.animalId === id).slice(-5);

        const statusLabels = { active: 'Activo', sold: 'Vendido', deceased: 'Fallecido' };
        const sexLabels = { male: 'Macho', female: 'Hembra' };

        let customAttrsHtml = '';
        if (species?.attributes && animal.customAttributes) {
            customAttrsHtml = species.attributes.map(attr => {
                const val = animal.customAttributes[attr.id];
                if (val === undefined || val === '') return '';
                const displayVal = attr.type === 'boolean' ? (val ? 'Sí' : 'No') : val;
                return `<p><strong>${attr.name}:</strong> ${displayVal}</p>`;
            }).join('');
        }

        Modal.show({
            title: `${animal.name} (${animal.identifier})`,
            content: `
                <div style="display: grid; gap: 1rem;">
                    <div class="card" style="padding: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">Información General</h4>
                        <p><strong>Especie:</strong> ${species ? `${species.icon} ${species.name}` : 'N/A'}</p>
                        <p><strong>Sexo:</strong> ${sexLabels[animal.sex] || 'No especificado'}</p>
                        <p><strong>Fecha Nacimiento:</strong> ${animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('es-ES') : 'N/A'}</p>
                        <p><strong>Estado:</strong> <span class="status-badge ${animal.status}">${statusLabels[animal.status]}</span></p>
                        ${customAttrsHtml}
                        ${animal.notes ? `<p><strong>Notas:</strong> ${animal.notes}</p>` : ''}
                    </div>
                    <div class="card" style="padding: 1rem;">
                        <h4 style="margin-bottom: 0.5rem;">Vacunaciones (${vaccinations.length})</h4>
                        ${vaccinations.length > 0 ? `
                            <ul style="list-style: none;">
                                ${vaccinations.slice(-3).map(v => `<li style="padding: 0.25rem 0;">• ${v.vaccineName} - ${new Date(v.applicationDate).toLocaleDateString('es-ES')}</li>`).join('')}
                            </ul>
                        ` : '<p style="color: var(--text-muted);">Sin vacunaciones registradas</p>'}
                    </div>
                </div>
            `,
            showCancel: false,
            confirmText: 'Cerrar'
        });
    },

    delete(id) {
        if (confirm('¿Está seguro de eliminar este animal? También se eliminarán sus registros asociados.')) {
            DataManager.delete(DB_KEYS.ANIMALS, id);

            // Delete related records
            const vaccinations = DataManager.getAll(DB_KEYS.VACCINATIONS);
            DataManager.save(DB_KEYS.VACCINATIONS, vaccinations.filter(v => v.animalId !== id));

            const feedings = DataManager.getAll(DB_KEYS.FEEDING);
            DataManager.save(DB_KEYS.FEEDING, feedings.filter(f => f.animalId !== id));

            const reproductions = DataManager.getAll(DB_KEYS.REPRODUCTION);
            DataManager.save(DB_KEYS.REPRODUCTION, reproductions.filter(r => r.animalId !== id));

            Toast.show('Animal eliminado correctamente', 'success');
            this.render();
            App.updateDashboard();
        }
    },

    getSelectOptions(filter = null) {
        let animals = DataManager.getAll(DB_KEYS.ANIMALS).filter(a => a.status === 'active');
        if (filter === 'female') {
            animals = animals.filter(a => a.sex === 'female');
        }
        return animals.map(a => {
            const species = DataManager.getById(DB_KEYS.SPECIES, a.speciesId);
            return `<option value="${a.id}">${a.identifier} - ${a.name} (${species?.icon || ''})</option>`;
        }).join('');
    }
};
