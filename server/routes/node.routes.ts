import { Router } from 'express';
import { nodeController } from '../controllers/node.controller';
import { metricsController } from '../controllers/metrics.controller';

const router = Router();

router.get('/:id/metrics', metricsController.getNodeMetrics);
router.get('/', nodeController.getAllNodes);
router.get('/:id', nodeController.getNode);
router.post('/bulk-delete', nodeController.bulkDeleteNodes);
router.post('/:id/wake', nodeController.wakeNode);
router.post('/', nodeController.createNode);
router.put('/:id', nodeController.updateNode);
router.delete('/:id', nodeController.deleteNode);

export default router;
