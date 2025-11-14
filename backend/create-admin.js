const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tutoring-tool';

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['STUDENT', 'TUTOR', 'ADMIN'], default: 'STUDENT' },
  createdAt: { type: Date, default: Date.now }
});

async function createAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', userSchema, 'users');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@tutoring.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin@12345', 10);

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@tutoring.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN'
    });

    await admin.save();
    console.log('✓ Admin account created successfully!');
    console.log('Email: admin@tutoring.com');
    console.log('Password: admin@12345');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
