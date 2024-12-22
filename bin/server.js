// server.js
const express = require('express');
const path = require('path');
const rentSpaceAutomation = require('../routes/rentSpaceAutomation');

const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, '..', 'public', 'HomePage.html');
    res.sendFile(filePath);
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