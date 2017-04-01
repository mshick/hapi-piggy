const createTable = function ({client, table, columns}) {
  const text = `
    CREATE TABLE IF NOT EXISTS ${table} (${columns});
  `;

  return client.query({text})
  .then(results => {
    return {
      client,
      results
    };
  });
};

module.exports = createTable;
