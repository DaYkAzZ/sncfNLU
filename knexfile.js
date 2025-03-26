const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database', 'sncf.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'database', 'migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'database', 'seeds'),
    },
  },
};