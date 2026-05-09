const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('CI/CD Pipeline Working. that is cool!! 🚀');
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});

module.exports = app;
