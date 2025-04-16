const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

if(!process.env.MONGODB_URI){
    throw new Error("Please setup a mongoDB uri on the env");
}

// connect to the database
const connectToDatabase = async () => {
    try {
        // Extract database name from URI or use default
        const dbName = process.env.MONGODB_URI.includes('/')
            ? process.env.MONGODB_URI.split('/').pop().split('?')[0]
            : 'wenchiFarm';
            
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: dbName // Explicitly set the database name
        });
        
        // console.log("Connected to mongoDB database successfully");
    } catch (error) {
        console.error("Error connecting to the database", error);
        process.exit(1);
    }
}

module.exports = connectToDatabase;