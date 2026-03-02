import { Router } from 'express';
import { edgeController } from '../controllers/edge.controller';

const router = Router();

router.get('/', edgeController.getAllEdges);
router.post('/', edgeController.createEdge);
router.delete('/:id', edgeController.deleteEdge);

export default router;
