const mongoose = require('mongoose');

mongoose.connect(
  'mongodb://localhost:27017/dreamary_chat',
  { useNewUrlParser: true }
);

const { Chat } = require('./model/chat');

const seedChatDB = async () => {
  try {
    await Chat.remove({});
  } catch (e) {
    throw new Error(e);
  }
};

const seedDB = async () => {
  try {
    await seedChatDB();
    console.log('successfully seeded DB!');
  } catch (e) {
    console.log(e);
  }
};

seedDB();
