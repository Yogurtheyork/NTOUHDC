import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import rentSpaceAutomation from '../routes/rentSpaceAutomation.mjs';
import 'dotenv/config';

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;