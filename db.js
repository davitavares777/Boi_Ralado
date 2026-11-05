// ===========================================================================
//   banco.js   -   AS TABELAS DO BOI RALADO
// ===========================================================================

var sqlite3 = require('sqlite3');
var path    = require('path');

var banco = new sqlite3.Database(path.join(__dirname, 'banco.db'));

banco.serialize(function () {

  banco.run('PRAGMA foreign_keys = ON');

  // --- CLIENTE ---
  banco.run(`
    CREATE TABLE IF NOT EXISTS cliente (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      cpf           TEXT,
      data_nasc     TEXT,
      email         TEXT,
      telefone      TEXT,
      whatsapp      TEXT,
      data_cadastro TEXT
    )
  `);

  // --- FORNECEDOR ---
  banco.run(`
    CREATE TABLE IF NOT EXISTS fornecedor (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      razao_social   TEXT NOT NULL,
      nome_fantasia  TEXT,
      cnpj           TEXT,
      inscricao_est  TEXT,
      email          TEXT,
      telefone       TEXT,
      data_cadastro  TEXT
    )
  `);

  // --- PRODUTO ---
  banco.run(`
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
      data_cadastro TEXT
    )
  `);

  // --- PEDIDO ---
  banco.run(`
    CREATE TABLE IF NOT EXISTS pedido (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      numero     TEXT NOT NULL,
      mesa       TEXT,
      cliente    TEXT,
      data       TEXT,
      hora       TEXT,
      subtotal   REAL DEFAULT 0,
      total      REAL DEFAULT 0,
      status     TEXT DEFAULT 'Pago'
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS pedido_item (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id    INTEGER NOT NULL,
      produto_id   INTEGER,
      nome_item    TEXT NOT NULL,
      quantidade   INTEGER NOT NULL DEFAULT 1,
      valor_unit   REAL NOT NULL DEFAULT 0,
      subtotal     REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produto(id)
    )
  `);

  // --- ENTREGA ---
  banco.run(`
    CREATE TABLE IF NOT EXISTS entrega (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      numero      TEXT NOT NULL,
      cliente     TEXT,
      endereco    TEXT,
      data        TEXT,
      hora        TEXT,
      subtotal    REAL DEFAULT 0,
      taxa        REAL DEFAULT 0,
      total       REAL DEFAULT 0,
      pagamento   TEXT,
      status      TEXT DEFAULT 'Entregue'
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS entrega_item (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      entrega_id   INTEGER NOT NULL,
      produto_id   INTEGER,
      nome_item    TEXT NOT NULL,
      quantidade   INTEGER NOT NULL DEFAULT 1,
      valor_unit   REAL NOT NULL DEFAULT 0,
      subtotal     REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (entrega_id) REFERENCES entrega(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produto(id)
    )
  `);

  // --- COMANDA ---
  banco.run(`
    CREATE TABLE IF NOT EXISTS comanda (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      numero      TEXT NOT NULL,
      mesa        TEXT,
      hora        TEXT,
      subtotal    REAL DEFAULT 0,
      total       REAL DEFAULT 0,
      status      TEXT DEFAULT 'Pago',
      data        TEXT
    )
  `);

  banco.run(`
    CREATE TABLE IF NOT EXISTS comanda_item (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      comanda_id   INTEGER NOT NULL,
      produto_id   INTEGER,
      nome_item    TEXT NOT NULL,
      quantidade   INTEGER NOT NULL DEFAULT 1,
      valor_unit   REAL NOT NULL DEFAULT 0,
      subtotal     REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (comanda_id) REFERENCES comanda(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produto(id)
    )
  `);

  // --- DADOS DE EXEMPLO ---
  banco.get('SELECT COUNT(*) AS quantos FROM produto', function (erro, linha) {
    if (erro || linha.quantos > 0) return;
    banco.serialize(function () {
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P001', 'Boi Ralado Tradicional', 'Pratos', 34.90, 50, 'Un')");
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P002', 'Hamburguer Boi Ralado', 'Lanches', 32.00, 40, 'Un')");
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P003', 'Pastel de Boi Ralado', 'Lanches', 14.00, 80, 'Un')");
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P004', 'Picanha na Chapa', 'Pratos', 68.90, 25, 'Un')");
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P005', 'Batata Rustica', 'Acompanhamentos', 24.90, 90, 'Un')");
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P006', 'Suco de Laranja', 'Bebidas', 9.00, 100, 'Un')");
      banco.run("INSERT INTO produto (codigo, nome, categoria, preco, estoque, unidade) VALUES ('P007', 'Mousse de Maracuja', 'Sobremesas', 12.00, 45, 'Un')");
      console.log('  Produtos de exemplo criados.');
    });
  });

});

module.exports = banco;