const express = require('express');
const { getReservations, getReservation, addReservation, updateReservation, deleteReservation} = require('../controllers/reservations');

const router = express.Router({mergeParams:true});

const {protect, authorize} = require('../middleware/auth');