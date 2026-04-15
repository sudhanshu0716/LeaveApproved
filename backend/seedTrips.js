require('dotenv').config();
const mongoose = require('mongoose');
const TripListing = require('./models/TripListing');

const URI = process.env.MONGODB_URI;

const demoTrips = [
  {
    creatorUid: 'seed_hero_1',
    creatorName: 'Aarav Sharma',
    creatorCompany: 'Adventure Co.',
    origin: 'Delhi',
    destination: 'Manali, Himachal Pradesh',
    budget: 'under 5000 rupees',
    days: '3+ days',
    date: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'listed',
    matches: []
  },
  {
    creatorUid: 'seed_hero_2',
    creatorName: 'Priya Patel',
    creatorCompany: 'Nomad Inc',
    origin: 'Mumbai',
    destination: 'Goa',
    budget: 'under 5000 rupees',
    days: '3 day',
    date: new Date(Date.now() + 86400000 * 12).toISOString(),
    status: 'listed',
    matches: []
  },
  {
    creatorUid: 'seed_hero_3',
    creatorName: 'Rohan Gupta',
    creatorCompany: 'Freelance Tech',
    origin: 'Bangalore',
    destination: 'Gokarna',
    budget: 'under 2000 rupees',
    days: '2 day',
    date: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'listed',
    matches: []
  }
];

mongoose.connect(URI)
  .then(async () => {
    console.log('Clearing old trips...');
    await TripListing.deleteMany({ creatorUid: /seed_/ });
    console.log('Seeding new demo trips...');
    await TripListing.insertMany(demoTrips);
    console.log('Success! Trip database populated.');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
