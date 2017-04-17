const pkg = require('./package.json');
const Ajv = require('ajv');
const {applyToDefaults} = require('hoek');
const {
  createConnection,
  closeConnection,
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
  openPools: {},
  openClients: []
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
    if (state.openClients.length) {
      state.openClients.forEach(c => c.close());
    }

    return closeConnection(null, {state}).then(() => {
      resetState();
      server.log([pkg.name], 'connection pools closed');
    });
  };

  server.ext('onPreStop', (server, next) => {
    closeAll().then(() => next()).catch(next);
  });

  /* Manage connections */

  server.method(`${SHORT_NAME}.createConnection`, args => {
    return createConnection(args, {options, state});
  }, {callback: false});

  server.method(`${SHORT_NAME}.closeConnection`, args => {
    return closeConnection(args, {options, state});
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
    return watchTable(args, {options, state});
  });

  server.log(['hapi-piggy', 'registered'], 'hapi-piggy registered');

  next();
};

exports.register.attributes = {pkg};
