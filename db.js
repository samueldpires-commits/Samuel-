const sqlite3 = require('sqlite3');
const path = require('path');

// Banco fica FORA da pasta public (nunca é servido pelo site)
const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'));

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// sqlite3 usa callbacks; aqui viram Promises (o original usava await em db.run/db.get, que não funciona)
const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

module.exports = { run, get };
