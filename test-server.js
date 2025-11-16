const express = require('express');
const app = express();

app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working' });
});

app.listen(3001, () => {
    console.log('Test server running on port 3001');
});