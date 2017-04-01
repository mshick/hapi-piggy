const getTableColumns = function ({client, table}) {
  return client.query({
    text: `
      SELECT *
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = '${table}'
    `
  })
  .then(results => {
    return {
      client,
      columns: results.rows
    };
  });
};

module.exports = getTableColumns;
