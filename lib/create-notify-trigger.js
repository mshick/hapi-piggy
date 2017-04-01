const createNotifyTrigger = function ({client, key}) {
  return client.query({
    text: `
      CREATE OR REPLACE FUNCTION notify_trigger()
      RETURNS TRIGGER AS
      $body$
      DECLARE
      BEGIN
        PERFORM pg_notify('watchers', 'table=' || TG_TABLE_NAME || '&pkey=' || NEW.${key} );
        RETURN NEW;
      END;
      $body$
      LANGUAGE plpgsql;
    `
  })
  .then(() => client.query(`LISTEN watchers`))
  .then(results => {
    return {
      client,
      results
    };
  });
};

module.exports = createNotifyTrigger;
