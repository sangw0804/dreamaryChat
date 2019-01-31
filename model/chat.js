const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    checkPoints: { type: mongoose.Schema.Types.Mixed, default: {} },
    user: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    designer: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
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

// chatSchema.statics.updateChecked = async function(userId) {
//   const Chat = this;
//   Chat.find;
// };

const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Chat };
