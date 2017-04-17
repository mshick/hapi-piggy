const pkg = require('./package.json');
const Ajv = require('ajv');
const {applyToDefaults} = require('hoek');
const {
  createConnection,
  tableExists,
  createTable,
  createWatchedTable,
  getTableColumns,
  watchTable,
  createStore,
  set,
  del,
  get,
  mget,
  upsert
} = require('libpiggy');

const ajv = new Ajv();

const SHORT_NAME = pkg.name.replace('hapi-', '');

const optionsSchema = {
  title: 'hapi-piggy options',
  type: 'object',
  additionalProperties: false,
  properties: {
    connectionName: {
      type: 'string'
    },
    url: {
      type: 'string'
    },
    connection: {
      type: 'object',
      properties: {
        ssl: {
          type: 'boolean'
        },
        max: {
          type: 'integer'
        },
        min: {
          type: 'integer'
        },
        idleTimeoutMillis: {
          type: 'integer'
        }
      }
    }
  },
  required: ['url']
};

const defaultOptions = {
  connectionName: 'default',
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

exports.register = (server, userOptions, next) => {
  const options = applyToDefaults(defaultOptions, userOptions || {});

  const isValid = ajv.validate(optionsSchema, options);

  if (!isValid) {
    return next(ajv.errors);
  }

  let state;

  const resetState = () => {
    server.app[pkg.name] = applyToDefaults(initialState, {});
    state = server.app[pkg.name];
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
        server.log([pkg.name], 'connection pools closed');
      });
  };

  server.ext('onPreStop', (server, next) => {
    closeAll().then(() => next()).catch(next);
  });

  const pluginArgs = {options, state};

  /* Create a connection */

  server.method(`${SHORT_NAME}.createConnection`, args => {
    return createConnection(args, pluginArgs);
  }, {callback: false});

  /* Helpers */

  server.method(`${SHORT_NAME}.tableExists`, tableExists, {callback: false});
  server.method(`${SHORT_NAME}.getTableColumns`, getTableColumns, {callback: false});
  server.method(`${SHORT_NAME}.createTable`, createTable, {callback: false});
  server.method(`${SHORT_NAME}.createWatchedTable`, createWatchedTable, {callback: false});

  /* KeyVal Helpers */

  server.method(`${SHORT_NAME}.createStore`, createStore, {callback: false});
  server.method(`${SHORT_NAME}.get`, get, {callback: false});
  server.method(`${SHORT_NAME}.mget`, mget, {callback: false});
  server.method(`${SHORT_NAME}.set`, set, {callback: false});
  server.method(`${SHORT_NAME}.upsert`, upsert, {callback: false});
  server.method(`${SHORT_NAME}.del`, del, {callback: false});

  /* Requires a long-lived connection */

  server.method(`${SHORT_NAME}.watchTable`, args => {
    return watchTable(args, pluginArgs);
  });

  server.log(['hapi-piggy', 'registered'], 'hapi-piggy registered');

  next();
};

exports.register.attributes = {pkg};
