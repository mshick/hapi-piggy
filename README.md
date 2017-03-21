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
      value: {firstName: 'Cool', lastName: 'Foo', car: 'Lambo'},
      index: ['lastName'],
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
  .then(({client, key, value}) => {
    client.release();
    console.log(key, value);
    // 'uuid...', {firstName: 'Cool', lastName: 'Foo', car: 'Lambo'}
  });
```
