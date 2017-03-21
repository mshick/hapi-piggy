const assert = require('assert');
const applyToDefaults = require('hoek').applyToDefaults;
const pkg = require('./package.json');
const createConnection = require('./lib/create-connection');
const tableExists = require('./lib/table-exists');
const createNotifyTrigger = require('./lib/create-notify-trigger');
const createTable = require('./lib/create-table');
const createWatchedTable = require('./lib/create-watched-table');
const watchTable = require('./lib/watch-table');
const set = require('./lib/set');
const del = require('./lib/del');
const get = require('./lib/get');
const upsert = require('./lib/upsert');

const SHORT_NAME = pkg.name.replace('hapi-', '');

const defaultOptions = {
  connectionName: 'default',
  url: 'postgresql://localhost',
  connection: {
    ssl: true,
    max: 10,
    min: 4,
    idleTimeoutMillis: 30000
  }
};

const initialState = {
  _openPools: {},
  _openClients: []
};

exports.register = (plugin, userOptions, next) => {
  const options = applyToDefaults(defaultOptions, userOptions || {});

  let state;

  const resetState = () => {
    plugin.app[pkg.name] = applyToDefaults(initialState, {});
    state = plugin.app[pkg.name];
  };

  resetState();

  const closeAll = () => {
    let closingClients = [];
    let closingPools = [];

    if (state._openClients.length) {
      closingClients = state._openClients.map(client => client.release());
    } else {
      closingClients.push(Promise.resolve());
    }

    return Promise.all(closingClients)
      .then(() => {
        closingClients = null;
        closingPools = Object.keys(state._openPools)
          .map(poolName => state._openPools[poolName].end());
        return Promise.all(closingPools);
      })
      .then(() => {
        closingPools = null;
        resetState();
        plugin.log([pkg.name], 'connection pools closed');
      });
  };

  plugin.ext('onPreStop', (server, next) => {
    closeAll().then(() => next()).catch(next);
  });

  const pluginArgs = {options, state};

  /* Create a connection */

  plugin.method(`${SHORT_NAME}.createConnection`, args => {
    return createConnection(args, pluginArgs);
  }, {callback: false});

  /* Query helpers */

  plugin.method(`${SHORT_NAME}.tableExists`, tableExists, {callback: false});
  plugin.method(`${SHORT_NAME}.createNotifyTrigger`, createNotifyTrigger, {callback: false});
  plugin.method(`${SHORT_NAME}.createTable`, createTable, {callback: false});
  plugin.method(`${SHORT_NAME}.createWatchedTrigger`, createWatchedTable, {callback: false});

  /* KeyVal Helpers */

  plugin.method(`${SHORT_NAME}.createStore`, ({client, table, indexes}) => {
    let columns = 'key text primary key, value jsonb';
    if (indexes && indexes.length) {
      indexes.forEach(key => {
        if (key === 'key' || key === 'value') {
          assert.fail(false, `'key' and 'value' are not valid indexes`);
        }
        columns += `, ${key} text NOT NULL`;
      });
    }
    return createTable({client, table, columns, indexes});
  });
  plugin.method(`${SHORT_NAME}.get`, get, {callback: false});
  plugin.method(`${SHORT_NAME}.set`, set, {callback: false});
  plugin.method(`${SHORT_NAME}.upsert`, upsert, {callback: false});
  plugin.method(`${SHORT_NAME}.del`, del, {callback: false});

  /* Requires a long-lived connection */

  plugin.method(`${SHORT_NAME}.watchTable`, args => {
    return watchTable(args, pluginArgs);
  });

  next();
};

exports.register.attributes = {pkg};
