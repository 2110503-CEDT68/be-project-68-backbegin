const Reservation = require('../models/Reservation');
const MassageShop = require('../models/MassageShop');

//@desc     Get all reservations
//@route    GET /api/v1/reservations
//@access   Private
exports.getReservations = async (req, res, next) => {
    let query;
    //General users can see only their own reservations!
    if(req.user.role !== 'admin') {
        query = Reservation.find({user:req.user.id}).populate({
            path: 'massageShop',
            select: 'name address tel duration openCloseTime'
        });
    } else {
        //Admin can see all
        if(req.params.massageShopId) {
            query = Reservation.find({massageShop:req.params.massageShopId}).populate({
                path: 'massageShop',
                select: 'name address tel duration openCloseTime'
            });
        } else {
            query = Reservation.find().populate({
                path: 'massageShop',
                select: 'name address tel duration openCloseTime'
            });
        }
    }

    try {
        const reservations = await query;

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });

    } catch (err) {
        res.status(500).json({success: false, message: "Cannot find Reservation"});
    }
};
//@desc     Get single reservation
//@route    GET /api/v1/reservations/:id
//@access   Private
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'massageShop',
            select: 'name address tel openCloseTime'
        });

        if (!reservation) {
            return res.status(404).json({ success: false, message: `No reservation with the id of ${req.params.id}` });
        }

        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                message: `User ${req.user.id} is not authorized to view this reservation` 
            });
        }

        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        console.log(err.stack);
        res.status(500).json({ success: false, message: "Cannot find Reservation" });
    }
};

//@desc     Get own reservation
//@route    GET /api/v1/reservations/me
//@access   Private
exports.getOwnReservations = async (req, res, next) => {
    try {
        //find by userid
        const reservations = await Reservation.find({user:req.user.id}).populate({
            path: 'massageShop',
            select: 'name address tel openCloseTime'
        });
        res.status(200).json({success: true, count: reservations.length, data: reservations});

    } catch (err) {
        //console.log(err);
        res.status(500).json({ success: false, message: "Cannot find your reservations" });
    }
};

//@desc     Add reservation
//@route    POST /api/v1/massage-shops/:massageShopId/reservations
//@access   Private
exports.addReservation = async (req, res, next) => {
    try {
        req.body.massageShop = req.params.massageShopId; 

        const massageShop = await MassageShop.findById(req.params.massageShopId);
        // Check for existing massage shop
        if (!massageShop) {
            return res.status(404).json({success:false, message:`No massage shop with the id of ${req.params.massageShopId}`});
        }

        //add user Id to req.body
        req.body.user = req.user.id;

        const date = new Date(req.body.date);
        const dateHour = date.getHours();
        const dateMin = date.getMinutes();
        const totaldateMinutes = (dateHour * 60) + dateMin;

        // Split time
        const [openStr, closeStr] = massageShop.openCloseTime.split(' - ');

        const [openH, openM] = openStr.split(':').map(Number);
        const openTimeMinutes = (openH * 60) + openM;

        const [closeH, closeM] = closeStr.split(':').map(Number);
        const closeTimeMinutes = (closeH * 60) + closeM;

        // Check it can add
        if (totaldateMinutes < openTimeMinutes || totaldateMinutes > closeTimeMinutes) {
            return res.status(400).json({
                success: false,
                message: `Shop is open ${openStr}-${closeStr}. Your time (${dateHour}:${dateMin < 10 ? '0' + dateMin : dateMin}) is out of range.`
            });
        }
        // Duration check
        const duration = parseInt(req.body.duration);
        const totalEndMinutes = totaldateMinutes + duration;

        if (totalEndMinutes > closeTimeMinutes) {
            const finishHour = Math.floor((totalEndMinutes % 1440) / 60);
            const finishMin = totalEndMinutes % 60;
            const formattedFinishTime = `${finishHour}:${finishMin < 10 ? '0' + finishMin : finishMin}`;

            return res.status(400).json({
                success: false,
                message: `The shop closes at ${closeStr}, but your ${duration}-minute session will finish at ${formattedFinishTime}. Please book a session that ends before closing time.`
            });
        }

        // Check for existing reservations (Limit to 3)
        const existedReservations = await Reservation.find({user:req.user.id});
        //If the use ris not an admin, they can only create 3 appointment.
        if(existedReservations.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ 
                success: false, 
                message: `The user with ID ${req.user.id} has already made 3 reservations` 
            });
        }

        const reservation = await Reservation.create(req.body);
        res.status(201).json({ success: true, data: reservation });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Cannot create Reservation" });
    }
};

//@desc     Update reservation
//@route    PUT /api/v1/reservations/:id
//@access   Private
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({success: false, message: `No reservation with id of ${req.params.id}`});
        }

        // Make sure user is reservation owner or admin
        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to update this reservation`});
        }
        
        // time want to change
        const checkDate = req.body.date ? new Date(req.body.date) : new Date(reservation.date);
        const duration = parseInt(req.body.duration || reservation.duration || 60);

        // shop open and close
        const massageShop = await MassageShop.findById(reservation.massageShop);
        
        const dateHour = checkDate.getHours();
        const dateMin = checkDate.getMinutes();
        const totalStartMinutes = (dateHour * 60) + dateMin;
        const totalEndMinutes = totalStartMinutes + duration;

        const [openStr, closeStr] = massageShop.openCloseTime.split(' - ');
        const [openH, openM] = openStr.split(':').map(Number);
        const openTimeMinutes = (openH * 60) + openM;
        const [closeH, closeM] = closeStr.split(':').map(Number);
        const closeTimeMinutes = (closeH * 60) + closeM;

        // Check time
        if (totalStartMinutes < openTimeMinutes || totalStartMinutes > closeTimeMinutes) {
            return res.status(400).json({
                success: false,
                message: `Shop is open ${openStr}-${closeStr}. Your new time is out of range.`
            });
        }

        // Check duration
        if (totalEndMinutes > closeTimeMinutes) {
            const finishHour = Math.floor((totalEndMinutes % 1440) / 60);
            const finishMin = totalEndMinutes % 60;
            const formattedFinishTime = `${finishHour}:${finishMin < 10 ? '0' + finishMin : finishMin}`;

            return res.status(400).json({
                success: false,
                message: `The shop closes at ${closeStr}, but your updated session will finish at ${formattedFinishTime}.`
            });
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({success: true, data: reservation});
    } catch (err) {
        res.status(500).json({success: false, message: "Cannot update Reservation"});
    }
};

//@desc     Delete reservation
//@route    DELETE /api/v1/reservations/:id
//@access   Private
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({success: false, message: `No reservation with id ${req.params.id}`});
        }

        //Make sure user is the appointment owner
        if(reservation.user.toString()!== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success:false,message:`User ${req.user.id} is not authorized to delete this appointment`});
        }

        await reservation.deleteOne();

        res.status(200).json({success: true, data: {}});
    } catch (err) {
        res.status(500).json({success: false, message: "Cannot delete Reservation"});
    }
};
