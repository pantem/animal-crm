import express from 'express';
import SpeciesController from '../controllers/speciesController.js';

const router = express.Router();

// GET /api/species - Get all species
router.get('/', async (req, res) => {
    const result = await SpeciesController.getAll();
    res.json(result);
});

// GET /api/species/:id - Get species by ID
router.get('/:id', async (req, res) => {
    const result = await SpeciesController.getById(req.params.id);
    res.json(result);
});

// POST /api/species - Create new species
router.post('/', async (req, res) => {
    const result = await SpeciesController.create(req.body);
    res.status(result.success ? 201 : 400).json(result);
});

// PUT /api/species/:id - Update species
router.put('/:id', async (req, res) => {
    const result = await SpeciesController.update(req.params.id, req.body);
    res.json(result);
});

// DELETE /api/species/:id - Delete species
router.delete('/:id', async (req, res) => {
    const result = await SpeciesController.delete(req.params.id);
    res.json(result);
});

// POST /api/species/:id/attributes - Add attribute
router.post('/:id/attributes', async (req, res) => {
    const result = await SpeciesController.addAttribute(req.params.id, req.body);
    res.json(result);
});

// DELETE /api/species/:id/attributes/:attrId - Remove attribute
router.delete('/:id/attributes/:attrId', async (req, res) => {
    const result = await SpeciesController.removeAttribute(req.params.id, req.params.attrId);
    res.json(result);
});

export default router;
