const assert = require('assert');
const isArray = require('lodash/isArray');

const createIndexes = function ({client, table, indexes}) {
  let text = '';

  if (indexes && indexes.length) {
    indexes.forEach(index => {
      if (index === 'key' || index === 'val') {
        assert.fail(false, `'key' and 'val' are not valid indexes`);
      }

      let jsonPath;

      if (isArray(index) && index[1] === 'int') {
        jsonPath = `(((val ->> '${index[0]}')::integer))`;
      } else {
        jsonPath = `((val ->> '${index}'))`;
      }

      text += `
        CREATE INDEX IF NOT EXISTS "${table}_${index}_index" ON ${table} ${jsonPath};
      `;
    });
  }

  if (!text) {
    return Promise.resolve({client});
  }

  return client.query({text})
    .then(results => {
      return {
        client,
        results
      };
    });
};

module.exports = createIndexes;
