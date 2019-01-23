const axios = require('axios');
const querystring = require('querystring');

const logger = require('../log');
const config = require('../config');
const { sendMailPromise } = require('./mailer');

const { Chat } = require('../model/chat');

const buttonName = '드리머리 메세지함';
const url = 'http://dreamary.net/#/message';

const alarmTemplates = {
  userInformMessage: ['USE0007', buttonName, url, url],
  designerInformMessage: ['DES0006', buttonNames, url, url]
};

const alarmAxios = axios.create({
  baseURL: 'http://api.apistore.co.kr/kko/1/msg/dreamary',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-waple-authorization': config.API_STORE_KEY
  }
});

const alarmTalk = async (is_d, template, chat_id, options = {}) => {
  try {
    options.FAILED_TYPE = 'N';
    options.BTN_TYPES = '웹링크';
    options.CALLBACK = '01041112486';
    [options.TEMPLATE_CODE, options.BTN_TXTS, options.BTN_URLS1, options.BTN_URLS2] = alarmTemplates[template];

    const chat = await Chat.findById(chat_id);
    const user = is_d ? chat.designer : chat.user;
    const oppenent = is_d ? chat.user : chat.designer;

    options.PHONE = user.phoneNumber;

    switch (template) {
      // 유저 시술서비스 문의 * * * * * * * * * * * * * * * *
      case 'userInformMessage':
        options.MSG = `${user.name}님, 예디님께서 아래 예약에 대해 시술 및 서비스 문의하셨습니다.

예약사항 : ${oppenent.name} 예디님과의 시술

문의사항은 플러스친구 ‘드리머리 고객센터’로 부탁드립니다.`;
        break;

      // 디자이너 시술서비스 문의 * * * * * * * * * * * * * * * *
      case 'designerInformMessage':
        options.MSG = `${user.name}님, 고객님께서 아래 예약에 대해 시술 및 서비스 문의하셨습니다.

예약사항 : ${oppenent.name} 고객님과의 시술

문의사항은 플러스친구 ‘드리머리 고객센터’로 부탁드립니다.`;
        break;

      default:
        throw new Error('wrong template!!');
        break;
    }

    const { data } = await alarmAxios.post('/', querystring.stringify(options));
    if (data.result_code !== '200') throw new Error(data);
  } catch (e) {
    if (logger) logger.error('alarmTalk Error : %o', e);
    if (logger) logger.error('alarmTalk Error : %o', options);
    try {
      await sendMailPromise(e, options);
    } catch (err) {
      if (logger) logger.error('alarmTalk Error - Send Mail : %o', err);
    }
  }
};

module.exports = { alarmTalk };
