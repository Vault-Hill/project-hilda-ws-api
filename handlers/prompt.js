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
        TableName: `${process.env.APP_NAME}-sessions`,
        Key: {
          id: {
            S: connectionId,
          },
          orgId: {
            S: payload.orgId,
          },
        },
      }),
    );

    console.log('Session', session);

    const context = JSON.parse(session.Item.context.S);

    console.log('Context', context);

    context.push({ role: 'user', content: payload.data.message });

    console.log('Prompt Input', context)

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
     //attaches the prompt to query user on plausible transfer to human agent
    message += '\n\n Are you satisfied with my response ?';

    const generatedResponse = {
      action: 'prompt',
      orgId: payload.orgId,
      data: {
        role: 'assistant',
        message,
        timestamp: new Date().toISOString(),
      },
    };

     const checkQuery = (payload) => {
      const myQuery = toLowerCase(payload.data.message);
      if (myQuery.includes("no") || myQuery.includes ("not satisfied")){
        console.log("would you like to be transferred to a human agent ?")
      }
    }

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
          orgId: {
            S: payload.orgId,
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
