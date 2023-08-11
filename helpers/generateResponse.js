'use strict';

const axios = require('axios');

module.exports.generateResponse = async (combinedPrompt) => {
  try {
    // Make API request to the model API
    // const response = await axios({
    //   method: 'post',
    //   url: process.env.MODEL_API_URL,
    //   headers: {
    //     Authorization: `Bearer ${process.env.MODEL_API_KEY}`,
    //   },
    //   data: {
    //     combinedPrompt,
    //   },
    // });

    // Extract the generated text from the API response
    // const generatedMessage = { message: response.data[0].generated_text };

    return { message: combinedPrompt[0] }; // TODO: Replace with generatedMessage
  } catch (error) {
    console.error('Error generating message:', error);
    throw error; // Rethrow the error to be handled by the caller
  }
};
