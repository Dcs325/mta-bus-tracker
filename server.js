const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Use CORS to allow requests from your frontend
app.use(cors());

// Define a route to proxy MTA vehicle monitoring requests
app.get('/api/vehicle-monitoring', async (req, res) => {
    const { lineRef } = req.query;
    const apiKey = process.env.MTA_API_KEY || 'c1c955fd-f1f7-4a27-b3e8-8bb897d30ad7'; // MTA API Key from environment

    if (!lineRef) {
        return res.status(400).json({ error: 'lineRef query parameter is required' });
    }

    const mtaUrl = `https://bustime.mta.info/api/siri/vehicle-monitoring.json?key=${apiKey}&VehicleMonitoringDetailLevel=calls&LineRef=${lineRef}`;

    try {
        const response = await fetch(mtaUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from MTA Vehicle Monitoring API:', error);
        res.status(500).json({ error: 'Failed to fetch data from MTA API' });
    }
});

app.listen(port, () => {
    console.log(`Backend proxy server listening at http://localhost:${port}`);
    console.log('Run your frontend in a separate terminal with "npm run web"');
});