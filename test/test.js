import test from 'ava';
import createConnection from '../lib/create-connection';
import createStore from '../lib/create-store';
import upsert from '../lib/upsert';
import get from '../lib/get';

const getRandomInt = function (min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
};

const {POSTGRESQL_URL} = process.env;

const TABLE_NAME = `hapi_piggy_test`;

const DEFAULTS = {
  connectionName: 'default',
  url: POSTGRESQL_URL,
  connection: {
    ssl: true,
    max: 10,
    min: 4,
    idleTimeoutMillis: 30000
  }
};

const STATE = {
  _openPools: {},
  _openClients: []
};

const FIXTURES = [
  {firstName: 'Cool', lastName: 'Foo', car: 'Prius', age: 16},
  {firstName: 'Little', lastName: 'Guy', car: 'Rari', age: 21},
  {firstName: 'BIG', lastName: 'Guy', car: 'Lambo', age: 22}
];

test(async t => {
  const connection = await createConnection(null, {state: STATE, options: DEFAULTS});

  const {client} = connection;

  await createStore({
    client,
    table: TABLE_NAME,
    indexes: ['lastName', 'car', ['age', 'int']]
  });

  await upsert({
    client,
    table: TABLE_NAME,
    val: FIXTURES[0],
    options: {merge: true},
    generateKeyFn: () => getRandomInt(1000, 1000000)
  });

  await upsert({
    client,
    table: TABLE_NAME,
    val: FIXTURES[1],
    options: {merge: true},
    generateKeyFn: () => getRandomInt(1000, 1000000)
  });

  await upsert({
    client,
    table: TABLE_NAME,
    val: FIXTURES[2],
    options: {merge: true},
    generateKeyFn: () => getRandomInt(1000, 1000000)
  });

  await upsert({
    client,
    table: TABLE_NAME,
    key: {lastName: FIXTURES[0].lastName},
    val: {car: 'Lambo'},
    options: {merge: true},
    generateKeyFn: () => getRandomInt(1000, 1000000)
  });

  const got = await get({
    client,
    table: TABLE_NAME,
    key: {car: 'Lambo', age: 22}
  });

  t.deepEqual(got.val, FIXTURES[2]);
});
