'use strict';

const { sendMessageToClient } = require('../helpers/sendMessageToClient');
const { getCallbackUrl } = require('../helpers/getCallbackUrl');

module.exports.handler = async (event, context) => {
  const callbackUrl = getCallbackUrl(event);

  const connectionId = event.requestContext.connectionId;

  const response = { message: 'This is the default message' };

  await sendMessageToClient(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
