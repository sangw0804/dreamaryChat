const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId, // 해당 reservation의 _id 와 동일
    checkPoints: { type: mongoose.Schema.Types.Mixed, default: {} }, // { "오상우": 1231133524, "신한결": 1231152413} 과 같이 마지막으로 확인한 시간을 타임스탬프로 기록
    user: {
      // {name: "오상우", phoneNumber: "01087623725"}
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    designer: {
      // {name: "신한결", phoneNumber: "01012345678"}
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    messages: [
      // { content: "안녕", createdAt: 1234567890, from: "오상우", to: "신한결" }
      {
        content: String,
        createdAt: {
          type: Number,
          default: new Date().getTime()
        },
        from: String,
        to: String
      }
    ],
    isValid: {
      // 취소되었거나 완료되었다면 false
      type: Boolean,
      default: false
    },
    needAlarmTalk: {
      // autoAlarmTalk.js 실행시 필요한 플래그 - 한번 알람톡이 보내진 경우에 중복해서 보내지 않도록 해줌.
      type: Boolean,
      default: true
    }
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
