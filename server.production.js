const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Production CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-app-domain.com',
        'https://your-expo-app.exp.direct',
        // Add your production domains here
      ]
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// MTA Vehicle Monitoring API proxy
app.get('/api/vehicle-monitoring', async (req, res) => {
  try {
    const { lineRef } = req.query;
    const apiKey = process.env.MTA_API_KEY;

    if (!apiKey) {
      console.error('MTA_API_KEY not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    if (!lineRef) {
      return res.status(400).json({ error: 'lineRef query parameter is required' });
    }

    const mtaUrl = `https://bustime.mta.info/api/siri/vehicle-monitoring.json?key=${apiKey}&VehicleMonitoringDetailLevel=calls&LineRef=${lineRef}`;

    const response = await fetch(mtaUrl);
    
    if (!response.ok) {
      throw new Error(`MTA API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from MTA Vehicle Monitoring API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from MTA API',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// MTA Stop Monitoring API proxy
app.get('/api/stop-monitoring', async (req, res) => {
  try {
    const { stopId } = req.query;
    const apiKey = process.env.MTA_API_KEY;

    if (!apiKey) {
      console.error('MTA_API_KEY not configured');
      return res.status(500).json({ error: 'API configuration error' });
    }

    if (!stopId) {
      return res.status(400).json({ error: 'stopId query parameter is required' });
    }

    const mtaUrl = `https://bustime.mta.info/api/siri/stop-monitoring.json?key=${apiKey}&MonitoringRef=${stopId}`;

    const response = await fetch(mtaUrl);
    
    if (!response.ok) {
      throw new Error(`MTA API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from MTA Stop Monitoring API:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from MTA API',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(port, () => {
  console.log(`🚀 Production server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;