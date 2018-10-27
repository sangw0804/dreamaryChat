const http = require('http');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

const { Chat } = require('./model/chat');

app.use(cors());

mongoose.connect(
  'mongodb://localhost:27017/dreamary_chat',
  { useNewUrlParser: true }
);

const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);

io.on('connection', socket => {
  console.log('user join!');

  socket.on('join', (params, callback) => {
    socket.join(params.reservationId);
  });

  socket.on('getMessages', async (params, callback) => {
    let chat = await Chat.findById(params.reservationId);
    if (!chat) {
      chat = await Chat.create({
        _id: params.reservationId,
        messages: []
      });
    }

    callback(chat.messages);
  });

  socket.on('createMessage', async (params, callback) => {
    const nowTime = new Date().getTime();
    io.to(params.reservationId).emit('newMessage', {
      content: params.content,
      from: params.from,
      to: params.to,
      createdAt: nowTime
    });
    const chat = await Chat.findById(params.reservationId);
    chat.messages.push({
      content: params.content,
      from: params.from,
      to: params.to,
      createdAt: nowTime
    });
    await chat.save();
  });
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`server is listening to :${port}`);
});
