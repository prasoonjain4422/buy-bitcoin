const { Router } = require('express');
const myController = require('../controllers/myController');
const router = Router();

router.get('/', myController.dashboard);

router.post('/send', myController.sendBitcoin);

module.exports = router;
