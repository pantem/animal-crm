import Species from '../models/Species.js';

/**
 * Controlador para operaciones CRUD de Especies
 */
const SpeciesController = {
    /**
     * Obtener todas las especies
     */
    async getAll() {
        try {
            const species = await Species.find().sort({ name: 1 });
            return { success: true, data: species };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Obtener una especie por ID
     * @param {string} id - ID de la especie
     */
    async getById(id) {
        try {
            const species = await Species.findById(id);
            if (!species) {
                return { success: false, error: 'Especie no encontrada' };
            }
            return { success: true, data: species };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Crear una nueva especie
     * @param {Object} data - Datos de la especie
     * @param {string} data.name - Nombre (requerido)
     * @param {string} data.description - Descripción
     * @param {string} data.icon - Emoji/icono
     * @param {Array} data.attributes - Atributos personalizados
     */
    async create(data) {
        try {
            const species = await Species.create(data);
            return { success: true, data: species, message: 'Especie creada correctamente' };
        } catch (error) {
            if (error.code === 11000) {
                return { success: false, error: 'Ya existe una especie con ese nombre' };
            }
            return { success: false, error: error.message };
        }
    },

    /**
     * Actualizar una especie
     * @param {string} id - ID de la especie
     * @param {Object} data - Datos a actualizar
     */
    async update(id, data) {
        try {
            const species = await Species.findByIdAndUpdate(
                id,
                { $set: data },
                { new: true, runValidators: true }
            );
            if (!species) {
                return { success: false, error: 'Especie no encontrada' };
            }
            return { success: true, data: species, message: 'Especie actualizada correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar una especie
     * @param {string} id - ID de la especie
     */
    async delete(id) {
        try {
            // Verificar si hay animales asociados antes de eliminar
            const Animal = (await import('../models/Animal.js')).default;
            const animalsCount = await Animal.countDocuments({ speciesId: id });

            if (animalsCount > 0) {
                return {
                    success: false,
                    error: `No se puede eliminar: hay ${animalsCount} animales de esta especie`
                };
            }

            const species = await Species.findByIdAndDelete(id);
            if (!species) {
                return { success: false, error: 'Especie no encontrada' };
            }
            return { success: true, message: 'Especie eliminada correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Agregar un atributo a una especie
     * @param {string} speciesId - ID de la especie
     * @param {Object} attribute - Atributo a agregar
     */
    async addAttribute(speciesId, attribute) {
        try {
            const species = await Species.findByIdAndUpdate(
                speciesId,
                { $push: { attributes: attribute } },
                { new: true, runValidators: true }
            );
            if (!species) {
                return { success: false, error: 'Especie no encontrada' };
            }
            return { success: true, data: species, message: 'Atributo agregado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Eliminar un atributo de una especie
     * @param {string} speciesId - ID de la especie
     * @param {string} attributeId - ID del atributo
     */
    async removeAttribute(speciesId, attributeId) {
        try {
            const species = await Species.findByIdAndUpdate(
                speciesId,
                { $pull: { attributes: { _id: attributeId } } },
                { new: true }
            );
            if (!species) {
                return { success: false, error: 'Especie no encontrada' };
            }
            return { success: true, data: species, message: 'Atributo eliminado correctamente' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export default SpeciesController;
