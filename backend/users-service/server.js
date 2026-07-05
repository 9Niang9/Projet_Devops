const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'users-service' }));

app.use('/api/users', usersRoutes);

app.listen(PORT, () => {
  console.log(`Users-service demarre sur le port ${PORT}`);
});
