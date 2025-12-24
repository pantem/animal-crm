import express from 'express';
import FeedingController from '../controllers/feedingController.js';

const router = express.Router();

// GET /api/feeding - Get all feeding records
router.get('/', async (req, res) => {
    const filters = {
        animalId: req.query.animalId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
    };
    const result = await FeedingController.getAll(filters);
    res.json(result);
});

// GET /api/feeding/stats - Get consumption statistics
router.get('/stats', async (req, res) => {
    const result = await FeedingController.getStats();
    res.json(result);
});

// GET /api/feeding/daily - Get daily consumption
router.get('/daily', async (req, res) => {
    const days = parseInt(req.query.days) || 14;
    const result = await FeedingController.getDailyConsumption(days);
    res.json(result);
});

// GET /api/feeding/by-type - Get consumption by food type
router.get('/by-type', async (req, res) => {
    const result = await FeedingController.getByFoodType();
    res.json(result);
});

// GET /api/feeding/:id - Get feeding record by ID
router.get('/:id', async (req, res) => {
    const result = await FeedingController.getById(req.params.id);
    res.json(result);
});

// POST /api/feeding - Create new feeding record
router.post('/', async (req, res) => {
    const result = await FeedingController.create(req.body);
    res.status(result.success ? 201 : 400).json(result);
});

// PUT /api/feeding/:id - Update feeding record
router.put('/:id', async (req, res) => {
    const result = await FeedingController.update(req.params.id, req.body);
    res.json(result);
});

// DELETE /api/feeding/:id - Delete feeding record
router.delete('/:id', async (req, res) => {
    const result = await FeedingController.delete(req.params.id);
    res.json(result);
});

export default router;
