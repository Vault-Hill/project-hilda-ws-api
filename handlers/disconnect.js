'use strict';

const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  console.log('DISCONNECT EVENT', event);
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const connectionId = event.requestContext.connectionId;

  const dynamoDBClient = new DynamoDBClient();

  // fetch the session from dynamoDB
  const session = await dynamoDBClient.send(
    new GetItemCommand({
      TableName: `${process.env.APP_NAME}-sessions`,
      Key: {
        id: {
          S: connectionId,
        },
      },
    }),
  );

  // calculate how long the session lasted
  const startedAt = new Date(session.Item.startedAt.N);
  const endedAt = new Date();
  const duration = endedAt.getTime() - startedAt.getTime();

  // update the session in dynamoDB with the endedAt timestamp and the duration
  await dynamoDBClient.send(
    new UpdateItemCommand({
      TableName: `${process.env.APP_NAME}-sessions`,
      Key: {
        id: {
          S: connectionId,
        },
      },
      UpdateExpression: 'SET endedAt = :endedAt, duration = :duration',
      ExpressionAttributeValues: {
        ':endedAt': {
          N: endedAt.getTime().toString(),
        },
        ':duration': {
          N: duration.toString(),
        },
      },
    }),
  );

  return {
    statusCode: 200,
  };
};
