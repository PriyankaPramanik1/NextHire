const mongoose = require('mongoose');
const User = require('../Models/User');
require('dotenv').config();

const fixProfilePictures = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexthire');
    
    console.log('Connected to MongoDB');
    
    // Find all users with undefined or invalid profilePicture
    const users = await User.find({
      $or: [
        { 'profile.profilePicture': undefined },
        { 'profile.profilePicture': { $exists: false } },
        { 'profile.profilePicture': null },
        { 'profile.profilePicture': { $type: 'string' } },
        { 'profile.profilePicture': { $type: 'number' } },
        { 'profile.profilePicture': { $type: 'bool' } }
      ]
    });
    
    console.log(`Found ${users.length} users with profilePicture issues`);
    
    let fixedCount = 0;
    const updates = [];
    
    for (const user of users) {
      console.log(`Processing user: ${user.email} (${user._id})`);
      
      // Ensure profile exists
      if (!user.profile) {
        user.profile = {};
      }
      
      // Check current profilePicture value
      console.log(`Current profilePicture:`, user.profile.profilePicture);
      
      // Fix profilePicture
      if (!user.profile.profilePicture || 
          typeof user.profile.profilePicture !== 'object' ||
          user.profile.profilePicture === null) {
        
        user.profile.profilePicture = { url: '', publicId: '' };
        console.log(`Setting to default:`, user.profile.profilePicture);
        updates.push(user.save());
        fixedCount++;
      }
      
      // Also fix resume if needed
      if (!user.profile.resume || 
          typeof user.profile.resume !== 'object' ||
          user.profile.resume === null) {
        
        user.profile.resume = { url: '', publicId: '' };
      }
      
      // Fix company.logo for employers
      if (user.role === 'employer' && user.company) {
        if (!user.company.logo || 
            typeof user.company.logo !== 'object' ||
            user.company.logo === null) {
          
          user.company.logo = { url: '', publicId: '' };
        }
      }
    }
    
    // Save all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Total users processed: ${users.length}`);
    console.log(`- Users fixed: ${fixedCount}`);
    
    // Verify the fix
    const remainingIssues = await User.find({
      $or: [
        { 'profile.profilePicture': undefined },
        { 'profile.profilePicture': null }
      ]
    }).countDocuments();
    
    console.log(`\nVerification:`);
    console.log(`- Users still with issues: ${remainingIssues}`);
    
    if (remainingIssues === 0) {
      console.log('✅ All profilePicture issues have been fixed!');
    } else {
      console.log('⚠️ Some issues remain, please check the data.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
};

fixProfilePictures();