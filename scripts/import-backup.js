/**
 * Script para importar datos desde backup.json a MongoDB
 * Ejecutar con: npm run import:backup
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Species, Animal, Vaccination, Feeding, Reproduction } from '../models/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importBackup = async () => {
    try {
        // 1. Conectar a MongoDB
        console.log('🔄 Conectando a MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conexión exitosa!\n');

        // 2. Leer archivo backup.json
        const backupPath = path.join(__dirname, '..', 'backup.json');
        console.log(`📂 Leyendo archivo: ${backupPath}`);

        if (!fs.existsSync(backupPath)) {
            throw new Error('No se encontró el archivo backup.json');
        }

        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
        console.log('✅ Archivo leído correctamente\n');

        // 3. Mostrar resumen de datos a importar
        console.log('═══════════════════════════════════════');
        console.log('📊 DATOS A IMPORTAR');
        console.log('═══════════════════════════════════════');
        console.log(`   Especies: ${backupData.species?.length || 0}`);
        console.log(`   Animales: ${backupData.animals?.length || 0}`);
        console.log(`   Vacunaciones: ${backupData.vaccinations?.length || 0}`);
        console.log(`   Alimentación: ${backupData.feeding?.length || 0}`);
        console.log(`   Reproducción: ${backupData.reproduction?.length || 0}`);
        console.log(`   Exportado en: ${backupData.exportedAt || 'N/A'}`);
        console.log('═══════════════════════════════════════\n');

        // 4. Mapeo de IDs antiguos a nuevos (MongoDB ObjectIds)
        const speciesIdMap = {};  // oldId -> newMongoId
        const animalIdMap = {};   // oldId -> newMongoId

        // 5. Importar Especies
        console.log('📋 Importando especies...');
        if (backupData.species && backupData.species.length > 0) {
            for (const speciesData of backupData.species) {
                const oldId = speciesData.id;

                // Verificar si ya existe
                let species = await Species.findOne({ name: speciesData.name });

                if (species) {
                    console.log(`   ⏭️  Especie "${speciesData.name}" ya existe, actualizando...`);
                    species = await Species.findByIdAndUpdate(
                        species._id,
                        {
                            description: speciesData.description,
                            icon: speciesData.icon,
                            attributes: speciesData.attributes
                        },
                        { new: true }
                    );
                } else {
                    species = await Species.create({
                        name: speciesData.name,
                        description: speciesData.description,
                        icon: speciesData.icon,
                        attributes: speciesData.attributes
                    });
                    console.log(`   ✅ Especie creada: ${speciesData.name}`);
                }

                speciesIdMap[oldId] = species._id;
            }
        }
        console.log(`   📊 Total especies procesadas: ${Object.keys(speciesIdMap).length}\n`);

        // 6. Importar Animales
        console.log('🐄 Importando animales...');
        let animalsCreated = 0;
        let animalsUpdated = 0;

        if (backupData.animals && backupData.animals.length > 0) {
            for (const animalData of backupData.animals) {
                const oldId = animalData.id;
                const newSpeciesId = speciesIdMap[animalData.speciesId];

                if (!newSpeciesId) {
                    console.log(`   ⚠️  Animal "${animalData.name}" sin especie válida, omitido`);
                    continue;
                }

                // Verificar si ya existe por identificador
                let animal = await Animal.findOne({ identifier: animalData.identifier });

                const animalPayload = {
                    identifier: animalData.identifier,
                    name: animalData.name,
                    speciesId: newSpeciesId,
                    birthDate: animalData.birthDate ? new Date(animalData.birthDate) : null,
                    sex: animalData.sex || '',
                    status: animalData.status || 'active',
                    notes: animalData.notes || '',
                    image: animalData.image || '',
                    customAttributes: animalData.customAttributes || {}
                };

                if (animal) {
                    animal = await Animal.findByIdAndUpdate(animal._id, animalPayload, { new: true });
                    animalsUpdated++;
                } else {
                    animal = await Animal.create(animalPayload);
                    animalsCreated++;
                }

                animalIdMap[oldId] = animal._id;
            }
        }
        console.log(`   ✅ Animales creados: ${animalsCreated}`);
        console.log(`   ⏭️  Animales actualizados: ${animalsUpdated}\n`);

        // 7. Importar Vacunaciones
        console.log('💉 Importando vacunaciones...');
        let vaccinationsCreated = 0;

        if (backupData.vaccinations && backupData.vaccinations.length > 0) {
            for (const vaxData of backupData.vaccinations) {
                const newAnimalId = animalIdMap[vaxData.animalId];

                if (!newAnimalId) {
                    console.log(`   ⚠️  Vacunación sin animal válido, omitida`);
                    continue;
                }

                await Vaccination.create({
                    animalId: newAnimalId,
                    vaccineName: vaxData.vaccineName,
                    applicationDate: vaxData.applicationDate ? new Date(vaxData.applicationDate) : new Date(),
                    nextDoseDate: vaxData.nextDoseDate ? new Date(vaxData.nextDoseDate) : null,
                    veterinarian: vaxData.veterinarian || '',
                    batch: vaxData.batch || '',
                    notes: vaxData.notes || ''
                });
                vaccinationsCreated++;
            }
        }
        console.log(`   ✅ Vacunaciones importadas: ${vaccinationsCreated}\n`);

        // 8. Importar Alimentación
        console.log('🍽️ Importando registros de alimentación...');
        let feedingsCreated = 0;

        if (backupData.feeding && backupData.feeding.length > 0) {
            for (const feedData of backupData.feeding) {
                const newAnimalId = animalIdMap[feedData.animalId];

                if (!newAnimalId) {
                    console.log(`   ⚠️  Registro de alimentación sin animal válido, omitido`);
                    continue;
                }

                await Feeding.create({
                    animalId: newAnimalId,
                    foodType: feedData.foodType,
                    quantity: parseFloat(feedData.quantity) || 0,
                    unit: feedData.unit || 'kg',
                    date: feedData.date ? new Date(feedData.date) : new Date(),
                    notes: feedData.notes || ''
                });
                feedingsCreated++;
            }
        }
        console.log(`   ✅ Registros de alimentación importados: ${feedingsCreated}\n`);

        // 9. Importar Reproducción
        console.log('❤️ Importando registros reproductivos...');
        let reproductionsCreated = 0;

        if (backupData.reproduction && backupData.reproduction.length > 0) {
            for (const reproData of backupData.reproduction) {
                const newAnimalId = animalIdMap[reproData.animalId];

                if (!newAnimalId) {
                    console.log(`   ⚠️  Registro reproductivo sin animal válido, omitido`);
                    continue;
                }

                await Reproduction.create({
                    type: reproData.type,
                    animalId: newAnimalId,
                    date: reproData.date ? new Date(reproData.date) : new Date(),
                    intensity: reproData.intensity || '',
                    method: reproData.method || '',
                    sireCode: reproData.sireCode || '',
                    result: reproData.result || 'pending',
                    technician: reproData.technician || '',
                    notes: reproData.notes || ''
                });
                reproductionsCreated++;
            }
        }
        console.log(`   ✅ Registros reproductivos importados: ${reproductionsCreated}\n`);

        // 10. Resumen final
        console.log('═══════════════════════════════════════');
        console.log('✅ IMPORTACIÓN COMPLETADA');
        console.log('═══════════════════════════════════════');

        const [speciesCount, animalCount, vaxCount, feedCount, reproCount] = await Promise.all([
            Species.countDocuments(),
            Animal.countDocuments(),
            Vaccination.countDocuments(),
            Feeding.countDocuments(),
            Reproduction.countDocuments()
        ]);

        console.log('📊 Estado actual de la base de datos:');
        console.log(`   - Especies: ${speciesCount}`);
        console.log(`   - Animales: ${animalCount}`);
        console.log(`   - Vacunaciones: ${vaxCount}`);
        console.log(`   - Registros de alimentación: ${feedCount}`);
        console.log(`   - Registros reproductivos: ${reproCount}`);
        console.log('\n🎉 ¡Datos importados exitosamente a MongoDB!\n');

    } catch (error) {
        console.error('\n❌ Error durante la importación:');
        console.error(`   ${error.message}`);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión cerrada.');
    }
};

importBackup();
