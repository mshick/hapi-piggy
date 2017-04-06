const shortid = require('shortid');
const applyToDefaults = require('hoek').applyToDefaults;
const get = require('./get');

const upsert = function ({
  client,
  table,
  key,
  val: newValue,
  options,
  generateKeyFn
}) {
  const {merge} = options || {};

  generateKeyFn = generateKeyFn || shortid.generate;

  const got = key ? get({client, table, key}) : Promise.resolve({});

  let val;

  return got.then(({key: existingKey, val: existingValue}) => {
    key = existingKey || key;

    if (!key || typeof key !== 'string') {
      key = generateKeyFn();
    }

    let text;

    if (existingKey) {
      text = `UPDATE ${table} SET (val) = ($1) WHERE key = '${key}';`;
    } else {
      text = `INSERT INTO ${table} (key, val) VALUES ('${key}', $1);`;
    }

    if (merge && existingValue) {
      val = applyToDefaults(existingValue, newValue, true);
    } else {
      val = newValue;
    }

    const values = [val];

    return client.query({text, values});
  })
  .then(results => {
    return {
      client,
      results,
      key,
      val
    };
  });
};

module.exports = upsert;
