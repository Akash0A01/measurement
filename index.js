const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const { resolve } = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3010;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/heightDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Height measurement schema
const measurementSchema = new mongoose.Schema({
  height: Number,
  timestamp: { type: Date, default: Date.now }
});

const Measurement = mongoose.model('Measurement', measurementSchema);

// Middleware
app.use(express.static('static'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');

// Routes
app.get('/', async (req, res) => {
  const measurements = await Measurement.find().sort({ timestamp: -1 }).limit(10);
  res.render('index', { measurements });
});

// API endpoint for ESP32
app.post('/api/measurement', async (req, res) => {
  try {
    const { height } = req.body;
    const measurement = new Measurement({ height });
    await measurement.save();
    io.emit('newMeasurement', measurement);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});