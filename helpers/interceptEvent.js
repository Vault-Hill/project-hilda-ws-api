const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { postToConnection } = require('./postToConnection');
const { validateCustomerData } = require('./validateCustomerData');

module.exports.interceptEvent = async (event) => {
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const connectionId = event.requestContext.connectionId;
  const payload = JSON.parse(event.body);

  const dynamoDBClient = new DynamoDBClient();

  console.log('INTERCEPT EVENT', payload);

  if (!payload.adhoc) {
    return;
  }

  const response = {
    action: 'prompt',
    orgId: payload.orgId,
    sessionId: connectionId,
    agentName: payload.agentName,
    sessionTtl: Date.now() + 3 * 60 * 1000,
    data: {
      totalDislikes: payload.totalDislikes,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    },
  };

  if (payload.adhoc === 'escalate-level-1') {
    if (!payload.data.message) {
      response.adhoc = 'escalate-level-1';
      response.data.message =
        'I noticed you have been dissatisfied with my responses so far. If you would like me to escalate this conversation to my supervisor, please respond with "Escalate".';
    }

    if (payload.data.message.toLowerCase() === 'escalate') {
      response.adhoc = 'escalate-level-1';
      response.data.message =
        'Okay, I will escalate this conversation to my supervisor. Please provide your phone number so that my supervisor can reach out to you.';
    }

    if (payload.data.message.toLowerCase() === 'continue') {
      response.adhoc = '';
      response.data.message =
        'Okay, I will continue to assist you. Please ask me any question and I will try my best to answer.';
    }

    if (
      payload.data.message.toLowerCase() !== 'escalate' &&
      payload.data.message.toLowerCase() !== 'continue'
    ) {
      response.adhoc = 'escalate-level-1';
      response.data.message =
        'You have not provided a valid option. If you would like me to escalate this conversation to my supervisor, please respond with "Escalate" otherwise, you may respond with "Continue".';
    }
  }

  if (payload.adhoc === 'customer-auth') {
    const data = JSON.parse(payload.data.message);
    const isValid = validateCustomerData(data);

    if (!isValid) {
      response.adhoc = 'customer-auth';
      response.form = payload.form;
      response.data.message =
        'I am sorry, I could not validate your information. Please provide valid name, email, and phone number.';
    }

    if (isValid) {
      const session = await dynamoDBClient.send(
        new GetItemCommand({
          TableName: `${process.env.APP_NAME}-sessions`,
          Key: {
            id: {
              S: connectionId,
            },
          },
        }),
      );

      const context = JSON.parse(session.Item.context.S);
      const message = `My name is ${data.name}, my email address is ${data.email}, and my phone number is ${data.phone}.`;

      context.push({ role: 'user', content: message }, { role: 'assistant', content: 'Thank you' });

      await dynamoDBClient.send(
        new UpdateItemCommand({
          TableName: `${process.env.APP_NAME}-sessions`,
          Key: {
            id: {
              S: connectionId,
            },
          },
          UpdateExpression:
            'SET #name = :name, #email = :email, #phone = :phone, #context = :context',
          ExpressionAttributeNames: {
            '#name': 'name',
            '#email': 'email',
            '#phone': 'phone',
            '#context': 'context',
          },
          ExpressionAttributeValues: {
            ':name': { S: data.name },
            ':email': { S: data.email },
            ':phone': { S: data.phone },
            ':context': {
              S: JSON.stringify(context),
            },
          },
        }),
      );

      response.adhoc = '';
      response.data.message = `Thank you for providing your information. Now, how can I help you ${data.name}?`;
    }
  }

  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
