const shortid = require('shortid');
const applyToDefaults = require('hoek').applyToDefaults;
const get = require('./get');
const buildQuery = require('./build-query');

const upsert = function ({
  client,
  table,
  key,
  value: newValue,
  index,
  options,
  generateKeyFn
}) {
  const {merge} = options || {};

  generateKeyFn = generateKeyFn || shortid.generate;

  let value;

  return get({client, table, key}).then(({key: existingKey, value: existingValue}) => {
    key = existingKey || key;

    if (!key || typeof key !== 'string') {
      key = generateKeyFn();
    }

    if (merge && existingValue) {
      value = applyToDefaults(existingValue, newValue);
    } else {
      value = newValue;
    }

    const q = buildQuery({
      key,
      value,
      index,
      table,
      isUpdate: Boolean(existingKey)
    });

    return client.query(q);
  })
  .then(results => {
    return {
      client,
      results,
      key,
      value
    };
  });
};

module.exports = upsert;
