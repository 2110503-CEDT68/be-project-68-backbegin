const { request } = require('express');
const mongoose = require('mongoose');

const MassageShopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    district: {
        type: String,
        required: [true, 'Please add a district']
    },
    province: {
        type: String,
        required: [true, 'Please add a province']
    },
    postalcode: {
        type: String,
        required: [true, 'Please add a postalcode'],
        maxlength: [5, 'Postal Code can not be more than 5 digits']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number'],
        match: [
            /^\d{9,10}$/,
            'Please add a valid phone number (9-10 digits)'
        ]
    },
    openCloseTime: {
        type: String,
        required: [true, 'Please add open-close time'],
        match: [
        /^([01]\d|2[0-3]):?([0-5]\d) - ([01]\d|2[0-3]):?([0-5]\d)$/,
        'Please add openCloseTime in format HH:mm - HH:mm'
    ]
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Reverse populate with virtuals
MassageShopSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'massageShop',
    justOne: false
});

module.exports = mongoose.model('MassageShop', MassageShopSchema);