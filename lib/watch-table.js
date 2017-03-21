const qs = require('qs');

const watchTable = function ({client, table, watcher}, {state}) {
  const {_openClients} = state;

  _openClients.push(client);

  client.on('notification', ({channel, payload}) => {
    const parsed = qs.parse(payload);
    if (parsed.table === table) {
      watcher({client, channel, payload, parsed});
    }
  });
};

module.exports = watchTable;
