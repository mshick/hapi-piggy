const del = function ({client, table, key}) {
  return client.query({
    text: `DELETE FROM ${table} WHERE key = $1;`,
    values: [key]
  })
  .then(results => {
    return {
      client,
      results,
      key
    };
  });
};

module.exports = del;
