'use strict';

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('../helpers/postToConnection');
const { authenticate } = require('../helpers/authenticate');
const { getKnowledge } = require('../helpers/getKnowledge');

module.exports.handler = async (event, context) => {
  // Get connectionId and callbackUrl from event
  const { connectionId, callbackUrl, accessKey } = event;

  if (!accessKey) {
    console.log('No access key provided');
    return {
      statusCode: 401,
      message: 'Unauthorized',
    };
  }

  console.log('ACCESS KEY -  AUTH', accessKey);

  const { orgId, logoUrl, agentName } = authenticate(accessKey);

  if (!orgId) {
    console.log('No organization found');
    return {
      statusCode: 401,
      message: 'Unauthorized',
    };
  }

  const dynamoDBClient = new DynamoDBClient();

  // Grab organization's knowledge base from dynamoDB
  const organization = await dynamoDBClient.send(
    new GetItemCommand({
      Key: {
        id: {
          S: orgId,
        },
      },
      TableName: `${process.env.APP_NAME}-organizations`,
    }),
  );
  console.log('Organization', organization);

  const knowledgeBase = organization.Item.knowledgeBase.S;
  const systemKnowledge = getKnowledge(agentName);

  const knowledge = ` 
  ${systemKnowledge}

  ${knowledgeBase}
  `;

  // use connectId and knowledgeBase to create a context for the user
  await dynamoDBClient.send(
    new PutItemCommand({
      TableName: `${process.env.APP_NAME}-sessions`,
      Item: {
        id: { S: connectionId },
        orgId: { S: orgId },
        startedAt: { N: Date.now().toString() },
        context: {
          S: JSON.stringify([
            {
              role: 'system',
              content: knowledge,
            },
          ]),
        },
      },
    }),
  );

  //  Send message to client
  const response = {
    action: 'connect',
    orgId,
    agentName,
    logoUrl,
    data: {
      role: 'assistant',
      message: 'Hi there! How may I help you?',
      timestamp: Date.now(),
    },
  };

  console.log('Sending message to client', connectionId, callbackUrl);
  await postToConnection(callbackUrl, connectionId, response);
  console.log('Message sent to client');

  return {
    statusCode: 200,
  };
};
