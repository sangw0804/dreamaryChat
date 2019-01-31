const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

const logger = require('./log');
const config = require('./config');

const { Chat } = require('./model/chat');
const { alarmTalk } = require('./helpers/alarmTalk');

app.use(cors());

mongoose.connect(
  config.MONGO_DB_URL,
  { useNewUrlParser: true }
);

const server = http.createServer(app);
const server2 = https.createServer(
  {
    ca: fs.readFileSync('/etc/letsencrypt/archive/dreamary-chat.ga/chain1.pem'),
    key: fs.readFileSync('/etc/letsencrypt/archive/dreamary-chat.ga/privkey1.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/archive/dreamary-chat.ga/cert1.pem')
  },
  app
);
const socketIO = require('socket.io');
const io = socketIO(server);
const io2 = socketIO(server2);

const callback = (socket, io) => {
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
    try {
      let chat = await Chat.findById(params.reservationId);

	  logger.info('%o', io.sockets.adapter.rooms);
	  logger.info('%o', params);
	  logger.info('%o', io.sockets.adapter.rooms[`${params.reservationId}_chat`]);
      const clients = io.sockets.adapter.rooms[`${params.reservationId}_chat`].sockets;
      const numClients = typeof clients !== 'undefined' ? Object.keys(clients).length : 0;

      chat.checkPoints[params.names[0]] = new Date().getTime();

      if (numClients === 2) chat.checkPoints[params.names[1]] = new Date().getTime();

      chat.markModified('checkPoints');
      await chat.save();
      logger.info(chat);

      socket.to(params.reservationId).emit('newCheckPoints', { checkPoints: chat.checkPoints });
      callback(chat.checkPoints);
    } catch (e) {
      logger.error('updateCheckpoint : %o', e);
    }
  });

  socket.on('getMessages', async (params, callback) => {
    try {
      let chat = await Chat.findById(params.reservationId);
	  logger.info("%o", params);
      if (!chat) {
        chat = await Chat.create({
          _id: params.reservationId,
          messages: [],
          checkPoints: params.checkPoints,
          user: {
            name: params.user.name,
            phoneNumber: params.user.phoneNumber
          },
          designer: {
            name: params.designer.name,
            phoneNumber: params.designer.phoneNumber
          }
        });
      }
      let i = chat.messages.length - 31;
      if (i < 0) i = 0;
      callback(chat.messages.slice(i), chat.checkPoints);
    } catch (e) {
      logger.error('getMessages : %o', e);
    }
  });

  socket.on('getMoreMessages', async (params, callback) => {
    try {
      let chat = await Chat.findById(params.reservationId);
      let i = chat.messages.length - (31 + params.msgNum);
      if (i < 0) i = 0;
      callback(chat.messages.slice(i), chat.checkPoints);
    } catch (e) {
      logger.error('getMoreMessages : %o', e);
    }
  });

  socket.on('createMessage', async (params, callback) => {
    try {
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

      // 첫 메세지일 경우 알람톡 전송
      if (chat.messages.length === 1 && chat.user && chat.user.name) {
        const [template, is_d] =
          chat.user.name === params.from ? ['designerInformMessage', false] : ['userInformMessage', true];
        await alarmTalk(is_d, template, chat._id);
      }

      callback();
    } catch (e) {
      logger.error('createMessage : %o', e);
    }
  });
};

io.on('connection', socket => callback(socket, io));
io2.on('connection', socket => callback(socket, io2));

const port = process.env.PORT || 3030;
server.listen(port, () => {
  logger.info(`server is listening to :${port}`);
});

const port2 = 443;
server2.listen(port2, () => {
  logger.info(`secured server is listening to :${port2}`);
});
