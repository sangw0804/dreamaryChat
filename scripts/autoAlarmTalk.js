const mongoose = require('mongoose');

const { alarmTalk } = require('../helpers/alarmTalk');
const config = require('../config');
const { Chat } = require('../model/chat');
const logger = require('../log');

mongoose.connect(config.MONGO_DB_URL, { useNewUrlParser: true });

const autoAlarmTalk = async () => {
  try {
    const chats = await Chat.find({ isValid: true });
    console.log(chats);

    chats.forEach(async chat => {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (
        lastMessage &&
        (!chat.checkPoints[lastMessage.to] || lastMessage.createdAt > chat.checkPoints[lastMessage.to])
      ) {
        if (chat.needAlarmTalk) {
          chat.needAlarmTalk = false;
          await chat.save();

          const [template, from_u] =
            chat.user.name === lastMessage.from ? ['designerInformMessage', true] : ['userInformMessage', false];
          await alarmTalk(from_u, template, chat._id);
        }
      }
    });
  } catch (e) {
    logger.error('autoAlarmTalk : %o', e);
  }
};

autoAlarmTalk().then(() => mongoose.disconnect());
