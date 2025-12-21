// Species Management Module
const SpeciesManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('addSpeciesBtn')?.addEventListener('click', () => this.showForm());
    },

    render() {
        const species = DataManager.getAll(DB_KEYS.SPECIES);
        const grid = document.getElementById('speciesGrid');
        if (!grid) return;

        if (species.length === 0) {
            grid.innerHTML = `
                <div class="empty-state-container">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No hay especies registradas</div>
                    <div class="empty-state-subtext">Agrega tu primera especie para comenzar</div>
                </div>
            `;
            return;
        }

        grid.innerHTML = species.map(s => this.renderCard(s)).join('');

        // Bind edit/delete buttons
        grid.querySelectorAll('.edit-species').forEach(btn => {
            btn.addEventListener('click', () => this.showForm(btn.dataset.id));
        });
        grid.querySelectorAll('.delete-species').forEach(btn => {
            btn.addEventListener('click', () => this.delete(btn.dataset.id));
        });
        grid.querySelectorAll('.manage-attributes').forEach(btn => {
            btn.addEventListener('click', () => this.showAttributesForm(btn.dataset.id));
        });
    },

    renderCard(species) {
        const animals = DataManager.getAll(DB_KEYS.ANIMALS).filter(a => a.speciesId === species.id);
        const attrs = species.attributes || [];

        return `
            <div class="species-card" id="species-${species.id}">
                <div class="species-header">
                    <div>
                        <div class="species-icon">${species.icon || '🐾'}</div>
                        <div class="species-name">${species.name}</div>
                    </div>
                    <div class="action-btns">
                        <button class="btn btn-icon edit-species" data-id="${species.id}" title="Editar">✏️</button>
                        <button class="btn btn-icon delete-species" data-id="${species.id}" title="Eliminar">🗑️</button>
                    </div>
                </div>
                <div class="species-description">${species.description || 'Sin descripción'}</div>
                <div class="species-stats">
                    <div class="species-stat">
                        <span class="species-stat-value">${animals.length}</span>
                        <span class="species-stat-label">Animales</span>
                    </div>
                    <div class="species-stat">
                        <span class="species-stat-value">${attrs.length}</span>
                        <span class="species-stat-label">Atributos</span>
                    </div>
                </div>
                ${attrs.length > 0 ? `
                    <div class="attributes-list">
                        <div class="attributes-title">Atributos personalizados</div>
                        ${attrs.map(a => `<span class="attribute-tag">${a.name} (${a.type})</span>`).join('')}
                    </div>
                ` : ''}
                <div style="margin-top: 1rem;">
                    <button class="btn btn-secondary manage-attributes" data-id="${species.id}">
                        Gestionar Atributos
                    </button>
                </div>
            </div>
        `;
    },

    showForm(id = null) {
        const species = id ? DataManager.getById(DB_KEYS.SPECIES, id) : null;
        const isEdit = !!species;

        Modal.show({
            title: isEdit ? 'Editar Especie' : 'Nueva Especie',
            content: `
                <form id="speciesForm">
                    <div class="form-group">
                        <label class="form-label">Icono (emoji)</label>
                        <input type="text" class="form-input" name="icon" value="${species?.icon || '🐾'}" maxlength="4">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Nombre *</label>
                        <input type="text" class="form-input" name="name" value="${species?.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-textarea" name="description">${species?.description || ''}</textarea>
                    </div>
                </form>
            `,
            onConfirm: () => {
                const form = document.getElementById('speciesForm');
                const formData = new FormData(form);
                const data = {
                    icon: formData.get('icon'),
                    name: formData.get('name'),
                    description: formData.get('description'),
                    attributes: species?.attributes || []
                };

                if (!data.name) {
                    Toast.show('El nombre es requerido', 'error');
                    return false;
                }

                if (isEdit) {
                    DataManager.update(DB_KEYS.SPECIES, id, data);
                    Toast.show('Especie actualizada correctamente', 'success');
                } else {
                    DataManager.add(DB_KEYS.SPECIES, data);
                    Toast.show('Especie creada correctamente', 'success');
                }

                this.render();
                AnimalsManager.updateSpeciesFilter();
                return true;
            }
        });
    },

    showAttributesForm(speciesId) {
        const species = DataManager.getById(DB_KEYS.SPECIES, speciesId);
        if (!species) return;

        const attrs = species.attributes || [];

        Modal.show({
            title: `Atributos de ${species.name}`,
            content: `
                <div id="attributesList">
                    ${attrs.length === 0 ? '<p style="color: var(--text-muted);">No hay atributos definidos</p>' : ''}
                    ${attrs.map((attr, i) => this.renderAttributeRow(attr, i)).join('')}
                </div>
                <button type="button" class="btn btn-secondary" id="addAttributeBtn" style="margin-top: 1rem;">
                    + Agregar Atributo
                </button>
            `,
            onConfirm: () => {
                const rows = document.querySelectorAll('.attribute-row');
                const newAttrs = [];

                rows.forEach(row => {
                    const name = row.querySelector('[name="attrName"]').value;
                    const type = row.querySelector('[name="attrType"]').value;
                    const options = row.querySelector('[name="attrOptions"]')?.value || '';
                    const required = row.querySelector('[name="attrRequired"]')?.checked || false;

                    if (name) {
                        newAttrs.push({
                            id: name.toLowerCase().replace(/\s+/g, '_'),
                            name,
                            type,
                            options,
                            required
                        });
                    }
                });

                DataManager.update(DB_KEYS.SPECIES, speciesId, { attributes: newAttrs });
                Toast.show('Atributos actualizados correctamente', 'success');
                this.render();
                return true;
            }
        });

        // Bind add attribute button
        setTimeout(() => {
            document.getElementById('addAttributeBtn')?.addEventListener('click', () => {
                const list = document.getElementById('attributesList');
                const emptyMsg = list.querySelector('p');
                if (emptyMsg) emptyMsg.remove();

                const div = document.createElement('div');
                div.innerHTML = this.renderAttributeRow({ name: '', type: 'text', options: '', required: false }, list.children.length);
                list.appendChild(div.firstElementChild);

                this.bindAttributeRowEvents();
            });

            this.bindAttributeRowEvents();
        }, 100);
    },

    renderAttributeRow(attr, index) {
        return `
            <div class="attribute-row" style="background: var(--glass); padding: 1rem; border-radius: var(--radius); margin-bottom: 0.5rem;">
                <div class="form-row">
                    <div class="form-group" style="margin-bottom: 0.5rem;">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-input" name="attrName" value="${attr.name}" placeholder="Ej: Peso">
                    </div>
                    <div class="form-group" style="margin-bottom: 0.5rem;">
                        <label class="form-label">Tipo</label>
                        <select class="form-select" name="attrType">
                            <option value="text" ${attr.type === 'text' ? 'selected' : ''}>Texto</option>
                            <option value="number" ${attr.type === 'number' ? 'selected' : ''}>Número</option>
                            <option value="date" ${attr.type === 'date' ? 'selected' : ''}>Fecha</option>
                            <option value="select" ${attr.type === 'select' ? 'selected' : ''}>Selección</option>
                            <option value="boolean" ${attr.type === 'boolean' ? 'selected' : ''}>Sí/No</option>
                        </select>
                    </div>
                </div>
                <div class="form-group options-group" style="display: ${attr.type === 'select' ? 'block' : 'none'}; margin-bottom: 0.5rem;">
                    <label class="form-label">Opciones (separadas por coma)</label>
                    <input type="text" class="form-input" name="attrOptions" value="${attr.options || ''}" placeholder="Opción1,Opción2,Opción3">
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <label class="form-checkbox">
                        <input type="checkbox" name="attrRequired" ${attr.required ? 'checked' : ''}>
                        <span>Requerido</span>
                    </label>
                    <button type="button" class="btn btn-icon remove-attr" title="Eliminar">🗑️</button>
                </div>
            </div>
        `;
    },

    bindAttributeRowEvents() {
        document.querySelectorAll('.attribute-row [name="attrType"]').forEach(select => {
            select.addEventListener('change', (e) => {
                const row = e.target.closest('.attribute-row');
                const optionsGroup = row.querySelector('.options-group');
                optionsGroup.style.display = e.target.value === 'select' ? 'block' : 'none';
            });
        });

        document.querySelectorAll('.remove-attr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.attribute-row').remove();
            });
        });
    },

    delete(id) {
        const animals = DataManager.getAll(DB_KEYS.ANIMALS).filter(a => a.speciesId === id);

        if (animals.length > 0) {
            Toast.show(`No se puede eliminar: hay ${animals.length} animales de esta especie`, 'error');
            return;
        }

        if (confirm('¿Está seguro de eliminar esta especie?')) {
            DataManager.delete(DB_KEYS.SPECIES, id);
            Toast.show('Especie eliminada correctamente', 'success');
            this.render();
            AnimalsManager.updateSpeciesFilter();
        }
    },

    getSelectOptions() {
        return DataManager.getAll(DB_KEYS.SPECIES).map(s =>
            `<option value="${s.id}">${s.icon} ${s.name}</option>`
        ).join('');
    }
};
