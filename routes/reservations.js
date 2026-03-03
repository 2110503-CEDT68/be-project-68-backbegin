const express = require('express');
const { getReservations, getReservation, getOwnReservations, addReservation, updateReservation, deleteReservation} = require('../controllers/reservations');

const router = express.Router({mergeParams:true});

const {protect, authorize} = require('../middleware/auth');

router.route('/')
    .get(protect, getReservations)
    .post(protect, authorize('user', 'admin'), addReservation);

router.route('/me').get(protect, getOwnReservations);

router.route('/:id')
    .get(protect, getReservation)
    .put(protect, authorize('user', 'admin'), updateReservation)
    .delete(protect, authorize('user', 'admin'), deleteReservation);

module.exports = router;