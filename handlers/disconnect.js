'use strict';

const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  // read orgId from header
  const orgId = event.headers.org_id;

  //  Delete context in elastiCache using connectionId as key
  // TODO: research if it is cost efficient and performant to delete context or let it expire
  const connectionId = event.requestContext.connectionId;

  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const response = { message: 'Goodbye for now!' };

  //  Send message to client
  await postToConnection(callbackUrl, connectionId, response);

  // Calculate the total prompts and total time spent on the call using the first and last prompt timestamps
  // Update dynamoDB with the total prompts and total time spent on the call for the orgId

  return {
    statusCode: 200,
  };
};
