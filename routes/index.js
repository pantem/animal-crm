import express from 'express';
import speciesRoutes from './speciesRoutes.js';
import animalRoutes from './animalRoutes.js';
import vaccinationRoutes from './vaccinationRoutes.js';
import feedingRoutes from './feedingRoutes.js';
import reproductionRoutes from './reproductionRoutes.js';

const router = express.Router();

// Mount routes
router.use('/species', speciesRoutes);
router.use('/animals', animalRoutes);
router.use('/vaccinations', vaccinationRoutes);
router.use('/feeding', feedingRoutes);
router.use('/reproduction', reproductionRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
