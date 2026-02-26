const express = require('express');
const dotenv = require('dotenv');
const cookieParser=require('cookie-parser');

const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

const connectDB = require('./config/db');

//Route files
const massageShops = require ('./routes/massageShops');
const auth = require('./routes/auth');
const reservations = require('./routes/reservations');

//Load env vars
dotenv.config({path:'./config/config.env'});

//Connect to database
connectDB();

const app = express();

//Body parser
app.use(express.json());

//Cookie parser
app.use(cookieParser());

//Security
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
const limiter = rateLimit({
    windowsMs:10*60*1000, //10 min
    max:100
})
app.use(limiter);
app.use(hpp());
app.use(cors());

//Mount routers
app.use('/api/v1/massage-shops', massageShops);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservations);

const PORT=process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unnhandle promise rejections
process.on('unhandledRejection', (err,promise) => {
    console.log(`Error: ${err.message}`);
    //Close server & exit process
    server.close(() => process.exit(1));
});