/**
 * Script para probar la conexión a MongoDB e insertar datos de ejemplo
 * Ejecutar con: npm run test:db
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Species, Animal, Vaccination, Feeding, Reproduction } from '../models/index.js';

dotenv.config();

const testDatabase = async () => {
    try {
        // 1. Conectar a MongoDB
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión exitosa a MongoDB!\n');

        // 2. Limpiar datos de prueba anteriores (opcional)
        console.log('🧹 Limpiando datos de prueba anteriores...');
        await Promise.all([
            Species.deleteMany({ name: { $regex: /^Test/ } }),
            Animal.deleteMany({ identifier: { $regex: /^TEST-/ } })
        ]);

        // 3. Insertar una especie de prueba
        console.log('📝 Insertando especie de prueba...');
        const species = await Species.create({
            name: 'Test Bovino',
            description: 'Especie de prueba - Ganado vacuno',
            icon: '🐄',
            attributes: [
                { name: 'Raza', type: 'select', options: 'Angus,Hereford,Brahman', required: true },
                { name: 'Peso (kg)', type: 'number', required: false }
            ]
        });
        console.log(`   ✅ Especie creada: ${species.name} (ID: ${species._id})\n`);

        // 4. Insertar un animal de prueba
        console.log('📝 Insertando animal de prueba...');
        const animal = await Animal.create({
            identifier: 'TEST-001',
            name: 'Vaca Prueba',
            speciesId: species._id,
            birthDate: new Date('2021-06-15'),
            sex: 'female',
            status: 'active',
            notes: 'Animal de prueba para verificar la conexión',
            customAttributes: {
                raza: 'Angus',
                'peso_(kg)': 450
            }
        });
        console.log(`   ✅ Animal creado: ${animal.name} (ID: ${animal._id})`);
        console.log(`   📊 Edad calculada: ${animal.age} años\n`);

        // 5. Insertar una vacunación de prueba
        console.log('📝 Insertando vacunación de prueba...');
        const vaccination = await Vaccination.create({
            animalId: animal._id,
            vaccineName: 'Aftosa - Test',
            applicationDate: new Date(),
            nextDoseDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 días después
            veterinarian: 'Dr. Prueba',
            batch: 'LOTE-TEST-001'
        });
        console.log(`   ✅ Vacunación creada: ${vaccination.vaccineName}\n`);

        // 6. Insertar registro de alimentación
        console.log('📝 Insertando registro de alimentación...');
        const feeding = await Feeding.create({
            animalId: animal._id,
            foodType: 'Concentrado',
            quantity: 5.5,
            unit: 'kg',
            date: new Date(),
            notes: 'Alimentación de prueba'
        });
        console.log(`   ✅ Alimentación registrada: ${feeding.quantity} ${feeding.unit} de ${feeding.foodType}\n`);

        // 7. Insertar registro reproductivo
        console.log('📝 Insertando registro reproductivo...');
        const reproduction = await Reproduction.create({
            type: 'heat',
            animalId: animal._id,
            date: new Date(),
            intensity: 'high',
            notes: 'Celo de prueba detectado'
        });
        console.log(`   ✅ Registro de celo creado`);
        console.log(`   📅 Próximo celo estimado: ${reproduction.nextHeatDate?.toLocaleDateString('es-ES')}`);
        console.log(`   🐣 Fecha probable de parto: ${reproduction.dueDate?.toLocaleDateString('es-ES')}\n`);

        // 8. Verificar datos insertados
        console.log('🔍 Verificando datos en la base de datos...');
        const [speciesCount, animalCount, vaccinationCount, feedingCount, reproductionCount] = await Promise.all([
            Species.countDocuments(),
            Animal.countDocuments(),
            Vaccination.countDocuments(),
            Feeding.countDocuments(),
            Reproduction.countDocuments()
        ]);

        console.log('   📊 Resumen de la base de datos:');
        console.log(`      - Especies: ${speciesCount}`);
        console.log(`      - Animales: ${animalCount}`);
        console.log(`      - Vacunaciones: ${vaccinationCount}`);
        console.log(`      - Registros de alimentación: ${feedingCount}`);
        console.log(`      - Registros reproductivos: ${reproductionCount}`);

        console.log('\n✅ ¡Todas las pruebas pasaron exitosamente!');
        console.log('🎉 Tu configuración de MongoDB está funcionando correctamente.\n');

    } catch (error) {
        console.error('\n❌ Error durante la prueba:');
        console.error(`   ${error.message}`);

        if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n💡 Sugerencia: Verifica tu conexión a internet y que el cluster de MongoDB esté activo.');
        } else if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
            console.error('\n💡 Sugerencia: Verifica tu usuario y contraseña en MONGO_URI.');
            console.error('   Recuerda que los caracteres especiales deben estar URL-encoded:');
            console.error('   @ -> %40, ! -> %21, # -> %23, $ -> %24, etc.');
        } else if (error.message.includes('not allowed')) {
            console.error('\n💡 Sugerencia: Verifica que tu IP esté en la lista blanca de MongoDB Atlas.');
        }

        process.exit(1);
    } finally {
        // Cerrar conexión
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada.');
    }
};

// Ejecutar
testDatabase();
