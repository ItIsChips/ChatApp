const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const messages = [];
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

app.get('/messages', (req, res) => {
  res.json(messages);
});

app.post('/message', upload.single('file'), (req, res) => {
  const { username, text } = req.body;
  const msg = {
    username,
    text,
    fileUrl: req.file ? '/uploads/' + req.file.filename : null
  };
  messages.push(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
  res.sendStatus(200);
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
