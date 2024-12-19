// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rentSpaceAutomation = require('../routes/rentSpaceAutomation');

const app = express();
const port = 5500;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://127.0.0.1:5500', // Allow frontend to connect
    methods: ['GET', 'POST']
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rent space endpoint
app.post('/rent-space', async (req, res) => {
    const { startDay, endDay } = req.body;
    console.log('Received request for dates:', startDay, endDay);

    if (!startDay || !endDay) {
        return res.status(400).send("Start and end dates are required!");
    }

    try {
        await rentSpaceAutomation(startDay, endDay);
        res.send('Practice space rental request submitted successfully!');
    } catch (error) {
        console.error("Automation task failed:", error);
        res.status(500).send('Automation task failed. Please check logs for details.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});