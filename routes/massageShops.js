const express = require('express');

const {
    getMassageShops,
    getMassageShop,
    createMassageShop,
    updateMassageShop,
    deleteMassageShop
} = require('../controllers/massageShops');

const router = express.Router();

const reservationRouter = require('./reservations');

const {protect, authorize} = require('../middleware/auth');

//Re-route into other resource reouters
router.use('/:massageshopId/reservations/', reservationRouter);

router.route('/').get(getMassageShops).post(protect, authorize('admin'), createMassageShop);
router.route('/:id').get(getMassageShop).put(protect, authorize('admin'), updateMassageShop).delete(protect, authorize('admin'), deleteMassageShop);

module.exports = router;