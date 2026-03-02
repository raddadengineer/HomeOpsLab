import { Router } from 'express';
import { topologyController } from '../controllers/topology.controller';

const router = Router();

router.get('/topology', topologyController.getTopology);
router.get('/export', topologyController.exportTopology);
router.post('/import', topologyController.importTopology);

export default router;
