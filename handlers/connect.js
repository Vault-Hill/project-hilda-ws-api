'use strict';

const AWS = require('aws-sdk');
const { getConnectionInfo } = require('../helpers/getConnectionInfo');

module.exports.handler = async (event, context) => {
  try {
    // TODO Authenticate user

    const connectionId = event.requestContext.connectionId;
    const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

    getConnectionInfo(connectionId, callbackUrl);

    const lambda = new AWS.Lambda();

    const params = {
      FunctionName: `${process.env.APP_NAME}-welcome`,
      InvocationType: 'Event',
      Payload: JSON.stringify({ connectionId, callbackUrl }),
    };

    await lambda.invoke(params).promise();
  } catch (error) {
    console.error('Error invoking MY lambda function:', error);
  }

  return {
    statusCode: 200,
  };
};
