'use strict';

const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  // grab the connectionId and callbackUrl from the payload
  const { connectionId, callbackUrl } = event;

  // TODO: Create context in elastiCache using connectionId as key

  //  Send message to client
  const response = { message: 'Welcome! My name is Hilda. How may I help you?' };

  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
