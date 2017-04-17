import test from 'ava';
import {Server} from 'hapi';

let server;

test.beforeEach(() => {
  server = new Server();
});

test.cb('reject invalid options', t => {
  server.register({
    register: require('../'),
    options: {
      urll: 'postgresql://localhost/db'
    }
  }, err => {
    if (err && err[0].message === 'should NOT have additional properties') {
      t.pass();
    } else {
      t.fail();
    }
    t.end();
  });
});

test.cb('should be able to register plugin with just URL', t => {
  server.register({
    register: require('../'),
    options: {
      url: 'postgresql://localhost/db'
    }
  }, t.end);
});

test.cb('should log upon registration', t => {
  server.once('log', entry => {
    t.is(entry.data, 'hapi-piggy registered');
    t.end();
  });

  server.register({
    register: require('../'),
    options: {
      url: 'postgresql://localhost/db'
    }
  }, err => {
    if (err) {
      t.fail();
      return t.end();
    }
  });
});

test.cb('should be able to find the plugin exposed methods', t => {
  server.register({
    register: require('../'),
    options: {
      url: 'mongodb://localhost:27017'
    }
  }, err => {
    if (err) {
      t.fail();
      return t.end();
    }

    const methods = server.methods.piggy;

    t.truthy(methods.createConnection);
    t.truthy(methods.tableExists);
    t.truthy(methods.createTable);
    t.truthy(methods.createWatchedTable);
    t.truthy(methods.getTableColumns);
    t.truthy(methods.watchTable);
    t.truthy(methods.createStore);
    t.truthy(methods.set);
    t.truthy(methods.del);
    t.truthy(methods.get);
    t.truthy(methods.mget);
    t.truthy(methods.upsert);

    t.end();
  });
});
