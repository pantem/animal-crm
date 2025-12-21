// Data Layer - LocalStorage Management
const DB_KEYS = {
    SPECIES: 'animalcrm_species',
    ANIMALS: 'animalcrm_animals',
    VACCINATIONS: 'animalcrm_vaccinations',
    FEEDING: 'animalcrm_feeding',
    REPRODUCTION: 'animalcrm_reproduction'
};

const DataManager = {
    // Generic CRUD
    getAll(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    getById(key, id) {
        const data = this.getAll(key);
        return data.find(item => item.id === id);
    },

    add(key, item) {
        const data = this.getAll(key);
        item.id = this.generateId();
        item.createdAt = new Date().toISOString();
        data.push(item);
        this.save(key, data);
        return item;
    },

    update(key, id, updates) {
        const data = this.getAll(key);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
            this.save(key, data);
            return data[index];
        }
        return null;
    },

    delete(key, id) {
        const data = this.getAll(key);
        const filtered = data.filter(item => item.id !== id);
        this.save(key, filtered);
        return filtered;
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Export all data
    exportAll() {
        return {
            species: this.getAll(DB_KEYS.SPECIES),
            animals: this.getAll(DB_KEYS.ANIMALS),
            vaccinations: this.getAll(DB_KEYS.VACCINATIONS),
            feeding: this.getAll(DB_KEYS.FEEDING),
            reproduction: this.getAll(DB_KEYS.REPRODUCTION),
            exportedAt: new Date().toISOString()
        };
    },

    // Import all data
    importAll(data) {
        if (data.species) this.save(DB_KEYS.SPECIES, data.species);
        if (data.animals) this.save(DB_KEYS.ANIMALS, data.animals);
        if (data.vaccinations) this.save(DB_KEYS.VACCINATIONS, data.vaccinations);
        if (data.feeding) this.save(DB_KEYS.FEEDING, data.feeding);
        if (data.reproduction) this.save(DB_KEYS.REPRODUCTION, data.reproduction);
    },

    // Clear all data
    clearAll() {
        Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
    },

    // Initialize with sample data if empty
    initializeSampleData() {
        if (this.getAll(DB_KEYS.SPECIES).length === 0) {
            const sampleSpecies = [
                {
                    id: 'bovino',
                    name: 'Bovino',
                    description: 'Ganado vacuno para carne y leche',
                    icon: '🐄',
                    attributes: [
                        { id: 'raza', name: 'Raza', type: 'select', options: 'Angus,Hereford,Brahman,Holstein,Charolais', required: true },
                        { id: 'peso', name: 'Peso (kg)', type: 'number', required: false },
                        { id: 'color', name: 'Color', type: 'text', required: false },
                        { id: 'cuernos', name: 'Tiene cuernos', type: 'boolean', required: false }
                    ]
                },
                {
                    id: 'porcino',
                    name: 'Porcino',
                    description: 'Cerdos para producción',
                    icon: '🐷',
                    attributes: [
                        { id: 'raza', name: 'Raza', type: 'select', options: 'Duroc,Yorkshire,Landrace,Hampshire,Pietrain', required: true },
                        { id: 'peso', name: 'Peso (kg)', type: 'number', required: false },
                        { id: 'camada', name: 'Número de camada', type: 'number', required: false }
                    ]
                },
                {
                    id: 'ovino',
                    name: 'Ovino',
                    description: 'Ovejas para lana y carne',
                    icon: '🐑',
                    attributes: [
                        { id: 'raza', name: 'Raza', type: 'select', options: 'Merino,Suffolk,Dorper,Texel,Romney', required: true },
                        { id: 'peso', name: 'Peso (kg)', type: 'number', required: false },
                        { id: 'lana', name: 'Calidad de lana', type: 'select', options: 'Fina,Media,Gruesa', required: false }
                    ]
                },
                {
                    id: 'caprino',
                    name: 'Caprino',
                    description: 'Cabras para leche y carne',
                    icon: '🐐',
                    attributes: [
                        { id: 'raza', name: 'Raza', type: 'select', options: 'Boer,Saanen,Nubia,Alpina,Toggenburg', required: true },
                        { id: 'peso', name: 'Peso (kg)', type: 'number', required: false },
                        { id: 'produccion_leche', name: 'Producción de leche (L/día)', type: 'number', required: false }
                    ]
                },
                {
                    id: 'equino',
                    name: 'Equino',
                    description: 'Caballos y yeguas',
                    icon: '🐴',
                    attributes: [
                        { id: 'raza', name: 'Raza', type: 'select', options: 'Cuarto de Milla,Árabe,Pura Sangre,Appaloosa,Criollo', required: true },
                        { id: 'alzada', name: 'Alzada (cm)', type: 'number', required: false },
                        { id: 'color', name: 'Color', type: 'text', required: false },
                        { id: 'uso', name: 'Uso', type: 'select', options: 'Trabajo,Deporte,Reproducción,Paseo', required: false }
                    ]
                },
                {
                    id: 'avicola',
                    name: 'Avícola',
                    description: 'Aves de corral',
                    icon: '🐔',
                    attributes: [
                        { id: 'tipo', name: 'Tipo', type: 'select', options: 'Gallina ponedora,Pollo de engorde,Pavo,Pato', required: true },
                        { id: 'produccion_huevos', name: 'Producción huevos/semana', type: 'number', required: false }
                    ]
                }
            ];
            this.save(DB_KEYS.SPECIES, sampleSpecies);
        }
    }
};

// Initialize sample data on load
DataManager.initializeSampleData();
