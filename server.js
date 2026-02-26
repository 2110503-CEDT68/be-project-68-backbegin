const express = require('express');
const dotenv = require('dotenv');

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

//Mount routers
app.use('/api/v1/massageShops', massageShops);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservations', reservations);

const PORT=process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));