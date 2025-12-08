const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://pramanikpriyanka725_db_user:MTaR9JfHFqv4DmGa@cluster0.umnoux4.mongodb.net/NextHire');
    console.log('MongoDB Connected');
    
    
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};



module.exports = connectDB;