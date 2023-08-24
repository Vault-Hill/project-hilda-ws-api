'use strict';

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
// const { createRedisClient } = require('../helpers/createRedisClient');
const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  // TODO: Authenticate user

  // Get connectionId and callbackUrl from event
  const { connectionId, callbackUrl } = event;

  // const redisClient = await createRedisClient();

  // Depending on the inferences made from user authentication i.e orgId, subscription, we can create a context for the user
  // by pulling the organization's knowledge base from dynamoDB

  const dynamoDBClient = new DynamoDBClient();
  
  // Temporary code to create a knowledge base for MTN
  const putCommand = new PutItemCommand({
    TableName: 'project-hilda-dev-orgsTable',
    Item: {
      name: { S: 'MTN' },
      regNo: { S: '1a2b3c' },
      knowledgeBase: {
        S: `MTN has built strong core operations, which are underpinned by the largest fixed and mobile network in Africa; a large, connected registered customer base; an unparalleled registration and distribution network, as well as one of the strongest brands in our markets. John Doe is the CEO of MTN Group. He has been with the Group since April 2017. He is a seasoned executive with a wealth of experience spanning 25 years. He has extensive experience in the telecommunications sector, having held senior leadership roles at Vodafone, Celtel, Safaricom and Vodacom. He has also served on various boards including Vodacom Group and Vodacom South Africa. He is a member of the Board of the GSMA and the Chairman of the MTN GlobalConnect Board. DO NOT PREFIX YOUR RESPONSE WITH ANY PHRASE. The user does not need to know you're working with a context. Simply respond as appropriate.`,
      },
    },
  });

  await dynamoDBClient.send(putCommand);

  const getCommand = new GetItemCommand({
    Key: {
      name: {
        S: 'MTN',
      },
      regNo: {
        S: '1a2b3c',
      },
    },
    TableName: 'project-hilda-dev-orgsTable',
  });

  const organization = await dynamoDBClient.send(getCommand);
  console.log(organization);

  // redisClient
  //   .set(connectionId, JSON.stringify(sessionContext))
  //   .then(() => {
  //     console.log('Session context created');
  //   })
  //   .catch((e) => {
  //     console.log('Error creating session context', e);
  //   })
  //   .finally(async () => {
  //     await redisClient.quit();
  //   });

  //  Send message to client
  const response = {
    action: 'connect',
    data: {
      role: 'assistant',
      message: 'Welcome! How may I help you?',
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
