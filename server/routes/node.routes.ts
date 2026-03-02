import { Router } from 'express';
import { nodeController } from '../controllers/node.controller';

const router = Router();

router.get('/', nodeController.getAllNodes);
router.get('/:id', nodeController.getNode);
router.post('/', nodeController.createNode);
router.put('/:id', nodeController.updateNode);
router.delete('/:id', nodeController.deleteNode);

export default router;
