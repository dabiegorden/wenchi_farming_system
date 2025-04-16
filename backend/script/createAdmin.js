const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check if MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Admin user details - you can modify these
const ADMIN_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@gmail.com'; 
const ADMIN_PASSWORD = 'admin123'; // Make sure to use a stronger password in production

// Create User model schema
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please fill a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
  },
  role: {
    type: String,
    enum: ['user', 'researcher', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');

    // Extract database name from URI or use default
    const dbName = process.env.MONGODB_URI.includes('/')
      ? process.env.MONGODB_URI.split('/').pop().split('?')[0]
      : 'wenchiFarm';
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: dbName
    });
    console.log('Connected to MongoDB');

    // Register the User model
    const User = mongoose.model('User', userSchema);

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('An admin user already exists:');
      console.log(`Name: ${existingAdmin.name}, Email: ${existingAdmin.email}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existingUser) {
      console.log('A user with this email already exists but is not an admin.');
      console.log('Updating the user to have admin role...');
      
      existingUser.role = 'admin';
      await existingUser.save();
      
      console.log('User updated to admin successfully:');
      console.log(`Name: ${existingUser.name}, Email: ${existingUser.email}, Role: ${existingUser.role}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create a new admin user
    console.log('Creating admin user...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);
    
    // Create and save the admin user
    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully:');
    console.log(`Name: ${adminUser.name}, Email: ${adminUser.email}, Role: ${adminUser.role}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    try {
      await mongoose.disconnect();
    } catch (err) {
      // Ignore disconnect error
    }
    process.exit(1);
  }
}

// Run the script
createAdminUser();