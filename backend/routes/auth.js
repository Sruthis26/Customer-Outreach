require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function resetAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find and update admin
    const admin = await Admin.findOne({});
    
    if (!admin) {
      console.log('✗ No admin found');
      process.exit(1);
    }

    console.log('Current admin email:', admin.email);

    // Update credentials
    admin.email = 'admin@gmail.com';
    admin.password = 'admin26'; // Will be auto-hashed by pre-save hook
    await admin.save();

    console.log('✓ Admin credentials updated successfully!');
    console.log('New credentials:');
    console.log('  Email: admin@gmail.com');
    console.log('  Password: admin26');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

resetAdmin();
