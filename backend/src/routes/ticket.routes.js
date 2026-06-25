const express = require('express');
const { body } = require('express-validator');
const ticketCtrl = require('../controllers/ticket.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/',       ticketCtrl.getAll);
router.get('/:id',    ticketCtrl.getOne);

router.post('/',
  [body('title').notEmpty().isLength({ max: 300 }),
   body('description').notEmpty(),
   body('clientId').isUUID(),
   body('priority').optional().isIn(['low','medium','high','critical'])],
  validate, ticketCtrl.create
);

router.put('/:id',   ticketCtrl.update);
router.delete('/:id', authorize('admin','manager'), ticketCtrl.remove);
router.post('/:id/comments',
  [body('content').notEmpty()],
  validate, ticketCtrl.addComment
);
router.post('/ai/analyze', ticketCtrl.aiAnalyze);

module.exports = router;
