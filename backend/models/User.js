const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        minLength: 2,
        maxLength: 50,
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please fill a valid email address"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: 8,
    }
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

module.exports = User;