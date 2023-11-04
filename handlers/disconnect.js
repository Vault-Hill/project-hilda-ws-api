'use strict';

const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  console.log('DISCONNECT EVENT', event)
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const connectionId = event.requestContext.connectionId;
  const payload = JSON.parse(event.body);

  const dynamoDBClient = new DynamoDBClient();

  // update the session in dynamoDB with the endedAt timestamp
  await dynamoDBClient.send(
    new UpdateItemCommand({
      TableName: `${process.env.APP_NAME}-sessions`,
      Key: {
        id: {
          S: connectionId,
        },
        orgId: {
          S: payload.orgId,
        },
      },
      UpdateExpression: 'SET endedAt = :endedAt',
      ExpressionAttributeValues: {
        ':endedAt': {
          S: new Date().toISOString(),
        },
      },
    }),
  );

  const response = {
    action: 'prompt',
    orgId: payload.orgId,
    data: {
      role: 'assistant',
      message: 'Thank you for reaching out. Goodbye for now.',
      timestamp: new Date().toISOString(),
    },
  };

  //  Send message to client
  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
