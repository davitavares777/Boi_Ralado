// db.js
// Abre (ou cria) o arquivo banco.db e garante que as tabelas existam.

var sqlite3 = require('sqlite3');
var path = require('path');

var caminho = path.join(__dirname, 'banco.db');
var db = new sqlite3.Database(caminho);

db.serialize(function () {

  // Faz o SQLite validar as chaves estrangeiras.
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS endereco (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL,
      senha  TEXT NOT NULL
      
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cliente (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nome        TEXT NOT NULL,
      email       TEXT,
      telefone    TEXT,
      endereco_id INTEGER,
      FOREIGN KEY (endereco_id) REFERENCES endereco(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS horario_atendimento (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id  INTEGER NOT NULL,
      dia_semana  INTEGER NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fim    TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES cliente(id)
    )
  `);
});

module.exports = db;
