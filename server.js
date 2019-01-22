const express = require('express');
const mongoose = require('mongoose');
const ejs = require('ejs');
const bodyParser = require('body-parser');

const app = express();

const logger = require('./log');
const { Chat } = require('./model/chat');

mongoose.connect(
  'mongodb://localhost:27017/dreamary_chat',
  { useNewUrlParser: true }
);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    res.status(200).render('index');
  } catch (e) {
    logger.error('%e', e);
    res.status(400).send(e);
  }
});

app.post('/authentication', async (req, res) => {
  try {
    if (req.body.id !== 'dreamary' || req.body.password !== 'observer123^^') return res.status(200).render('authfail');

    const chats = await Chat.find();

    res.status(200).render('main', { chats });
  } catch (e) {
    logger.error('%e', e);
    res.status(400).send(e);
  }
});

const port = 3003;
app.listen(port, () => {
  logger.info(`server is listening at :${port}`);
});
