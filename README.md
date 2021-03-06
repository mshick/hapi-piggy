# hapi-piggy [![Build Status](https://travis-ci.org/mshick/hapi-piggy.svg?branch=master)](https://travis-ci.org/mshick/hapi-piggy) [![npm version](https://badge.fury.io/js/hapi-piggy.svg)](https://badge.fury.io/js/hapi-piggy)

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
const { createConnection, createStore, get, upsert } = server.methods.piggy;

createConnection()
  .then(client => {
    return createStore({
      client,
      table: 'example',
      indexes: ['lastName']
    });
  })
  .then(({ client }) => {
    return upsert({
      client,
      table: 'example',
      key: { lastName: 'Foo' },
      val: { firstName: 'Cool', lastName: 'Foo', car: 'Lambo' },
      options: { merge: true },
      generateKeyFn: () => uuid()
    });
  })
  .then(({ client }) => {
    return get({
      client,
      table: 'example',
      key: { lastName: 'Foo' }
    });
  })
  .then(({ client, key, val }) => {
    client.close();
    console.log(key, value);
    // 'uuid...', {firstName: 'Cool', lastName: 'Foo', car: 'Lambo'}
  });
```

## Watching

You can easily set up a table that pushes notifications to a worker with the `createWatchedTable` or `createStore` with the `watch` boolean `true` and `watchTable` methods.

Watching a store looks like this:

```javascript
const { createConnection, createStore, watchTable, set } = server.methods.piggy;

const watcher = function({ parsed }) {
  // do something with parsed payload
  // {key: 'foo'}
};

createConnection()
  .then(client => {
    return createStore({
      client,
      table: 'example',
      watch: true
    });
  })
  .then(({ client }) => {
    return watchTable({
      client,
      table: 'example',
      watcher
    });
  })
  .then(({ client }) => {
    return set({
      client,
      table: 'example',
      key: 'foo',
      val: 'bar'
    });
  })
  .then(({ client }) => {
    client.close();
  });
```

## Methods

There are many, take a look at index.js.

## Requirements

* hapi >= 17.0.0
* node.js >= 8.0
* PostgresQL >= 9.4 (tested with 9.6)

## Todo

* Tests for this plugin (libpiggy will be tested alone)
