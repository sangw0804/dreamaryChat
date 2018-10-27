const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    messages: [
      {
        content: String,
        createdAt: {
          type: Number,
          default: new Date().getTime()
        },
        from: String,
        to: String
      }
    ]
  },
  {
    versionKey: false
  }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Chat };
