'use strict';

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

module.exports.handler = async (event, context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

    const lambdaClient = new LambdaClient();

    const command = new InvokeCommand({
      FunctionName: `${process.env.APP_NAME}-auth`,
      Payload: JSON.stringify({ connectionId, callbackUrl }),
      InvocationType: 'Event',
    });

    // Invoke the auth lambda function asynchronously
    await lambdaClient.send(command);
  } catch (error) {
    console.error('Error invoking MY lambda function:', error);
  }

  return {
    statusCode: 200,
  };
};
