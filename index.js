import express from 'express';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());



// Catch-all middleware to handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// Setup of the webserver
const PORT = process.env.API_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
