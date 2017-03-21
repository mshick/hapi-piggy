const isObject = require('lodash/isObject');
const isArray = require('lodash/isArray');

const get = function ({client, table, key}) {
  let keyName = 'key';
  let keyVal = key;

  if (isArray(key)) {
    keyName = key[0];
    keyVal = key[1];
  } else if (isObject(key)) {
    keyName = Object.keys(key)[0];
    keyVal = key[keyName];
  }

  if (!keyVal) {
    return Promise.reject(new Error('no key provided'));
  }

  return client.query({
    text: `SELECT * FROM ${table} WHERE ${keyName} = $1 LIMIT 1;`,
    values: [keyVal]
  })
  .then(results => {
    const {key, value} = results.rows[0] ? results.rows[0] : {};
    return {
      client,
      results,
      key,
      value
    };
  });
};

module.exports = get;
