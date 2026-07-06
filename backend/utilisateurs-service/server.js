const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usersRoutes = require('./routes/utilisateurs');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'utilisateurs-service' }));

app.use('/api/utilisateurs', usersRoutes);

app.listen(PORT, () => {
  console.log(`Utilisateurs-service demarre sur le port ${PORT}`);
});
