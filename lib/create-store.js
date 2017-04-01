const createTable = require('./create-table');
const createWatchedTable = require('./create-watched-table');
const tableExists = require('./table-exists');
const createStoreIndexes = require('./create-store-indexes');

const createStore = function ({client, table, indexes, watch}) {
  return new Promise((resolve, reject) => {
    tableExists({client, table})
      .then(({exists}) => {
        if (!exists) {
          const columns = 'key text primary key, val jsonb';
          if (watch) {
            return createWatchedTable({client, table, columns, key: 'key'});
          }
          return createTable({client, table, columns});
        }
      })
      .then(() => {
        if (indexes && indexes.length) {
          return createStoreIndexes({client, table, indexes});
        }
      })
      .then(() => {
        resolve({client});
      })
      .catch(error => {
        reject(error);
      });
  });
};

module.exports = createStore;
