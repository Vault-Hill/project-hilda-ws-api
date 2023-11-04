const { postToConnection } = require('./postToConnection');
const { validatePhone } = require('./validatePhone');

module.exports.interceptEvent = async (event) => {
  const callbackUrl = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;
  const connectionId = event.requestContext.connectionId;
  const payload = JSON.parse(event.body);

  console.log('INTERCEPT EVENT', payload);

  if (payload.escalation !== 'Level 1') {
    return;
  }

  const response = {
    action: 'prompt',
    orgId: payload.orgId,
    sessionId: connectionId,
    agentName: payload.agentName,
    data: {
      totalDislikes: payload.totalDislikes,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    },
  };

  if (payload.data.message === 'Escalate: Level 1') {
    response.escalation = 'Level 1';
    response.data.message =
      'I noticed you have been dissatisfied with my responses so far. If you would like me to escalate this conversation to my supervisor, please respond with "Escalate".';
  } else if (payload.data.message.toLowerCase() === 'continue') {
    response.escalation = '';
    response.data.message =
      'Okay, I will continue to assist you. Please ask me any question and I will try my best to answer.';
  } else if (payload.data.message.toLowerCase() === 'escalate') {
    response.escalation = 'Level 1';
    response.data.message =
      'Okay, I will escalate this conversation to my supervisor. Please provide your phone number so that my supervisor can reach out to you.';
  } else if (validatePhone(payload.data.message)) {
    response.escalation = '';
    response.data.message =
      'Thank you for providing your phone number. My supervisor will reach out to you shortly.';
  } else {
    response.escalation = 'Level 1';
    response.data.message =
      'You have not provided a valid option. If you would like me to escalate this conversation to my supervisor, please respond with "Escalate" otherwise, you may respond with "Continue".';
  }

  await postToConnection(callbackUrl, connectionId, response);

  return {
    statusCode: 200,
  };
};
