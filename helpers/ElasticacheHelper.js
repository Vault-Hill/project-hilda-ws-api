const ElasticacheHelper = {
  saveData: async (data, tableName, key) => {
    // Serialize the data
    const serializedData = JSON.stringify(data);

    // Save the data to Elasticache
    const params = {
      TableName: tableName,
      Item: {
        Key: key,
        Value: serializedData,
      },
    };

    await elasticache.putItem(params);
  },

  deleteData: async (tableName, key) => {
    // Delete the data from Elasticache
    const params = {
      TableName: tableName,
      Key: key,
    };

    await elasticache.deleteItem(params);
  }
};
