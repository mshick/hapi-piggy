const tableExists = function ({client, table}) {
  return client.query({
    text: `SELECT to_regclass('${table}');`
  })
  .then(results => {
    return {
      client,
      results,
      payload: results.rows[0].to_regclass
    };
  });
};

module.exports = tableExists;
