import Animal from '../models/Animal.js';
import Vaccination from '../models/Vaccination.js';
import Feeding from '../models/Feeding.js';
import Reproduction from '../models/Reproduction.js';

/**
 * Controlador para operaciones CRUD de Animales
 */
const AnimalController = {
    /**
     * Obtener todos los animales
     * @param {Object} filters - Filtros opcionales
     * @param {string} filters.speciesId - Filtrar por especie
     * @param {string} filters.status - Filtrar por estado (active, sold, deceased)
     * @param {string} filters.sex - Filtrar por sexo (male, female)
     * @param {string} filters.search - Búsqueda por nombre o identificador
     */
    async getAll(filters = {}) {
        try {
            let query = {};

            if (filters.speciesId) {
                query.speciesId = filters.speciesId;
            }
            if (filters.status) {
                query.status = filters.status;
            }
            if (filters.sex) {
                query.sex = filters.sex;
            }
            if (filters.search) {
                query.$or = [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { identifier: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const animals = await Animal.find(query)
                .populate('speciesId', 'name icon')
                .sort({ createdAt: -1 });

            return { success: true, data: animals, count: animals.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener un animal por ID con todos sus registros relacionados
     * @param {string} id - ID del animal
     */
    async getById(id) {
        try {
            const animal = await Animal.findById(id).populate('speciesId');
            if (!animal) {
                return { success: false, error: 'Animal no encontrado' };
            }

            // Obtener registros relacionados
            const [vaccinations, feedings, reproductions] = await Promise.all([
                Vaccination.find({ animalId: id }).sort({ applicationDate: -1 }).limit(10),
                Feeding.find({ animalId: id }).sort({ date: -1 }).limit(10),
                Reproduction.find({ animalId: id }).sort({ date: -1 }).limit(10)
            ]);

            return {
                success: true,
                data: {
                    animal,
                    vaccinations,
                    feedings,
                    reproductions
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear un nuevo animal
     * @param {Object} data - Datos del animal
     * @param {string} data.identifier - Identificador único (requerido)
     * @param {string} data.name - Nombre (requerido)
     * @param {string} data.speciesId - ID de especie (requerido)
     * @param {Date} data.birthDate - Fecha de nacimiento
     * @param {string} data.sex - Sexo (male/female)
     * @param {string} data.status - Estado (active/sold/deceased)
     * @param {string} data.image - Imagen en base64
     * @param {string} data.notes - Notas
     * @param {Object} data.customAttributes - Atributos personalizados
     */
    async create(data) {
        try {
            const animal = await Animal.create(data);
            return { success: true, data: animal, message: 'Animal registrado correctamente' };
        } catch (error) {
            if (error.code === 11000) {
                return { success: false, error: 'Ya existe un animal con ese identificador' };
            }
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar un animal
     * @param {string} id - ID del animal
     * @param {Object} data - Datos a actualizar
     */
    async update(id, data) {
        try {
            const animal = await Animal.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            ).populate('speciesId');

            if (!animal) {
                return { success: false, error: 'Animal no encontrado' };
            }
            return { success: true, data: animal, message: 'Animal actualizado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar un animal y todos sus registros asociados
     * @param {string} id - ID del animal
     */
    async delete(id) {
        try {
            const animal = await Animal.findById(id);
            if (!animal) {
                return { success: false, error: 'Animal no encontrado' };
            }

            // Eliminar registros asociados
            await Promise.all([
                Vaccination.deleteMany({ animalId: id }),
                Feeding.deleteMany({ animalId: id }),
                Reproduction.deleteMany({ animalId: id })
            ]);

            // Eliminar el animal
            await Animal.findByIdAndDelete(id);

            return { success: true, message: 'Animal y registros asociados eliminados correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener solo animales hembras activas (para reproducción)
     */
    async getFemales() {
        try {
            const females = await Animal.find({ sex: 'female', status: 'active' })
                .populate('speciesId', 'name icon')
                .sort({ name: 1 });
            return { success: true, data: females };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener estadísticas de animales
     */
    async getStats() {
        try {
            const [
                total,
                active,
                sold,
                deceased,
                bySpecies
            ] = await Promise.all([
                Animal.countDocuments(),
                Animal.countDocuments({ status: 'active' }),
                Animal.countDocuments({ status: 'sold' }),
                Animal.countDocuments({ status: 'deceased' }),
                Animal.aggregate([
                    { $match: { status: 'active' } },
                    { $group: { _id: '$speciesId', count: { $sum: 1 } } }
                ])
            ]);

            return {
                success: true,
                data: { total, active, sold, deceased, bySpecies }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default AnimalController;
