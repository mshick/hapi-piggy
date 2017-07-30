const pkg = require('./package.json');
const Ajv = require('ajv');
const defaultsDeep = require('lodash/defaultsDeep');
const {
  state,
  createConnection,
  closeConnection,
  tableExists,
  getTableColumns,
  watchTable,
  createStore,
  set,
  del,
  get,
  mget,
  upsert,
  listen
} = require('libpiggy');

const ajv = new Ajv();

const SHORT_NAME = pkg.name.replace('hapi-', '');

const optionsSchema = {
  title: 'hapi-piggy options',
  type: 'object',
  additionalProperties: true,
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
          type: 'object',
          properties: {
            requestCert: {
              type: 'boolean'
            },
            rejectUnauthorized: {
              type: 'boolean'
            }
          }
        },
        max: {
          type: ['integer', 'null']
        },
        min: {
          type: ['integer', 'null']
        },
        idleTimeoutMillis: {
          type: ['integer', 'null']
        }
      }
    }
  },
  required: ['url']
};

const validate = ajv.compile(optionsSchema);

const defaultOptions = {
  connectionName: 'default',
  connection: {
    max: 10,
    min: 4,
    idleTimeoutMillis: 30000
  }
};

exports.register = (server, userOptions, next) => {
  const options = defaultsDeep({}, userOptions, defaultOptions);

  const isValid = validate(options);

  if (!isValid) {
    return next(validate.errors);
  }

  server.app[pkg.name] = state;

  const closeAll = () => {
    if (state.openClients.length) {
      state.openClients.forEach(c => c.close());
    }

    return closeConnection().then(() => {
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

  /* KeyVal Helpers */

  server.method(`${SHORT_NAME}.createStore`, createStore, {callback: false});
  server.method(`${SHORT_NAME}.get`, get, {callback: false});
  server.method(`${SHORT_NAME}.mget`, mget, {callback: false});
  server.method(`${SHORT_NAME}.set`, set, {callback: false});
  server.method(`${SHORT_NAME}.upsert`, upsert, {callback: false});
  server.method(`${SHORT_NAME}.del`, del, {callback: false});

  /* Requires a long-lived connection */

  server.method(`${SHORT_NAME}.watchTable`, watchTable, {callback: false});
  server.method(`${SHORT_NAME}.listen`, listen, {callback: false});

  server.log(['hapi-piggy', 'registered'], 'hapi-piggy registered');

  next();
};

exports.register.attributes = {pkg};
