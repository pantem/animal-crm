import Reproduction from '../models/Reproduction.js';

const HEAT_CYCLE_DAYS = 21;
const GESTATION_DAYS = 114;

/**
 * Controlador para operaciones CRUD de Reproducción
 */
const ReproductionController = {
    /**
     * Obtener todos los registros reproductivos
     * @param {Object} filters - Filtros opcionales
     * @param {string} filters.type - Tipo (heat/insemination)
     * @param {string} filters.animalId - Filtrar por animal
     */
    async getAll(filters = {}) {
        try {
            let query = {};

            if (filters.type) {
                query.type = filters.type;
            }
            if (filters.animalId) {
                query.animalId = filters.animalId;
            }

            const records = await Reproduction.find(query)
                .populate('animalId', 'identifier name')
                .sort({ date: -1 });

            return { success: true, data: records, count: records.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener registros de celo
     */
    async getHeats() {
        try {
            const heats = await Reproduction.find({ type: 'heat' })
                .populate('animalId', 'identifier name')
                .sort({ date: -1 });

            return { success: true, data: heats, count: heats.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener registros de inseminación
     */
    async getInseminations() {
        try {
            const inseminations = await Reproduction.find({ type: 'insemination' })
                .populate('animalId', 'identifier name')
                .sort({ date: -1 });

            return { success: true, data: inseminations, count: inseminations.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener un registro por ID
     * @param {string} id - ID del registro
     */
    async getById(id) {
        try {
            const record = await Reproduction.findById(id)
                .populate('animalId', 'identifier name');
            if (!record) {
                return { success: false, error: 'Registro no encontrado' };
            }
            return { success: true, data: record };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Registrar un celo
     * @param {Object} data - Datos del celo
     * @param {string} data.animalId - ID del animal (requerido)
     * @param {Date} data.date - Fecha del celo (requerido)
     * @param {string} data.intensity - Intensidad (low/medium/high)
     * @param {string} data.notes - Notas/signos observados
     */
    async createHeat(data) {
        try {
            const heatData = {
                ...data,
                type: 'heat'
            };
            const heat = await Reproduction.create(heatData);
            const populated = await heat.populate('animalId', 'identifier name');

            return {
                success: true,
                data: populated,
                message: 'Celo registrado correctamente',
                nextHeatDate: heat.nextHeatDate,
                dueDate: heat.dueDate
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Registrar una inseminación
     * @param {Object} data - Datos de la inseminación
     * @param {string} data.animalId - ID del animal (requerido)
     * @param {Date} data.date - Fecha (requerido)
     * @param {string} data.method - Método (natural/artificial)
     * @param {string} data.sireCode - Código del semental/pajilla
     * @param {string} data.result - Resultado (pending/success/failed)
     * @param {string} data.technician - Técnico inseminador
     * @param {string} data.notes - Notas
     */
    async createInsemination(data) {
        try {
            const inseminationData = {
                ...data,
                type: 'insemination',
                result: data.result || 'pending'
            };
            const insemination = await Reproduction.create(inseminationData);
            const populated = await insemination.populate('animalId', 'identifier name');

            return {
                success: true,
                data: populated,
                message: 'Inseminación registrada correctamente',
                dueDate: insemination.dueDate
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar un registro reproductivo
     * @param {string} id - ID del registro
     * @param {Object} data - Datos a actualizar
     */
    async update(id, data) {
        try {
            const record = await Reproduction.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            ).populate('animalId', 'identifier name');

            if (!record) {
                return { success: false, error: 'Registro no encontrado' };
            }
            return { success: true, data: record, message: 'Registro actualizado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar resultado de inseminación
     * @param {string} id - ID del registro
     * @param {string} result - Resultado (success/failed)
     */
    async updateInseminationResult(id, result) {
        try {
            const record = await Reproduction.findOneAndUpdate(
                { _id: id, type: 'insemination' },
                { $set: { result } },
                { new: true }
            ).populate('animalId', 'identifier name');

            if (!record) {
                return { success: false, error: 'Inseminación no encontrada' };
            }
            return { success: true, data: record, message: 'Resultado actualizado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar un registro reproductivo
     * @param {string} id - ID del registro
     */
    async delete(id) {
        try {
            const record = await Reproduction.findByIdAndDelete(id);
            if (!record) {
                return { success: false, error: 'Registro no encontrado' };
            }
            return { success: true, message: 'Registro eliminado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener próximos celos estimados
     * @param {number} days - Días hacia adelante (default: 14)
     */
    async getUpcomingHeats(days = 14) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + days);

            const heats = await Reproduction.find({ type: 'heat' })
                .populate('animalId', 'identifier name');

            // Filtrar los que tienen próximo celo en el rango
            const upcoming = heats
                .filter(h => {
                    const nextHeat = h.nextHeatDate;
                    return nextHeat && nextHeat >= today && nextHeat <= futureDate;
                })
                .map(h => ({
                    animal: h.animalId,
                    lastHeatDate: h.date,
                    predictedDate: h.nextHeatDate,
                    type: 'predicted_heat'
                }))
                .sort((a, b) => a.predictedDate - b.predictedDate);

            return { success: true, data: upcoming, count: upcoming.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener inseminaciones exitosas con fechas de parto próximas
     * @param {number} days - Días hacia adelante (default: 30)
     */
    async getUpcomingBirths(days = 30) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + days);

            const inseminations = await Reproduction.find({
                type: 'insemination',
                result: 'success'
            }).populate('animalId', 'identifier name');

            const upcoming = inseminations
                .filter(i => {
                    const due = i.dueDate;
                    return due && due >= today && due <= futureDate;
                })
                .map(i => ({
                    animal: i.animalId,
                    inseminationDate: i.date,
                    dueDate: i.dueDate,
                    type: 'expected_birth'
                }))
                .sort((a, b) => a.dueDate - b.dueDate);

            return { success: true, data: upcoming, count: upcoming.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener eventos por mes (para calendario)
     * @param {number} year - Año
     * @param {number} month - Mes (0-11)
     */
    async getByMonth(year, month) {
        try {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const records = await Reproduction.find({
                date: { $gte: startDate, $lte: endDate }
            })
                .populate('animalId', 'identifier name')
                .sort({ date: 1 });

            return { success: true, data: records };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default ReproductionController;
