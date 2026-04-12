const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Place = require('./models/Place');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const days = await Place.distinct('days');
    console.log('Unique days in DB:', days);
    
    // Perform the update
    const res = await Place.updateMany(
      { days: { $in: ['4 days', '1 week'] } }, 
      { $set: { days: 'over 3 days' } }
    );
    console.log('Updated:', res.modifiedCount);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
