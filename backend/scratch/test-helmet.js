const express = require('express');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(helmet());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
fs.writeFileSync(path.join(uploadDir, 'test.txt'), 'hello world');

app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.listen(3000, () => console.log('Listening on 3000'));
