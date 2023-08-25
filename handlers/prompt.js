const {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} = require('@aws-sdk/client-sagemaker-runtime');
const { postToConnection } = require('../helpers/postToConnection');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

exports.handler = async (event, context) => {
  try {
    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const connectionId = event.requestContext.connectionId;
    const payload = JSON.parse(event.body);

    const dynamoDBClient = new DynamoDBClient();

    // get user's session from dynamoDB
    const session = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: 'project-hilda-dev-sessionsTable',
        Key: {
          orgId: {
            S: payload.orgId,
          },
          connectionId: {
            S: connectionId,
          },
        },
      }),
    );

    console.log('Session', session);

    const context = JSON.parse(session.Item.context.S);

    console.log('Context', context);

    context.push({ role: 'user', content: payload.data.message });

    const prompts = {
      inputs: [context],
      parameters: { max_new_tokens: 256, top_p: 0.9, temperature: 0.6 },
    };

    const sagemakerClient = new SageMakerRuntimeClient();

    const response = await sagemakerClient.send(
      new InvokeEndpointCommand({
        EndpointName: process.env.MODEL_ENDPOINT_NAME,
        ContentType: 'application/json',
        Accept: 'application/json',
        Body: JSON.stringify(prompts),
        CustomAttributes: 'accept_eula=true',
      }),
    );

    const message = JSON.parse(new TextDecoder('utf-8').decode(response.Body))[0].generation
      .content;

    const generatedResponse = {
      action: 'prompt',
      orgId: payload.orgId,
      data: {
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
        TableName: 'project-hilda-dev-sessionsTable',
        Key: {
          orgId: {
            S: payload.orgId,
          },
          connectionId: {
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
