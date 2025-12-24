// Data Layer - API Client for MongoDB Backend
// Replaces localStorage with fetch calls to Express API

const API_BASE = '/api';

const DB_KEYS = {
    SPECIES: 'species',
    ANIMALS: 'animals',
    VACCINATIONS: 'vaccinations',
    FEEDING: 'feeding',
    REPRODUCTION: 'reproduction'
};

// Helper function for API calls
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

const DataManager = {
    // Cache for species (to avoid repeated calls)
    _speciesCache: null,
    _speciesCacheTime: 0,
    _cacheTimeout: 30000, // 30 seconds

    // Get all items for a key
    async getAll(key) {
        const result = await apiRequest(`/${key}`);
        return result.success ? result.data : [];
    },

    // Synchronous version for backward compatibility (uses cache)
    getAllSync(key) {
        // Return empty array, actual data loaded via async
        console.warn('getAllSync is deprecated, use getAll() instead');
        return [];
    },

    // Get by ID
    async getById(key, id) {
        const result = await apiRequest(`/${key}/${id}`);
        if (result.success) {
            // For animals, the response has nested structure
            return key === DB_KEYS.ANIMALS ? result.data.animal : result.data;
        }
        return null;
    },

    // Add new item
    async add(key, item) {
        let endpoint = `/${key}`;

        // Special handling for reproduction (heat vs insemination)
        if (key === DB_KEYS.REPRODUCTION) {
            endpoint = item.type === 'heat'
                ? '/reproduction/heat'
                : '/reproduction/insemination';
        }

        const result = await apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(item)
        });

        if (result.success) {
            return result.data;
        }
        throw new Error(result.error || 'Error al crear registro');
    },

    // Update item
    async update(key, id, updates) {
        const result = await apiRequest(`/${key}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        if (result.success) {
            return result.data;
        }
        throw new Error(result.error || 'Error al actualizar registro');
    },

    // Delete item
    async delete(key, id) {
        const result = await apiRequest(`/${key}/${id}`, {
            method: 'DELETE'
        });

        if (result.success) {
            return true;
        }
        throw new Error(result.error || 'Error al eliminar registro');
    },

    // Save is not needed for API (kept for compatibility)
    save(key, data) {
        console.warn('save() is deprecated with API backend');
    },

    // Export all data
    async exportAll() {
        const [species, animals, vaccinations, feeding, reproduction] = await Promise.all([
            this.getAll(DB_KEYS.SPECIES),
            this.getAll(DB_KEYS.ANIMALS),
            this.getAll(DB_KEYS.VACCINATIONS),
            this.getAll(DB_KEYS.FEEDING),
            this.getAll(DB_KEYS.REPRODUCTION)
        ]);

        return {
            species,
            animals,
            vaccinations,
            feeding,
            reproduction,
            exportedAt: new Date().toISOString()
        };
    },

    // Import all data (batch create)
    async importAll(data) {
        const results = [];

        if (data.species) {
            for (const item of data.species) {
                try { await this.add(DB_KEYS.SPECIES, item); } catch (e) { /* skip duplicates */ }
            }
        }
        if (data.animals) {
            for (const item of data.animals) {
                try { await this.add(DB_KEYS.ANIMALS, item); } catch (e) { /* skip duplicates */ }
            }
        }
        if (data.vaccinations) {
            for (const item of data.vaccinations) {
                try { await this.add(DB_KEYS.VACCINATIONS, item); } catch (e) { /* skip */ }
            }
        }
        if (data.feeding) {
            for (const item of data.feeding) {
                try { await this.add(DB_KEYS.FEEDING, item); } catch (e) { /* skip */ }
            }
        }
        if (data.reproduction) {
            for (const item of data.reproduction) {
                try { await this.add(DB_KEYS.REPRODUCTION, item); } catch (e) { /* skip */ }
            }
        }

        return results;
    },

    // Clear all data - Requires confirmation
    async clearAll() {
        console.warn('clearAll() not implemented for API - would delete all data from MongoDB');
    },

    // Initialize sample data - Not needed, data is in MongoDB
    initializeSampleData() {
        // Data already exists in MongoDB
        console.log('📦 Datos cargados desde MongoDB');
    },

    // Special API calls for dashboard
    async getStats() {
        return await apiRequest('/animals/stats');
    },

    async getPendingVaccinations(days = 7) {
        return await apiRequest(`/vaccinations/pending?days=${days}`);
    },

    async getUpcomingHeats(days = 14) {
        return await apiRequest(`/reproduction/upcoming-heats?days=${days}`);
    },

    async getFeedingStats() {
        return await apiRequest('/feeding/stats');
    },

    async getDailyFeeding(days = 7) {
        return await apiRequest(`/feeding/daily?days=${days}`);
    },

    async getFemaleAnimals() {
        return await apiRequest('/animals/females');
    }
};

// No initialization needed - data is in MongoDB
console.log('🔗 DataManager conectado a API MongoDB');
