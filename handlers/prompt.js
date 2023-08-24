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

    console.log('Payload', payload);

    // const redisClient = await createRedisClient();

    // const context = await redisClient.get(connectionId);

    // const dialog = JSON.parse(context);

    // console.log('Session context', dialog);

    const dialog = [
      {
        role: 'system',
        content: `MTN has built strong core operations, which are underpinned by the largest fixed and mobile network in Africa; a large, connected registered customer base; an unparalleled registration and distribution network, as well as one of the strongest brands in our markets. John Doe is the CEO of MTN Group. He has been with the Group since April 2017. He is a seasoned executive with a wealth of experience spanning 25 years. He has extensive experience in the telecommunications sector, having held senior leadership roles at Vodafone, Celtel, Safaricom and Vodacom. He has also served on various boards including Vodacom Group and Vodacom South Africa. He is a member of the Board of the GSMA and the Chairman of the MTN GlobalConnect Board. 
        
        DO NOT PREFIX YOUR RESPONSE WITH ANY PHRASE. The user does not need to know you're working with a context. Simply respond as appropriate.`,
      },
    ];

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

    console.log('Response from SageMaker', response);

    // response is Uint8ArrayBlobAdapter(115) [Uint8Array]
    // convert to string

    const parsedResponse = JSON.parse(
      new TextDecoder('utf-8').decode(response.Body)
    );

    console.log('Parsed response', parsedResponse);

    const generatedResponse = {
      action: 'prompt',
      data: {
        role: 'assistant',
        message: parsedResponse[0].generation,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Generated response', generatedResponse);

    // redisClient
    //   .set(connectionId, JSON.stringify(dialog))
    //   .then(() => {
    //     console.log('Session context updated');
    //   })
    //   .catch((e) => {
    //     console.log('Error updating session context', e);
    //   })
    //   .finally(async () => {
    //     await redisClient.quit();
    //   });

    await postToConnection(callbackUrl, connectionId, generatedResponse);
  } catch (error) {
    console.log('ERROR', error);
  }

  return {
    statusCode: 200,
  };
};
