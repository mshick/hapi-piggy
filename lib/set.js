const buildStoreSetQuery = require('./build-store-set-query');

const set = function ({client, table, key, val}) {
  const q = buildStoreSetQuery({
    key,
    value: val,
    table
  });

  return client.query(q)
    .then(results => {
      return {
        client,
        results,
        key,
        val
      };
    });
};

module.exports = set;
