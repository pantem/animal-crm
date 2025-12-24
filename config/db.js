import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        console.log('🚀 Usando conexión MongoDB existente en caché');
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Disable buffering
        };

        console.log('🔄 Iniciando nueva conexión a MongoDB...');
        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
            console.log(`🚀 MongoDB Conectado: ${mongoose.connection.host}`);
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('❌ Error de conexión:', e);
        throw e;
    }

    return cached.conn;
};

export default connectDB;