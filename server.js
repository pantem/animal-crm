import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import apiRoutes from './routes/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));  // For base64 images
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(process.cwd())));

// API Routes
app.use('/api', apiRoutes);

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
});

// Export for Vercel
export default app;

// Start server if running directly (Local Development)
if (process.argv[1].toLowerCase() === __filename.toLowerCase()) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor iniciado en http://localhost:${PORT}`);
        console.log(`📡 API disponible en http://localhost:${PORT}/api`);
        console.log(`🌐 Frontend disponible en http://localhost:${PORT}\n`);
    });
}
