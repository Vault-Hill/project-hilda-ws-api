const Redis = require('redis');

module.exports.createRedisClient = async () => {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;

  console.log('Redis host', host);
  console.log('Redis port', port);

  const client = Redis.createClient({
    url: `redis://${host}:${port}`,
    pingInterval: 1000,
  });

  await client.connect();

  client.on('error', (err) => console.log('Redis Client Error', err));
  client.on('connect', () => console.log('Redis Client Connected'));
  client.on('ready', () => console.log('Redis Client Ready'));
  client.on('reconnecting', () => console.log('Redis Client Reconnecting'));
  client.on('end', () => console.log('Redis Client End'));
  client.on('warning', (warning) => console.log('Redis Client Warning', warning));

  return client;
};
