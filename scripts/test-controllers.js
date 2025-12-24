/**
 * Script para probar los controladores CRUD
 * Ejecutar con: npm run test:controllers
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import {
    SpeciesController,
    AnimalController,
    VaccinationController,
    FeedingController,
    ReproductionController
} from '../controllers/index.js';

dotenv.config();

const testControllers = async () => {
    try {
        // Conectar a MongoDB
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión exitosa!\n');

        let speciesId, animalId;

        // ============ SPECIES CONTROLLER ============
        console.log('═══════════════════════════════════════');
        console.log('📋 PROBANDO SPECIES CONTROLLER');
        console.log('═══════════════════════════════════════\n');

        // Crear especie
        console.log('1. Creando especie...');
        const speciesResult = await SpeciesController.create({
            name: 'Bovino Test Controller',
            description: 'Especie de prueba desde controller',
            icon: '🐄',
            attributes: [
                { name: 'Raza', type: 'select', options: 'Angus,Brahman', required: true }
            ]
        });
        console.log(`   ✅ ${speciesResult.message}`);
        speciesId = speciesResult.data._id;

        // Obtener todas las especies
        console.log('2. Obteniendo todas las especies...');
        const allSpecies = await SpeciesController.getAll();
        console.log(`   ✅ Total especies: ${allSpecies.data.length}`);

        // Actualizar especie
        console.log('3. Actualizando especie...');
        const updateSpecies = await SpeciesController.update(speciesId, { description: 'Descripción actualizada' });
        console.log(`   ✅ ${updateSpecies.message}`);

        // ============ ANIMAL CONTROLLER ============
        console.log('\n═══════════════════════════════════════');
        console.log('🐄 PROBANDO ANIMAL CONTROLLER');
        console.log('═══════════════════════════════════════\n');

        // Crear animal
        console.log('1. Creando animal...');
        const animalResult = await AnimalController.create({
            identifier: 'CTRL-TEST-001',
            name: 'Vaca Controller Test',
            speciesId: speciesId,
            birthDate: new Date('2022-01-15'),
            sex: 'female',
            status: 'active',
            notes: 'Animal creado desde controller'
        });
        console.log(`   ✅ ${animalResult.message}`);
        animalId = animalResult.data._id;

        // Obtener con filtros
        console.log('2. Obteniendo animales activos...');
        const activeAnimals = await AnimalController.getAll({ status: 'active' });
        console.log(`   ✅ Animales activos: ${activeAnimals.count}`);

        // Obtener estadísticas
        console.log('3. Obteniendo estadísticas...');
        const stats = await AnimalController.getStats();
        console.log(`   ✅ Total: ${stats.data.total}, Activos: ${stats.data.active}`);

        // ============ VACCINATION CONTROLLER ============
        console.log('\n═══════════════════════════════════════');
        console.log('💉 PROBANDO VACCINATION CONTROLLER');
        console.log('═══════════════════════════════════════\n');

        // Crear vacunación
        console.log('1. Creando vacunación...');
        const vaxResult = await VaccinationController.create({
            animalId: animalId,
            vaccineName: 'Aftosa Controller Test',
            applicationDate: new Date(),
            nextDoseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
            veterinarian: 'Dr. Controller'
        });
        console.log(`   ✅ ${vaxResult.message}`);

        // Obtener pendientes
        console.log('2. Obteniendo vacunaciones pendientes (próximos 14 días)...');
        const pending = await VaccinationController.getPending(14);
        console.log(`   ✅ Pendientes: ${pending.count}`);

        // ============ FEEDING CONTROLLER ============
        console.log('\n═══════════════════════════════════════');
        console.log('🍽️ PROBANDO FEEDING CONTROLLER');
        console.log('═══════════════════════════════════════\n');

        // Crear registro de alimentación
        console.log('1. Creando registro de alimentación...');
        const feedResult = await FeedingController.create({
            animalId: animalId,
            foodType: 'Concentrado Premium',
            quantity: 8.5,
            unit: 'kg',
            date: new Date()
        });
        console.log(`   ✅ ${feedResult.message}`);

        // Obtener estadísticas
        console.log('2. Obteniendo estadísticas de consumo...');
        const feedStats = await FeedingController.getStats();
        console.log(`   ✅ Hoy: ${feedStats.data.today} kg, Semana: ${feedStats.data.week} kg`);

        // ============ REPRODUCTION CONTROLLER ============
        console.log('\n═══════════════════════════════════════');
        console.log('❤️ PROBANDO REPRODUCTION CONTROLLER');
        console.log('═══════════════════════════════════════\n');

        // Crear celo
        console.log('1. Registrando celo...');
        const heatResult = await ReproductionController.createHeat({
            animalId: animalId,
            date: new Date(),
            intensity: 'high',
            notes: 'Celo detectado - controller test'
        });
        console.log(`   ✅ ${heatResult.message}`);
        console.log(`   📅 Próximo celo: ${heatResult.nextHeatDate?.toLocaleDateString('es-ES')}`);

        // Crear inseminación
        console.log('2. Registrando inseminación...');
        const insemResult = await ReproductionController.createInsemination({
            animalId: animalId,
            date: new Date(),
            method: 'artificial',
            sireCode: 'TORO-CTRL-001',
            technician: 'Técnico Test'
        });
        console.log(`   ✅ ${insemResult.message}`);
        console.log(`   🐣 Fecha probable parto: ${insemResult.dueDate?.toLocaleDateString('es-ES')}`);

        // Obtener próximos celos
        console.log('3. Obteniendo próximos celos estimados...');
        const upcomingHeats = await ReproductionController.getUpcomingHeats(30);
        console.log(`   ✅ Próximos celos (30 días): ${upcomingHeats.count}`);

        // ============ LIMPIEZA ============
        console.log('\n═══════════════════════════════════════');
        console.log('🧹 LIMPIANDO DATOS DE PRUEBA');
        console.log('═══════════════════════════════════════\n');

        // Eliminar animal (elimina también registros relacionados)
        const deleteAnimal = await AnimalController.delete(animalId);
        console.log(`   ✅ ${deleteAnimal.message}`);

        // Eliminar especie
        const deleteSpecies = await SpeciesController.delete(speciesId);
        console.log(`   ✅ ${deleteSpecies.message}`);

        console.log('\n✅ ¡Todas las pruebas de controladores pasaron exitosamente!');
        console.log('🎉 Los controladores están funcionando correctamente.\n');

    } catch (error) {
        console.error('\n❌ Error durante la prueba:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada.');
    }
};

testControllers();
