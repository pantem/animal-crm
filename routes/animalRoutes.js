import express from 'express';
import AnimalController from '../controllers/animalController.js';

const router = express.Router();

// GET /api/animals - Get all animals with optional filters
router.get('/', async (req, res) => {
    const filters = {
        speciesId: req.query.speciesId,
        status: req.query.status,
        sex: req.query.sex,
        search: req.query.search
    };
    const result = await AnimalController.getAll(filters);
    res.json(result);
});

// GET /api/animals/stats - Get animal statistics
router.get('/stats', async (req, res) => {
    const result = await AnimalController.getStats();
    res.json(result);
});

// GET /api/animals/females - Get active females only
router.get('/females', async (req, res) => {
    const result = await AnimalController.getFemales();
    res.json(result);
});

// GET /api/animals/:id - Get animal by ID with related records
router.get('/:id', async (req, res) => {
    const result = await AnimalController.getById(req.params.id);
    res.json(result);
});

// POST /api/animals - Create new animal
router.post('/', async (req, res) => {
    const result = await AnimalController.create(req.body);
    res.status(result.success ? 201 : 400).json(result);
});

// PUT /api/animals/:id - Update animal
router.put('/:id', async (req, res) => {
    const result = await AnimalController.update(req.params.id, req.body);
    res.json(result);
});

// DELETE /api/animals/:id - Delete animal and related records
router.delete('/:id', async (req, res) => {
    const result = await AnimalController.delete(req.params.id);
    res.json(result);
});

export default router;
