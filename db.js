// db.js
var sqlite3 = require('sqlite3');
var path = require('path');

var caminho = path.join(__dirname, 'banco.db');
var db = new sqlite3.Database(caminho);

db.serialize(function () {
  db.run('PRAGMA foreign_keys = ON');

  // --- NOVA TABELA: CONTROLE DE CÓDIGOS DE FUNCIONÁRIO ---
  db.run(`
    CREATE TABLE IF NOT EXISTS codigos_utilizados (
      codigo TEXT PRIMARY KEY,
      data_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS endereco (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      cep         TEXT,
      logradouro  TEXT NOT NULL,
      numero      TEXT,
      complemento TEXT,
      bairro      TEXT,
      cidade      TEXT NOT NULL,
      uf          TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cliente (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      cpf           TEXT UNIQUE,
      data_nasc     TEXT,
      email         TEXT UNIQUE,
      telefone      TEXT,
      whatsapp      TEXT,
      endereco_id   INTEGER,
      data_cadastro TEXT,
      foto          TEXT,
      senha         TEXT,
      FOREIGN KEY (endereco_id) REFERENCES endereco(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS funcionario (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      funcao        TEXT NOT NULL,
      senha         TEXT NOT NULL,
      ativo         INTEGER DEFAULT 1,
      data_cadastro TEXT,
      criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ... (Mantenha as outras tabelas: fornecedor, categoria, produto, etc., iguais às suas originais)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS fornecedor (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      razao_social   TEXT NOT NULL,
      nome_fantasia  TEXT,
      cnpj           TEXT,
      inscricao_est  TEXT,
      email          TEXT,
      telefone       TEXT,
      endereco_id    INTEGER,
      data_cadastro  TEXT,
      FOREIGN KEY (endereco_id) REFERENCES endereco(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categoria (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    )
  `);

  db.get('SELECT COUNT(*) as count FROM categoria', [], function(err, row) {
      if (row && row.count === 0) {
          var cats = ['Lanches', 'Pratos Executivos', 'Marmitas', 'Bebidas', 'Sobremesas', 'Acompanhamentos', 'Insumos'];
          cats.forEach(function(c) {
              db.run('INSERT INTO categoria (nome) VALUES (?)', [c]);
          });
      }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS produto (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo        TEXT,
      nome          TEXT NOT NULL,
      categoria     TEXT,
      fornecedor    TEXT,
      descricao     TEXT,
      preco         REAL NOT NULL DEFAULT 0,
      estoque       INTEGER DEFAULT 0,
      unidade       TEXT,
      validade      TEXT,
      imagem        TEXT,
      data_cadastro TEXT
    )
  `);

  // ... (Mantenha as tabelas pedido, pedido_item, entrega, entrega_item, etc.)

  db.run(`
    CREATE TABLE IF NOT EXISTS pedido (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      numero     TEXT NOT NULL,
      mesa       TEXT,
      cliente_id INTEGER,
      data       TEXT,
      hora       TEXT,
      subtotal   REAL DEFAULT 0,
      taxa       REAL DEFAULT 0,
      total      REAL DEFAULT 0,
      status     TEXT DEFAULT 'Pago',
      FOREIGN KEY (cliente_id) REFERENCES cliente(id)
    )
  `);
});

module.exports = db;