import Vaccination from '../models/Vaccination.js';

/**
 * Controlador para operaciones CRUD de Vacunaciones
 */
const VaccinationController = {
    /**
     * Obtener todas las vacunaciones
     * @param {Object} filters - Filtros opcionales
     * @param {string} filters.animalId - Filtrar por animal
     * @param {string} filters.search - Búsqueda por nombre de vacuna
     */
    async getAll(filters = {}) {
        try {
            let query = {};

            if (filters.animalId) {
                query.animalId = filters.animalId;
            }
            if (filters.search) {
                query.$or = [
                    { vaccineName: { $regex: filters.search, $options: 'i' } },
                    { veterinarian: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const vaccinations = await Vaccination.find(query)
                .populate('animalId', 'identifier name')
                .sort({ applicationDate: -1 });

            return { success: true, data: vaccinations, count: vaccinations.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener una vacunación por ID
     * @param {string} id - ID de la vacunación
     */
    async getById(id) {
        try {
            const vaccination = await Vaccination.findById(id)
                .populate('animalId', 'identifier name');
            if (!vaccination) {
                return { success: false, error: 'Vacunación no encontrada' };
            }
            return { success: true, data: vaccination };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear una nueva vacunación
     * @param {Object} data - Datos de la vacunación
     * @param {string} data.animalId - ID del animal (requerido)
     * @param {string} data.vaccineName - Nombre de la vacuna (requerido)
     * @param {Date} data.applicationDate - Fecha de aplicación (requerido)
     * @param {Date} data.nextDoseDate - Fecha de próxima dosis
     * @param {string} data.veterinarian - Veterinario
     * @param {string} data.batch - Número de lote
     * @param {string} data.notes - Notas
     */
    async create(data) {
        try {
            const vaccination = await Vaccination.create(data);
            const populated = await vaccination.populate('animalId', 'identifier name');
            return { success: true, data: populated, message: 'Vacunación registrada correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar una vacunación
     * @param {string} id - ID de la vacunación
     * @param {Object} data - Datos a actualizar
     */
    async update(id, data) {
        try {
            const vaccination = await Vaccination.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            ).populate('animalId', 'identifier name');

            if (!vaccination) {
                return { success: false, error: 'Vacunación no encontrada' };
            }
            return { success: true, data: vaccination, message: 'Vacunación actualizada correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar una vacunación
     * @param {string} id - ID de la vacunación
     */
    async delete(id) {
        try {
            const vaccination = await Vaccination.findByIdAndDelete(id);
            if (!vaccination) {
                return { success: false, error: 'Vacunación no encontrada' };
            }
            return { success: true, message: 'Vacunación eliminada correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener vacunaciones pendientes (próximas en los siguientes días)
     * @param {number} days - Número de días a consultar (default: 7)
     */
    async getPending(days = 7) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + days);

            const pending = await Vaccination.find({
                nextDoseDate: { $gte: today, $lte: futureDate }
            })
                .populate('animalId', 'identifier name')
                .sort({ nextDoseDate: 1 });

            return { success: true, data: pending, count: pending.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener vacunaciones vencidas
     */
    async getOverdue() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdue = await Vaccination.find({
                nextDoseDate: { $lt: today }
            })
                .populate('animalId', 'identifier name')
                .sort({ nextDoseDate: 1 });

            return { success: true, data: overdue, count: overdue.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener vacunaciones por mes (para calendario)
     * @param {number} year - Año
     * @param {number} month - Mes (0-11)
     */
    async getByMonth(year, month) {
        try {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const vaccinations = await Vaccination.find({
                nextDoseDate: { $gte: startDate, $lte: endDate }
            })
                .populate('animalId', 'identifier name')
                .sort({ nextDoseDate: 1 });

            return { success: true, data: vaccinations };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default VaccinationController;
