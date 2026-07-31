const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: 'https://neva-crm.vercel.app',
  credentials: true,
}));

app.get('/403', (req, res) => {
  res.status(403).json({ error: 'forbidden' });
});

app.listen(3001, () => console.log('Listening on 3001'));
