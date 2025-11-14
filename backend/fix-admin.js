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
  role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
  createdAt: { type: Date, default: Date.now }
});

async function updateAdmin() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', userSchema, 'users');

    // Update admin user with correct lowercase role
    const result = await User.updateOne(
      { email: 'admin@tutoring.com' },
      { role: 'admin' }
    );

    if (result.modifiedCount > 0) {
      console.log('✓ Admin account updated successfully!');
      console.log('Email: admin@tutoring.com');
      console.log('Password: admin@12345');
    } else {
      console.log('Admin account not found, creating new one...');
      
      const hashedPassword = await bcrypt.hash('admin@12345', 10);
      const admin = new User({
        username: 'admin',
        email: 'admin@tutoring.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin'
      });

      await admin.save();
      console.log('✓ Admin account created successfully!');
      console.log('Email: admin@tutoring.com');
      console.log('Password: admin@12345');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

updateAdmin();
