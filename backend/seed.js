require('dotenv').config();
const mongoose = require('mongoose');
const Place = require('./models/Place');
const URI = process.env.MONGODB_URI;

const demoPlaces = [
  {
    name: "Ooty Mist Escape",
    budgetRange: "under 2000",
    days: "2 days",
    distance: "under 500km",
    description: "Experience the Nilgiris mist and heritage trains.",
    nodes: [], edges: [], likedBy: [], comments: []
  },
  {
    name: "Coorg Coffee Retreat",
    budgetRange: "under 5000",
    days: "3 days",
    distance: "under 250km",
    description: "Stay in luxury coffee estates with stream-side lunches.",
    nodes: [], edges: [], likedBy: [], comments: []
  },
  {
    name: "Gokarna Beach Calm",
    budgetRange: "under 1000",
    days: "2 days",
    distance: "under 500km",
    description: "Trek the half-moon beach and enjoy hippie vibes.",
    nodes: [], edges: [], likedBy: [], comments: []
  },
  {
    name: "Hampi Stone Ruins",
    budgetRange: "under 1000",
    days: "3 days",
    distance: "under 500km",
    description: "Explore the ancient empire ruins and coracle rides.",
    nodes: [], edges: [], likedBy: [], comments: []
  },
  {
    name: "Chikmagalur Peak Trek",
    budgetRange: "under 2000",
    days: "2 days",
    distance: "under 250km",
    description: "Climb Mullayanagiri and enjoy the cold peak air.",
    nodes: [], edges: [], likedBy: [], comments: []
  },
  {
    name: "Bali Island Dream",
    budgetRange: "over 5000",
    days: "over 3 days",
    distance: "over 1000km",
    description: "Synthesized for ultimate reset in the rice terraces of Ubud.",
    nodes: [], edges: [], likedBy: [], comments: []
  }
];

mongoose.connect(URI)
  .then(async () => {
    console.log('Clearing old data...');
    await Place.deleteMany({});
    console.log('Seeding new demo data...');
    await Place.insertMany(demoPlaces);
    console.log('Success! Database populated.');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
