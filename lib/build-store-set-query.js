const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const isString = require('lodash/isString');
const get = require('lodash/get');

const pushIndexFactory = function ({
  value,
  keys,
  values,
  placeholders,
  modifier
}) {
  return (ki, i) => {
    const p = i + modifier;
    let k;
    let v;
    if (isString(ki)) {
      k = ki;
      v = get(value, k);
    } else if (isArray(ki)) {
      k = ki[0];
      v = ki[1];
    } else if (isObject(ki)) {
      k = Object.keys(ki)[0];
      v = ki[k];
    }
    keys.push(k);
    values.push(v);
    placeholders.push(`$${p}`);
  };
};

const buildStoreSetQuery = function ({key, value, index, table, isUpdate}) {
  const keys = ['val'];
  const placeholders = ['$1'];
  const values = [value];
  const modifier = 2;

  if (index) {
    const pushIndex = pushIndexFactory({
      value,
      keys,
      values,
      placeholders,
      modifier
    });

    if (isArray(index)) {
      index.forEach(pushIndex);
    } else if (isObject(index)) {
      Object.keys(index).forEach((ki, i) => {
        pushIndex([ki, index[ki]], i);
      });
    }
  }

  let text;

  if (isUpdate) {
    text = `UPDATE ${table} SET (${keys.join(', ')}) = (${placeholders.join(', ')}) WHERE key = '${key}';`;
  } else {
    text = `INSERT INTO ${table} (key, ${keys.join(', ')}) VALUES ('${key}', ${placeholders.join(', ')});`;
  }

  return {text, values};
};

module.exports = buildStoreSetQuery;
