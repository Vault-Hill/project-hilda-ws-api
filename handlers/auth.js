'use strict';

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('../helpers/postToConnection');
const { authenticate } = require('../helpers/authenticate');
const { getKnowledgeBase } = require('../helpers/getKnowledgeBase');

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

  const knowledgeBase = getKnowledgeBase(agentName, organization.Item.knowledgeBase.S);

  console.log('Knowledge base', knowledgeBase);

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
    sessionId: connectionId,
    agentName,
    logoUrl,
    sessionTtl: Date.now() + 3 * 60 * 1000,
    adhoc: 'customer-auth',
    form: {
      type: 'customer-auth',
      fields: [
        {
          element: 'input',
          name: 'name',
          label: 'Name',
          type: 'text',
          placeholder: 'Enter your name',
          required: true,
        },
        {
          element: 'input',
          name: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'Enter your email address',
          required: true,
        },
        {
          element: 'input',
          name: 'phone',
          label: 'Phone Number',
          type: 'phone',
          placeholder: 'Enter your phone number',
          required: true,
        },
      ],
    },
    data: {
      role: 'assistant',
      message: `Hi there, I'm ${agentName}. To help you effectively, could you please share your name, email, and phone number?`,
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
