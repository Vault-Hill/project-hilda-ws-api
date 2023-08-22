const {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} = require('@aws-sdk/client-sagemaker-runtime');
const { postToConnection } = require('../helpers/postToConnection');
const { createRedisClient } = require('../helpers/createRedisClient');

exports.handler = async (event, context) => {
  try {
    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const connectionId = event.requestContext.connectionId;
    const payload = JSON.parse(event.body);

    console.log('Payload', payload)

    const redisClient = await createRedisClient();

    const context = await redisClient.get(connectionId);

    const dialog = JSON.parse(context);

    console.log('Session context', dialog);

    dialog.push({ role: 'user', content: payload.data.message });

    const prompts = {
      inputs: [dialog],
      parameters: { max_new_tokens: 256, top_p: 0.9, temperature: 0.6 },
    };

    const endpointName = process.env.MODEL_ENDPOINT_NAME;
    const sagemakerClient = new SageMakerRuntimeClient();

    const command = new InvokeEndpointCommand({
      EndpointName: endpointName,
      ContentType: 'application/json',
      Accept: 'application/json',
      Body: JSON.stringify(prompts),
      CustomAttributes: 'accept_eula=true',
    });

    const response = await sagemakerClient.send(command);
    const responseBody = response.Body.toString('utf8');
    const parsedResponse = JSON.parse(responseBody);

    console.log('Parsed response', parsedResponse)

    const generatedResponse = {
      action: 'prompt',
      data: {
        role: 'assistant',
        message: parsedResponse[0].generation,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Generated response', generatedResponse);

    redisClient
      .set(connectionId, JSON.stringify(dialog))
      .then(() => {
        console.log('Session context updated');
      })
      .catch((e) => {
        console.log('Error updating session context', e);
      })
      .finally(async () => {
        await redisClient.quit();
      });

    await postToConnection(callbackUrl, connectionId, generatedResponse);
  } catch (error) {
    console.log('ERROR', error);
  }

  return {
    statusCode: 200,
  };
};
