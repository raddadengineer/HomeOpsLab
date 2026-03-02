import { Router } from 'express';
import { discoveryController } from '../controllers/discovery.controller';

const router = Router();

router.post('/scan', discoveryController.scanNetwork);

export default router;
