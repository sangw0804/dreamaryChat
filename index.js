const http = require('http');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./log');

const { Chat } = require('./model/chat');

app.use(cors());

mongoose.connect(
  'mongodb://localhost:27017/dreamary_chat',
  { useNewUrlParser: true }
);

const server = http.createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);

try {
  io.on('connection', socket => {
    socket.on('join', (params, callback) => {
      logger.info('join!');
      socket.join(params.reservationId);
      // callback();
    });

    socket.on('joinChat', (params, callback) => {
      logger.info('joinChat!');
      socket.join(`${params.reservationId}_chat`);

      callback();
    });

    socket.on('leaveChat', (params, callback) => {
      logger.info('leaveChat!');
      socket.leave(`${params.reservationId}_chat`);
    });

    socket.on('updateCheckpoint', async (params, callback) => {
      let chat = await Chat.findById(params.reservationId);

      const clients = io.sockets.adapter.rooms[`${params.reservationId}_chat`].sockets;
      const numClients = typeof clients !== 'undefined' ? Object.keys(clients).length : 0;

      chat.checkPoints[params.names[0]] = new Date().getTime();

      if (numClients === 2) chat.checkPoints[params.names[1]] = new Date().getTime();

      chat.markModified('checkPoints');
      await chat.save();
      logger.info(chat);

      socket.to(params.reservationId).emit('newCheckPoints', { checkPoints: chat.checkPoints });
      callback(chat.checkPoints);
    });

    socket.on('getMessages', async (params, callback) => {
      let chat = await Chat.findById(params.reservationId);
      if (!chat) {
        chat = await Chat.create({
          _id: params.reservationId,
          messages: [],
          checkPoints
        });
      }

      callback(chat.messages, chat.checkPoints);
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

      callback();
    });
  });
} catch (e) {
  logger.error(e);
}

const port = process.env.PORT || 3001;
server.listen(port, () => {
  logger.info(`server is listening to :${port}`);
});
