const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});
const Place = require('./backend/models/Place');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const days = await Place.distinct('days');
    console.log('Unique days in DB:', days);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
