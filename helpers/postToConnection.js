'use strict';

const AWS = require('aws-sdk');

module.exports.postToConnection = async (url, connectionId, payload) => {
  const apigatewaymanagementapi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: url,
  });

  try {
    const data = await apigatewaymanagementapi
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      })
      .promise();

    console.log(data);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
