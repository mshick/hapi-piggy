const createNotifyTrigger = require('./create-notify-trigger');

const createWatchedTable = function ({client, table, columns}) {
  return createNotifyTrigger({client})
    .then(() => {
      return client.query(`
        CREATE TABLE IF NOT EXISTS ${table} (${columns});
        CREATE TRIGGER watched_table_trigger__${table}
        AFTER INSERT OR UPDATE ON ${table}
        FOR EACH ROW EXECUTE PROCEDURE notify_trigger();
      `);
    })
    .then(results => {
      return {
        client,
        results
      };
    });
};

module.exports = createWatchedTable;
