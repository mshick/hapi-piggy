import test from 'ava';
import hapi from 'hapi';

const { POSTGRES_USER, POSTGRES_DB } = process.env;
const PG_URL = `postgresql://${POSTGRES_USER}@localhost/${POSTGRES_DB}`;

let server;

test.beforeEach(() => {
  server = hapi.server({ port: 5000 });
});

test('reject invalid options', async t => {
  try {
    await server.register({
      plugin: require('../'),
      options: {
        url: 12345
      }
    });
  } catch (err) {
    if (err && err.message === 'Invalid configuration options.') {
      return t.pass();
    }
    t.fail();
  }
});

test('should be able to register plugin with just URL', async t => {
  try {
    await server.register({
      plugin: require('../'),
      options: {
        url: 'postgresql://localhost/db'
      }
    });
    t.pass();
  } catch (err) {
    t.fail(err);
  }
});

test('should log upon registration', async t => {
  server.events.on('log', entry => {
    t.is(entry.data, 'hapi-piggy registered');
  });

  try {
    await server.register({
      plugin: require('../'),
      options: {
        url: 'postgresql://localhost/db'
      }
    });
  } catch (err) {
    t.fail(err);
  }
});

test('should be able to find the plugin exposed methods', async t => {
  try {
    await server.register({
      plugin: require('../'),
      options: {
        url: 'postgresql://localhost/db'
      }
    });

    const methods = server.methods.piggy;

    t.truthy(methods.createConnection);
    t.truthy(methods.closeConnection);
    t.truthy(methods.createPool);
    t.truthy(methods.createClient);
    t.truthy(methods.tableExists);
    t.truthy(methods.getTableColumns);
    t.truthy(methods.watchTable);
    t.truthy(methods.createStore);
    t.truthy(methods.set);
    t.truthy(methods.del);
    t.truthy(methods.get);
    t.truthy(methods.mget);
    t.truthy(methods.upsert);
  } catch (err) {
    t.fail(err);
  }
});

if (PG_URL) {
  test('should be able to connect to the database and clean up after itself', async t => {
    try {
      await server.register({
        plugin: require('../'),
        options: {
          url: PG_URL
        }
      });

      const state = server.app['hapi-piggy'];

      const { piggy } = server.methods;

      const client = await piggy.createConnection();

      t.is(Object.keys(state.openPools).length, 1);
      t.is(state.openClients.length, 1);

      client.close();

      t.is(state.openClients.length, 0);

      await piggy.closeConnection();

      t.is(Object.keys(state.openPools).length, 0);

      t.pass();
    } catch (err) {
      return t.fail(err);
    }
  });
}
