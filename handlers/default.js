'use strict';

module.exports.handler = async (event, context) => {
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const connectionId = event.requestContext.connectionId;

  //  Send message to client
  const response = {
    action: 'default',
    data: {
      role: 'Hilda',
      message: 'Hello there!',
      timestamp: Date.now(),
    },
  };

  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
