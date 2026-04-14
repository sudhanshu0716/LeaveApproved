const mongoose = require('mongoose');
const URI = 'mongodb://127.0.0.1:27017/traveler';

mongoose.connect(URI)
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    if (collections.some(c => c.name === 'places')) {
      const count = await db.collection('places').countDocuments();
      console.log('Places count:', count);
      const samples = await db.collection('places').find().limit(2).toArray();
      console.log('Sample Places:', JSON.stringify(samples, null, 2));
    } else {
      console.log('Places collection DOES NOT EXIST');
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
