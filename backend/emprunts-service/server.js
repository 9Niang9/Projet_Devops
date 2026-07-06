const express = require('express');
const cors = require('cors');
require('dotenv').config();

const loansRoutes = require('./routes/emprunts');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'emprunts-service' }));

app.use('/api/emprunts', loansRoutes);

app.listen(PORT, () => {
  console.log(`Emprunts-service demarre sur le port ${PORT}`);
});
