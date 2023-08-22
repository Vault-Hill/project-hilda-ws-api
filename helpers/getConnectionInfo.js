'use strict';

const {
  ApiGatewayManagementApi,
  GetConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

module.exports.getConnectionInfo = async (connectionId, url) => {
  const apigatewayClient = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url,
  });

  const command = new GetConnectionCommand({
    ConnectionId: connectionId,
  });
  apigatewayClient.send(command).then((data) => {
    console.log(data);
  });
};
