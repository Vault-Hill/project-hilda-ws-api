'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

module.exports.handler = async (event, context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
    const accessKey = event.queryStringParameters.acc_key;

    console.log('ACCESS KEY -  CONNECT', accessKey);

    const lambdaClient = new LambdaClient();

    // Invoke the auth lambda function asynchronously
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: `${process.env.SERVICE_NAME}-auth`,
        Payload: JSON.stringify({ connectionId, callbackUrl, accessKey }),
        InvocationType: 'Event',
      }),
    );
  } catch (error) {
    console.error('Error invoking auth lambda function:', error);
  }

  return {
    statusCode: 200,
  };
};
