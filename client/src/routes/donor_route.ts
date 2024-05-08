import express from 'express';
import DonorController from '../controllers/donor_controller'; 

const router = express.Router();

// Route for getting all donors
router.get('/', DonorController.get);

// Route for getting a single donor by ID
router.get('/:id', DonorController.getById);

// Route for creating a new donor
router.post('/', DonorController.post);

// Route for updating a donor by ID
router.put('/:id', DonorController.putById);

// Route for deleting a donor by ID
router.delete('/:id', DonorController.deleteById);

export default router;
