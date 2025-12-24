import express from 'express';
import ReproductionController from '../controllers/reproductionController.js';

const router = express.Router();

// GET /api/reproduction - Get all reproduction records
router.get('/', async (req, res) => {
    const filters = {
        type: req.query.type,
        animalId: req.query.animalId
    };
    const result = await ReproductionController.getAll(filters);
    res.json(result);
});

// GET /api/reproduction/heats - Get only heat records
router.get('/heats', async (req, res) => {
    const result = await ReproductionController.getHeats();
    res.json(result);
});

// GET /api/reproduction/inseminations - Get only insemination records
router.get('/inseminations', async (req, res) => {
    const result = await ReproductionController.getInseminations();
    res.json(result);
});

// GET /api/reproduction/upcoming-heats - Get upcoming predicted heats
router.get('/upcoming-heats', async (req, res) => {
    const days = parseInt(req.query.days) || 14;
    const result = await ReproductionController.getUpcomingHeats(days);
    res.json(result);
});

// GET /api/reproduction/upcoming-births - Get upcoming expected births
router.get('/upcoming-births', async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const result = await ReproductionController.getUpcomingBirths(days);
    res.json(result);
});

// GET /api/reproduction/month/:year/:month - Get by month
router.get('/month/:year/:month', async (req, res) => {
    const result = await ReproductionController.getByMonth(
        parseInt(req.params.year),
        parseInt(req.params.month)
    );
    res.json(result);
});

// GET /api/reproduction/:id - Get record by ID
router.get('/:id', async (req, res) => {
    const result = await ReproductionController.getById(req.params.id);
    res.json(result);
});

// POST /api/reproduction/heat - Create heat record
router.post('/heat', async (req, res) => {
    const result = await ReproductionController.createHeat(req.body);
    res.status(result.success ? 201 : 400).json(result);
});

// POST /api/reproduction/insemination - Create insemination record
router.post('/insemination', async (req, res) => {
    const result = await ReproductionController.createInsemination(req.body);
    res.status(result.success ? 201 : 400).json(result);
});

// PUT /api/reproduction/:id - Update record
router.put('/:id', async (req, res) => {
    const result = await ReproductionController.update(req.params.id, req.body);
    res.json(result);
});

// PATCH /api/reproduction/:id/result - Update insemination result only
router.patch('/:id/result', async (req, res) => {
    const result = await ReproductionController.updateInseminationResult(
        req.params.id,
        req.body.result
    );
    res.json(result);
});

// DELETE /api/reproduction/:id - Delete record
router.delete('/:id', async (req, res) => {
    const result = await ReproductionController.delete(req.params.id);
    res.json(result);
});

export default router;
