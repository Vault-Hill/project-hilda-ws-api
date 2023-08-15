'use strict';

const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  // grab the connectionId and callbackUrl from the payload
  const { connectionId, callbackUrl } = event;

  // TODO: Create session context in ElastiCache using connectionId as key
  // Depending on the inferences made from user authentication i.e orgId, we can create a context for the user
  // by pulling the organization's "training" data from dynamoDB

  // const sessionContext = [
  //   {
  //     "role": "system",
  //     "content": "Fetched data from DynamoDB",
  //   },
  // ];

  // await ElasticacheHelper.saveData(context, 'context', connectionId);

  //  Send message to client
  const response = {
    action: 'connect',
    data: {
      role: 'Hilda',
      message: 'Welcome! My name is Hilda. How may I help you?',
      timestamp: Date.now(),
    },
  };

  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
