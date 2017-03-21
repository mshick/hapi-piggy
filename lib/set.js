const buildQuery = require('./build-query');

const set = function ({client, table, key, value, index}) {
  const q = buildQuery({
    key,
    value,
    index,
    table
  });

  return client.query(q).then(results => {
    return {
      client,
      results,
      key,
      value
    };
  });
};

module.exports = set;
