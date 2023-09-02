'use strict';

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('../helpers/postToConnection');

module.exports.handler = async (event, context) => {
  // TODO: Authenticate user

  // Get connectionId and callbackUrl from event
  const { connectionId, callbackUrl } = event;

  // Depending on the inferences made from user authentication i.e orgId, subscription, we can create a context for the user
  // by pulling the organization's knowledge base from dynamoDB
  const orgId = '1a2b3c';

  const dynamoDBClient = new DynamoDBClient();

  // TODO: Remove Below ===================================================== //
  // Temporary code to create a user managed knowledge base for MTN.
  // Implement UI with character limit for updating knowledge base
  await dynamoDBClient.send(
    new PutItemCommand({
      TableName: `${process.env.APP_NAME}-organizations`,
      Item: {
        orgId: { S: orgId },
        name: { S: 'MTN' },
        knowledgeBase: {
          S: `
          Your Name will be Hilda and you will work as a Virtual Assistant for MTN.
          
          Below is what you need to know about MTN:
          
          MTN has built strong core operations, which are underpinned by the largest fixed and mobile network in Africa; a large, connected registered customer base; an unparalleled registration and distribution network, as well as one of the strongest brands in our markets.

          John Doe is the CEO of MTN Group. He has been with the Group since April 2017. He is a seasoned executive with a wealth of experience spanning 25 years. He has extensive experience in the telecommunications sector, having held senior leadership roles at Vodafone, Celtel, Safaricom and Vodacom. He has also served on various boards including Vodacom Group and Vodacom South Africa. He is a member of the Board of the GSMA and the Chairman of the MTN GlobalConnect Board.

          DO NOT PREFIX YOUR RESPONSE. The user does not need to know you're working with a context. Simply respond as appropriate. NEVER RETURN AN EMPTY STRING. If you don't have an answer to a question, politely say you don't understand the question and ask the user to rephrase the question or ask another question.
        `,
        },
      },
    }),
  );
  // TODO: Remove Above ===================================================== //

  // Grab organization's knowledge base from dynamoDB
  const organization = await dynamoDBClient.send(
    new GetItemCommand({
      Key: {
        orgId: {
          S: '1a2b3c',
        },
      },
      TableName: `${process.env.APP_NAME}-organizations`,
    }),
  );
  console.log('Organization', organization);

  const knowledgeBase = organization.Item.knowledgeBase.S;

  // use connectId and knowledgeBase to create a context for the user
  await dynamoDBClient.send(
    new PutItemCommand({
      TableName: `${process.env.APP_NAME}-sessions`,
      Item: {
        connectionId: { S: connectionId },
        orgId: { S: orgId },
        context: {
          S: JSON.stringify([
            {
              role: 'system',
              content: knowledgeBase,
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
