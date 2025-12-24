import express from 'express';
import VaccinationController from '../controllers/vaccinationController.js';

const router = express.Router();

// GET /api/vaccinations - Get all vaccinations
router.get('/', async (req, res) => {
    const filters = {
        animalId: req.query.animalId,
        search: req.query.search
    };
    const result = await VaccinationController.getAll(filters);
    res.json(result);
});

// GET /api/vaccinations/pending - Get pending vaccinations
router.get('/pending', async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const result = await VaccinationController.getPending(days);
    res.json(result);
});

// GET /api/vaccinations/overdue - Get overdue vaccinations
router.get('/overdue', async (req, res) => {
    const result = await VaccinationController.getOverdue();
    res.json(result);
});

// GET /api/vaccinations/month/:year/:month - Get by month
router.get('/month/:year/:month', async (req, res) => {
    const result = await VaccinationController.getByMonth(
        parseInt(req.params.year),
        parseInt(req.params.month)
    );
    res.json(result);
});

// GET /api/vaccinations/:id - Get vaccination by ID
router.get('/:id', async (req, res) => {
    const result = await VaccinationController.getById(req.params.id);
    res.json(result);
});

// POST /api/vaccinations - Create new vaccination
router.post('/', async (req, res) => {
    const result = await VaccinationController.create(req.body);
    res.status(result.success ? 201 : 400).json(result);
});

// PUT /api/vaccinations/:id - Update vaccination
router.put('/:id', async (req, res) => {
    const result = await VaccinationController.update(req.params.id, req.body);
    res.json(result);
});

// DELETE /api/vaccinations/:id - Delete vaccination
router.delete('/:id', async (req, res) => {
    const result = await VaccinationController.delete(req.params.id);
    res.json(result);
});

export default router;
