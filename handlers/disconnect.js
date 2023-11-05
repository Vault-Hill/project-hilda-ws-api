'use strict';

const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  console.log('DISCONNECT EVENT', event);
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
  const startedAt = new Date(Number(session.Item.startedAt.N));
  const endedAt = new Date();
  const sessionDuration = endedAt.getTime() - startedAt.getTime();

  // update the session in dynamoDB with the endedAt timestamp and the duration
  await dynamoDBClient.send(
    new UpdateItemCommand({
      TableName: `${process.env.APP_NAME}-sessions`,
      Key: {
        id: {
          S: connectionId,
        },
      },
      UpdateExpression: 'SET endedAt = :endedAt, sessionDuration = :sessionDuration',
      ExpressionAttributeValues: {
        ':endedAt': {
          N: endedAt.getTime().toString(),
        },
        ':sessionDuration': {
          N: sessionDuration.toString(),
        },
      },
    }),
  );

  return {
    statusCode: 200,
  };
};
