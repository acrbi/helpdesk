// ─────────────────────────────────────────
// routes/auth.routes.js
// ─────────────────────────────────────────
const express = require('express');
const { body } = require('express-validator');
const authCtrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = express.Router();

router.post('/register',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })],
  validate, authCtrl.register
);
router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate, authCtrl.login
);
router.post('/refresh', authCtrl.refresh);
router.post('/logout',  authenticate, authCtrl.logout);
router.get('/me',       authenticate, authCtrl.me);

module.exports = router;
