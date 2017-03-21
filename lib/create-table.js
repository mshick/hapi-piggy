const createTable = function ({client, table, columns, indexes}) {
  let text = `CREATE TABLE IF NOT EXISTS ${table} (${columns});`;
  if (indexes && indexes.length) {
    indexes.forEach(index => {
      text += `CREATE INDEX IF NOT EXISTS ${table}_${index}_index ON ${table} (${index});`;
    });
  }

  return client.query({text})
  .then(results => {
    return {
      client,
      results
    };
  });
};

module.exports = createTable;
