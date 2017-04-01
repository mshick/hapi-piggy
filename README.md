# hapi-piggy
A PostgreSQL plugin for HAPI, with a convenient key/val store abstraction layer.

## Config

```javascript
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
```

## Native bindings

`hapi-piggy` will use the native pg bindings if you have them installed as a peer.

## Usage

This module exposes several server methods intended to make working with PostgreSQL a little easier for certain general use cases. It provides a key/val store-like abstraction layer, with a simplistic indexing model, and JSONB payloads.

```javascript
/* Register server, config module... */
const uuid = require('uuid/v4');
const {createConnection, createStore, get, upsert} = server.methods.piggy;

createConnection()
  .then(({client}) => {
    return createStore({
      client,
      table: 'example',
      indexes: ['lastName']
    });
  })
  .then(({client}) => {
    return upsert({
      client,
      table: 'example',
      key: {lastName: 'Foo'},
      val: {firstName: 'Cool', lastName: 'Foo', car: 'Lambo'},
      options: {merge: true},
      generateKeyFn: () => uuid()
    });
  })
  .then(({client}) => {
    return get({
      client,
      table: 'example',
      key: {lastName: 'Foo'}
    });
  })
  .then(({client, key, val}) => {
    client.release();
    console.log(key, value);
    // 'uuid...', {firstName: 'Cool', lastName: 'Foo', car: 'Lambo'}
  });
```

## Watching

You can easily set up a table that pushes notifications to a worker with the `createWatchedTable` or `createStore` with the `watch` boolean `true` and `watchTable` methods.

Watching a store looks like this:

```javascript
const {
  createConnection,
  createStore,
  watchTable,
  set
} = server.methods.piggy;

const watcher = function ({parsed}) {
  // do something with parsed payload
  // {key: 'foo'}
};

createConnection()
  .then(({client}) => {
    return createStore({
      client,
      table: 'example',
      watch: true
    });
  })
  .then(({client}) => {
    return watchTable({
      client,
      table: 'example',
      watcher
    })
  })
  .then(({client}) => {
    return set({
      client,
      table: 'example',
      key: 'foo',
      val: 'bar'
    });
  });
```

## Methods

There are many, take a look at index.js.

## Testing

You'll need to provide the URL to a running PostgreSQL server, like so:

```sh
POSTGRESQL_URL=postgresql://user:pass@localhost/db npm test
```

## Requirements

* node.js >= 6.0
* PostgresQL >= 9.5

## Todo

* Legit tests
* Break `piggy` into a standalone lib
