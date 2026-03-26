const express = require('express');
const router = express.Router();
const controller = require('./controller');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.post('/', controller.createTask);
router.get('/', controller.listTasks);
router.get('/:id', controller.getTask);
router.delete('/:id', controller.deleteTask);

module.exports = router;
