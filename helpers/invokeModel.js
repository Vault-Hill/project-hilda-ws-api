const {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} = require('@aws-sdk/client-sagemaker-runtime');

module.exports.invokeModel = async ({ query, parameters, prompts }) => {
  const defaultParameters = { max_new_tokens: 150, top_p: 0.5, temperature: 0.3 };

  let Body = '';

  if (prompts) {
    Body = JSON.stringify(prompts);
  }

  if (query) {
    Body = JSON.stringify({
      query,
      parameters: parameters ?? defaultParameters,
    });
  }

  const sagemakerClient = new SageMakerRuntimeClient();

  const response = await sagemakerClient.send(
    new InvokeEndpointCommand({
      EndpointName: process.env.MODEL_ENDPOINT_NAME,
      ContentType: 'application/json',
      Accept: 'application/json',
      Body,
      CustomAttributes: 'accept_eula=true',
    }),
  );

  const message = JSON.parse(new TextDecoder('utf-8').decode(response.Body))[0].generation.content;

  return message;
};
