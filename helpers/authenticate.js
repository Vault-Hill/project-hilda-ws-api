const jwt = require('jsonwebtoken');
const cryptoJs = require('crypto-js');

module.exports.authenticate = (accessKey) => {
  try {
    // verify accessKey with jwt
    jwt.verify(accessKey, process.env.ACCESS_KEY_SECRET);

    const encrypted = jwt.decode(accessKey);

    // decrypt accessKey with cryptoJs
    const payload = cryptoJs.AES.decrypt(
      encrypted.payload,
      process.env.ACCESS_KEY_ENCRYPT_KEY,
    ).toString(cryptoJs.enc.Utf8);

    console.log('Payload', payload);

    return JSON.parse(payload);
  } catch (error) {
    console.error('Error authenticating access key:', error);
    return {};
  }
};
