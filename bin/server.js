// server.js
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const rentSpaceAutomation = require('../routes/rentSpaceAutomation');
const path = require('path');


app.use(express.json());
app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile('public/HomePage.html', { root: path.join(__dirname, '..') });
  });

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

module.exports = app;
