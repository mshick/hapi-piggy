const isObject = require('lodash/isObject');
const isNumber = require('lodash/isNumber');

const get = function ({client, table, key}) {
  let text;

  if (isObject(key)) {
    const keys = Object.keys(key);
    const wheres = keys.map(k => {
      const v = key[k];
      if (isNumber(v)) {
        return `(val ->> '${k}')::int = '${v}'`;
      }
      return `val ->> '${k}' = '${v}'`;
    });
    text = `SELECT * FROM ${table} WHERE ${wheres.join(' AND ')};`;
  } else {
    text = `SELECT * FROM ${table} WHERE key = '${key}';`;
  }

  return client
    .query({text})
    .then(results => {
      const {key, val} = results.rows[0] ? results.rows[0] : {};
      return {
        client,
        results,
        key,
        val
      };
    });
};

module.exports = get;
