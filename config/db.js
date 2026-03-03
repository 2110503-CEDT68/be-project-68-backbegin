const mongoose = require('mongoose');

const connectDB = async () => {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Old version
    // const conn = await mongoose.connect(process.env.MONGO_URI, {
    //     useNewUrlParser: true,
    //     userUnifiedTopology: true
    // });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
}


module.exports = connectDB;