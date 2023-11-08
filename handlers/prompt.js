const { postToConnection } = require('../helpers/postToConnection');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { invokeModel } = require('../helpers/invokeModel');
const { interceptEvent } = require('../helpers/interceptEvent');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

exports.handler = async (event, context) => {
  try {
    const result = await interceptEvent(event);

    if (result) return result;

    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const connectionId = event.requestContext.connectionId;
    const payload = JSON.parse(event.body);

    if (payload.data.action === 'disconnect') {
      const lambdaClient = new LambdaClient();

      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: `${process.env.SERVICE_NAME}-disconnect`,
          Payload: JSON.stringify({ connectionId, callbackUrl }),
          InvocationType: 'Event',
        }),
      );

      return {
        statusCode: 200,
      };
    }

    const dynamoDBClient = new DynamoDBClient();

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

    console.log('Session', session);

    const context = JSON.parse(session.Item.context.S);

    console.log('Context', context);

    context.push({
      role: 'user',
      content: `${payload.data.message} Keep your response short please`,
    });

    console.log('Prompt Input', context);

    const prompts = {
      inputs: [context],
      parameters: { max_new_tokens: 256, top_p: 0.9, temperature: 0.6 },
    };

    const message = await invokeModel({ prompts });

    const generatedResponse = {
      action: 'prompt',
      orgId: payload.orgId,
      sessionId: connectionId,
      agentName: payload.agentName,
      sessionTtl: Date.now() + 3 * 60 * 1000,
      data: {
        totalDislikes: payload.totalDislikes,
        role: 'assistant',
        message,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Generated response', generatedResponse);

    const postPromise = postToConnection(callbackUrl, connectionId, generatedResponse);

    context.push({ role: 'assistant', content: message });

    console.log('Updated context', context);

    const storePromise = dynamoDBClient.send(
      new UpdateItemCommand({
        TableName: `${process.env.APP_NAME}-sessions`,
        Key: {
          id: {
            S: connectionId,
          },
        },
        UpdateExpression: 'SET #context = :context',
        ExpressionAttributeNames: {
          '#context': 'context',
        },
        ExpressionAttributeValues: {
          ':context': {
            S: JSON.stringify(context),
          },
        },
      }),
    );

    await Promise.all([postPromise, storePromise]);
  } catch (error) {
    console.log('ERROR', error);
  }

  return {
    statusCode: 200,
  };
};
