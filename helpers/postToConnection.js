'use strict';

const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

module.exports.postToConnection = async (url, connectionId, payload) => {
  try {
    const apigatewayClient = new ApiGatewayManagementApiClient({
      apiVersion: '2018-11-29',
      endpoint: url,
    });

    console.log('About to post to connectionId', connectionId);
    const command = new PostToConnectionCommand({
      Data: JSON.stringify(payload),
      ConnectionId: connectionId,
    });
    const response = await apigatewayClient.send(command);

    console.log(response);
  } catch (error) {
    console.log('Error posting to connection', error);
  }
};
