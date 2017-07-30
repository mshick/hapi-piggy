const pkg = require('./package.json');
const Ajv = require('ajv');
const defaultsDeep = require('lodash/defaultsDeep');
const {
  constants,
  state,
  createPool,
  createClient,
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

  /* Expose constants */

  server.expose('constants', constants);

  /* Manage connections */

  server.method(`${SHORT_NAME}.createPool`, args => (
    createPool(args, {options})
  ));

  server.method(`${SHORT_NAME}.createClient`, args => (
    createClient(args, {options})
  ));

  server.method(`${SHORT_NAME}.createConnection`, args => (
    createConnection(args, {options})
  ));

  server.method(`${SHORT_NAME}.closeConnection`, args => (
    closeConnection(args, {options})
  ));

  /* Helpers */

  server.method(`${SHORT_NAME}.tableExists`, args => (
    tableExists(args, {options})
  ));
  server.method(`${SHORT_NAME}.getTableColumns`, args => (
    getTableColumns(args, {options})
  ));

  /* KeyVal Helpers */

  server.method(`${SHORT_NAME}.createStore`, args => (
    createStore(args, {options})
  ));
  server.method(`${SHORT_NAME}.get`, args => (
    get(args, {options})
  ));
  server.method(`${SHORT_NAME}.mget`, args => (
    mget(args, {options})
  ));
  server.method(`${SHORT_NAME}.set`, args => (
    set(args, {options})
  ));
  server.method(`${SHORT_NAME}.upsert`, args => (
    upsert(args, {options})
  ));
  server.method(`${SHORT_NAME}.del`, args => (
    del(args, {options})
  ));

  /* Requires a long-lived connection */

  server.method(`${SHORT_NAME}.watchTable`, args => (
    watchTable(args, {options})
  ));
  server.method(`${SHORT_NAME}.listen`, args => (
    listen(args, {options})
  ));

  server.log(['hapi-piggy', 'registered'], 'hapi-piggy registered');

  next();
};

exports.register.attributes = {pkg};
