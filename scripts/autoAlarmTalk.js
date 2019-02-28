const mongoose = require('mongoose');

const { alarmTalk } = require('../helpers/alarmTalk');
const config = require('../config');
const { Chat } = require('../model/chat');
const logger = require('../log');

// 매시 00분 / 30분 마다 chat 디비를 순회하면서 아직 완료되거나 취소되지 않은 예약의 chat을 찾아
// if 마지막 메세지를 받은사람이 읽지 않은 경우 && 그 경우에 대해 알람톡을 보내지 않은 경우
//    알람톡을 전송하고 알람톡을 보냈음을 needAlarmTalk 플래그로 표시한다.

mongoose.connect(config.MONGO_DB_URL, { useNewUrlParser: true });

const autoAlarmTalk = async () => {
  try {
    const chats = await Chat.find({ isValid: true });

    const promises = chats.map(async chat => {
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

    return Promise.all(promises);
  } catch (e) {
    logger.error('autoAlarmTalk : %o', e);
  }
};

autoAlarmTalk().then(() => mongoose.disconnect());
