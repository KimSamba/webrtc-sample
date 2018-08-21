const express = require('express');
const app = express();
const fs = require('fs');

const options = {
  key: fs.readFileSync('./cert/server.key'),
  cert: fs.readFileSync('./cert/server.cert')
};

const https = require('https');
const server = https.createServer(options, app);
const io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  socket.on('data', (data) => {
    console.log(data);
    socket.broadcast.emit('data', data);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
