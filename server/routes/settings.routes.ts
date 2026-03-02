import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;
