'use strict';

const AWS = require('aws-sdk');

module.exports.getConnectionInfo = (connectionId, callbackUrl) => {
  const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: callbackUrl,
  });

  const params = {
    ConnectionId: connectionId,
  };

  apigatewaymanagementapi.getConnection(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else console.log(data); // successful response
  });
};
