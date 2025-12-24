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

    async render() {
        await this.updateSpeciesFilter();
        const animals = await this.getFilteredAnimals();
        const species = await DataManager.getAll(DB_KEYS.SPECIES);
        const tbody = document.getElementById('animalsTableBody');
        if (!tbody) return;

        if (animals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state-container">
                        <div class="empty-state-icon">🐄</div>
                        <div class="empty-state-text">No hay animales registrados</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = animals.map((a, index) => this.renderRow(a, species, index + 1)).join('');

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

    renderRow(animal, species = [], index = 0) {
        const animalSpecies = species.find(s => s._id === animal.speciesId || s.id === animal.speciesId);
        const statusClass = animal.status || 'active';
        const statusLabels = { active: 'Activo', sold: 'Vendido', deceased: 'Fallecido' };
        const imageHtml = animal.image
            ? `<img src="${animal.image}" alt="${animal.name}" class="animal-thumbnail" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 2px solid var(--glass-border);">`
            : `<div class="animal-thumbnail-placeholder" style="width: 50px; height: 50px; border-radius: 8px; background: var(--glass-bg); display: flex; align-items: center; justify-content: center; border: 2px dashed var(--glass-border); color: var(--text-muted); font-size: 20px;">📷</div>`;

        return `
            <tr>
                <td><span style="color: var(--text-muted); font-weight: 500;">${index}</span></td>
                <td>${imageHtml}</td>
                <td><strong>${animal.identifier}</strong></td>
                <td>${animal.name}</td>
                <td>${animalSpecies ? `${animalSpecies.icon} ${animalSpecies.name}` : 'N/A'}</td>
                <td>${animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('es-ES') : 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusLabels[statusClass]}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-icon view-animal" data-id="${animal._id || animal.id}" title="Ver detalles">👁️</button>
                        <button class="btn btn-icon edit-animal" data-id="${animal._id || animal.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-animal" data-id="${animal._id || animal.id}" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    },

    async getFilteredAnimals() {
        let animals = await DataManager.getAll(DB_KEYS.ANIMALS);
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

    async filter() {
        await this.render();
    },

    async updateSpeciesFilter() {
        const select = document.getElementById('speciesFilter');
        if (!select) return;

        const current = select.value;
        const options = await SpeciesManager.getSelectOptions();
        select.innerHTML = '<option value="">Todas las especies</option>' + options;
        select.value = current;
    },

    async showForm(id = null) {
        const animal = id ? await DataManager.getById(DB_KEYS.ANIMALS, id) : null;
        const isEdit = !!animal;
        const species = await DataManager.getAll(DB_KEYS.SPECIES);

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
                                ${species.map(s => `<option value="${s._id || s.id}" ${animal?.speciesId === (s._id || s.id) ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha de Nacimiento</label>
                            <input type="date" class="form-input" name="birthDate" value="${animal?.birthDate ? animal.birthDate.split('T')[0] : ''}">
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
                    <div class="form-group">
                        <label class="form-label">Foto del Animal</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div id="imagePreviewContainer" style="width: 100px; height: 100px; border-radius: 12px; background: var(--glass-bg); display: flex; align-items: center; justify-content: center; border: 2px dashed var(--glass-border); overflow: hidden;">
                                ${animal?.image
                    ? `<img src="${animal.image}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`
                    : `<span style="color: var(--text-muted); font-size: 32px;">📷</span>`}
                            </div>
                            <div style="flex: 1;">
                                <input type="file" id="animalImageInput" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary" id="selectImageBtn" style="margin-bottom: 0.5rem;">📷 Seleccionar Imagen</button>
                                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">JPG, PNG o GIF. Máx 2MB</p>
                            </div>
                        </div>
                        <input type="hidden" name="image" id="animalImageData" value="${animal?.image || ''}">
                    </div>
                    <div id="customAttributesContainer"></div>
                    <div class="form-group">
                        <label class="form-label">Notas</label>
                        <textarea class="form-textarea" name="notes">${animal?.notes || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: async () => {
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
                    image: document.getElementById('animalImageData')?.value || '',
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

                try {
                    if (isEdit) {
                        await DataManager.update(DB_KEYS.ANIMALS, id, data);
                        Toast.show('Animal actualizado correctamente', 'success');
                    } else {
                        await DataManager.add(DB_KEYS.ANIMALS, data);
                        Toast.show('Animal registrado correctamente', 'success');
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

        // Handle species change to load custom attributes
        setTimeout(async () => {
            const speciesSelect = document.getElementById('animalSpeciesSelect');
            speciesSelect?.addEventListener('change', async () => {
                await this.loadCustomAttributes(speciesSelect.value, animal?.customAttributes);
            });

            if (animal?.speciesId) {
                await this.loadCustomAttributes(animal.speciesId, animal.customAttributes);
            }

            // Handle image upload
            const imageInput = document.getElementById('animalImageInput');
            const selectImageBtn = document.getElementById('selectImageBtn');
            const imagePreviewContainer = document.getElementById('imagePreviewContainer');
            const imageDataInput = document.getElementById('animalImageData');

            selectImageBtn?.addEventListener('click', () => imageInput?.click());

            imageInput?.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (file.size > 2 * 1024 * 1024) {
                    Toast.show('La imagen no debe superar 2MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    imageDataInput.value = base64;
                    imagePreviewContainer.innerHTML = `<img src="${base64}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            });
        }, 100);
    },

    async loadCustomAttributes(speciesId, existingValues = {}) {
        const container = document.getElementById('customAttributesContainer');
        if (!container) return;

        const species = await DataManager.getById(DB_KEYS.SPECIES, speciesId);
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

    async showDetails(id) {
        const result = await DataManager.getById(DB_KEYS.ANIMALS, id);
        if (!result) return;

        const animal = result.animal || result;
        const species = await DataManager.getById(DB_KEYS.SPECIES, animal.speciesId);
        const vaccinations = result.vaccinations || [];
        const feedings = result.feedings || [];
        const reproductions = result.reproductions || [];

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
                    ${animal.image ? `
                        <div style="text-align: center;">
                            <img src="${animal.image}" alt="${animal.name}" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 12px; border: 3px solid var(--glass-border);">
                        </div>
                    ` : ''}
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

    async delete(id) {
        if (confirm('¿Está seguro de eliminar este animal? También se eliminarán sus registros asociados.')) {
            try {
                await DataManager.delete(DB_KEYS.ANIMALS, id);
                Toast.show('Animal eliminado correctamente', 'success');
                await this.render();
                await App.updateDashboard();
            } catch (error) {
                Toast.show(error.message, 'error');
            }
        }
    },

    async getSelectOptions(filter = null) {
        let animals = await DataManager.getAll(DB_KEYS.ANIMALS);
        animals = animals.filter(a => a.status === 'active');
        if (filter === 'female') {
            animals = animals.filter(a => a.sex === 'female');
        }
        const species = await DataManager.getAll(DB_KEYS.SPECIES);
        return animals.map(a => {
            const animalSpecies = species.find(s => s._id === a.speciesId || s.id === a.speciesId);
            return `<option value="${a._id || a.id}">${a.identifier} - ${a.name} (${animalSpecies?.icon || ''})</option>`;
        }).join('');
    }
};
