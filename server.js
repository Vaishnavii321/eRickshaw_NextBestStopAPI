const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const stops = [
  { id: 1, name: 'Stop A', location: { latitude: 12.9616, longitude: 77.5946 }, demand: {}, supply: 2 },
  { id: 2, name: 'Stop B', location: { latitude: 12.9716, longitude: 77.5846 }, demand: {}, supply: 1 },
  { id: 3, name: 'Stop C', location: { latitude: 12.9816, longitude: 77.6046 }, demand: {}, supply: 5 },
];

// Mock demand function
const getDemand = (stopId, currentTime) => {
  const hour = new Date(currentTime).getHours();
  const weekday = new Date(currentTime).getDay();

  const baseDemand = { 1: 30, 2: 50, 3: 20 }; // Base demand for stops
  const peakMultiplier = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.5 : 1;

  return baseDemand[stopId] * peakMultiplier;
};

// Haversine formula to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
};

// Calculate the best stop
const calculateBestStop = (currentLocation, currentTime) => {
  const { latitude, longitude } = currentLocation;

  let bestStop = null;
  let maxScore = -Infinity;

  for (const stop of stops) {
    const demand = getDemand(stop.id, currentTime);
    const distance = calculateDistance(latitude, longitude, stop.location.latitude, stop.location.longitude);
    const supply = stop.supply;

    const score = demand / Math.max(supply, 1) - distance; // Custom scoring formula
    if (score > maxScore) {
      maxScore = score;
      bestStop = stop;
    }
  }

  return bestStop;
};

// API Endpoint
app.post('/next-stop', (req, res) => {
  const { currentLocation, currentTime } = req.body;

  if (!currentLocation || !currentTime) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const bestStop = calculateBestStop(currentLocation, currentTime);

  if (bestStop) {
    res.json({
      nextStop: {
        id: bestStop.id,
        name: bestStop.name,
        location: bestStop.location,
      },
    });
  } else {
    res.status(404).json({ error: 'No suitable stop found' });
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
