'use strict';

const { generateResponse } = require('../helpers/generateResponse');
const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

  const connectionId = event.requestContext.connectionId;

  console.log('event', event);

  const payload = JSON.parse(event.body);

  // TODO: fetch previous prompts from elastiCache
  const combinedPrompt = [];

  combinedPrompt.push(payload.message);

  const response = await generateResponse(combinedPrompt);

  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
