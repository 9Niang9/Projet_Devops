const express = require('express');
const cors = require('cors');
require('dotenv').config();

const booksRoutes = require('./routes/livres');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'books-service' }));

app.use('/api/books', booksRoutes);

app.listen(PORT, () => {
  console.log(`books-service demarre sur le port ${PORT}`);
});
