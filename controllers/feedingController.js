import Feeding from '../models/Feeding.js';

/**
 * Controlador para operaciones CRUD de Alimentación
 */
const FeedingController = {
    /**
     * Obtener todos los registros de alimentación
     * @param {Object} filters - Filtros opcionales
     * @param {string} filters.animalId - Filtrar por animal
     * @param {Date} filters.dateFrom - Fecha desde
     * @param {Date} filters.dateTo - Fecha hasta
     */
    async getAll(filters = {}) {
        try {
            let query = {};

            if (filters.animalId) {
                query.animalId = filters.animalId;
            }
            if (filters.dateFrom || filters.dateTo) {
                query.date = {};
                if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
                if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
            }

            const feedings = await Feeding.find(query)
                .populate('animalId', 'identifier name')
                .sort({ date: -1 });

            return { success: true, data: feedings, count: feedings.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener un registro de alimentación por ID
     * @param {string} id - ID del registro
     */
    async getById(id) {
        try {
            const feeding = await Feeding.findById(id)
                .populate('animalId', 'identifier name');
            if (!feeding) {
                return { success: false, error: 'Registro no encontrado' };
            }
            return { success: true, data: feeding };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear un nuevo registro de alimentación
     * @param {Object} data - Datos del registro
     * @param {string} data.animalId - ID del animal (requerido)
     * @param {string} data.foodType - Tipo de alimento (requerido)
     * @param {number} data.quantity - Cantidad (requerido)
     * @param {string} data.unit - Unidad (kg, lb, g, L)
     * @param {Date} data.date - Fecha (requerido)
     * @param {string} data.notes - Notas
     */
    async create(data) {
        try {
            const feeding = await Feeding.create(data);
            const populated = await feeding.populate('animalId', 'identifier name');
            return { success: true, data: populated, message: 'Registro de alimentación creado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar un registro de alimentación
     * @param {string} id - ID del registro
     * @param {Object} data - Datos a actualizar
     */
    async update(id, data) {
        try {
            const feeding = await Feeding.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            ).populate('animalId', 'identifier name');

            if (!feeding) {
                return { success: false, error: 'Registro no encontrado' };
            }
            return { success: true, data: feeding, message: 'Registro actualizado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar un registro de alimentación
     * @param {string} id - ID del registro
     */
    async delete(id) {
        try {
            const feeding = await Feeding.findByIdAndDelete(id);
            if (!feeding) {
                return { success: false, error: 'Registro no encontrado' };
            }
            return { success: true, message: 'Registro eliminado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener estadísticas de consumo
     */
    async getStats() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayEnd = new Date(today);
            todayEnd.setHours(23, 59, 59, 999);

            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - 7);

            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

            const [todayTotal, weekTotal, monthTotal] = await Promise.all([
                Feeding.aggregate([
                    { $match: { date: { $gte: today, $lte: todayEnd } } },
                    { $group: { _id: null, total: { $sum: '$quantity' } } }
                ]),
                Feeding.aggregate([
                    { $match: { date: { $gte: weekStart } } },
                    { $group: { _id: null, total: { $sum: '$quantity' } } }
                ]),
                Feeding.aggregate([
                    { $match: { date: { $gte: monthStart } } },
                    { $group: { _id: null, total: { $sum: '$quantity' } } }
                ])
            ]);

            return {
                success: true,
                data: {
                    today: todayTotal[0]?.total || 0,
                    week: weekTotal[0]?.total || 0,
                    month: monthTotal[0]?.total || 0
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener consumo diario para gráfica
     * @param {number} days - Número de días hacia atrás (default: 14)
     */
    async getDailyConsumption(days = 14) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const daily = await Feeding.aggregate([
                { $match: { date: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        total: { $sum: '$quantity' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            return { success: true, data: daily };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener consumo por tipo de alimento
     */
    async getByFoodType() {
        try {
            const byType = await Feeding.aggregate([
                {
                    $group: {
                        _id: '$foodType',
                        total: { $sum: '$quantity' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { total: -1 } }
            ]);

            return { success: true, data: byType };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default FeedingController;
