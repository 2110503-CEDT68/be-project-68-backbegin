const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    apptDate: {
        type: Date,
        required: true
    }})