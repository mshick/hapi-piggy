const url = require('url');
const applyToDefaults = require('hoek').applyToDefaults;

let pg;

try {
  require('pg-native');
  pg = require('pg').native;
} catch (e) {
  pg = require('pg');
}

const urlToConfig = function (connectionUrl) {
  const {hostname: host, port, pathname, auth} = url.parse(connectionUrl);
  const [user, password] = auth ? auth.split(':') : [];
  const [, database] = pathname ? pathname.split('/') : [];

  return {
    user,
    password,
    host,
    port,
    database
  };
};

const createConnection = function (userOptions, plugin) {
  const {options: pluginOptions, state: pluginState} = plugin;
  const options = applyToDefaults(pluginOptions, userOptions || {});

  const {
    url: connectionUrl,
    connectionName,
    connection: connectionOptions
  } = options;

  const {_openPools} = pluginState;

  if (!_openPools[connectionName]) {
    const connectionConfig = urlToConfig(connectionUrl);
    const config = applyToDefaults(connectionConfig, connectionOptions);
    _openPools[connectionName] = new pg.Pool(config);
  }

  return _openPools[connectionName].connect()
    .then(client => {
      return {client};
    });
};

module.exports = createConnection;
