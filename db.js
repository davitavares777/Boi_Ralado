// db.js
var sqlite3 = require('sqlite3');
var path = require('path');

var caminho = path.join(__dirname, 'banco.db');
var db = new sqlite3.Database(caminho);

db.serialize(function () {
  db.run('PRAGMA foreign_keys = ON');

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
      cpf           TEXT,
      data_nasc     TEXT,
      email         TEXT,
      telefone      TEXT,
      whatsapp      TEXT,
      endereco_id   INTEGER,
      data_cadastro TEXT,
      foto          TEXT,
      FOREIGN KEY (endereco_id) REFERENCES endereco(id)
    )
  `);

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

  db.run(`
    CREATE TABLE IF NOT EXISTS pedido_item (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id    INTEGER NOT NULL,
      produto_id   INTEGER,
      nome_item    TEXT NOT NULL,
      quantidade   INTEGER NOT NULL DEFAULT 1,
      valor_unit   REAL NOT NULL DEFAULT 0,
      complemento  TEXT,
      subtotal     REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE,
      FOREIGN KEY (produto_id) REFERENCES produto(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entrega (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      numero      TEXT NOT NULL,
      cliente_id  INTEGER,
      endereco_id INTEGER,
      data        TEXT,
      hora        TEXT,
      subtotal    REAL DEFAULT 0,
      taxa        REAL DEFAULT 0,
      total       REAL DEFAULT 0,
      pagamento   TEXT,
      status      TEXT DEFAULT 'Entregue',
      FOREIGN KEY (cliente_id) REFERENCES cliente(id),
      FOREIGN KEY (endereco_id) REFERENCES endereco(id)
    )
  `);

  db.run(`
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

  // ---- Índices para performance em relatórios e buscas ----
  db.run('CREATE INDEX IF NOT EXISTS idx_pedido_data      ON pedido(data)');
  db.run('CREATE INDEX IF NOT EXISTS idx_entrega_data     ON entrega(data)');
  db.run('CREATE INDEX IF NOT EXISTS idx_produto_cat      ON produto(categoria)');
  db.run('CREATE INDEX IF NOT EXISTS idx_cliente_cpf      ON cliente(cpf)');
  db.run('CREATE INDEX IF NOT EXISTS idx_fornecedor_cnpj  ON fornecedor(cnpj)');
  db.run('CREATE INDEX IF NOT EXISTS idx_pedido_item_ped  ON pedido_item(pedido_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_entrega_item_ent ON entrega_item(entrega_id)');

  // Migração: adiciona coluna 'foto' na tabela cliente se ainda não existir
  db.all("PRAGMA table_info(cliente)", [], function (err, cols) {
    if (err) return;
    var nomes = (cols || []).map(function (c) { return c.name; });
    if (nomes.indexOf('foto') === -1) {
      db.run("ALTER TABLE cliente ADD COLUMN foto TEXT", function (e) {
        if (e) console.log('[migração] erro ao adicionar coluna foto:', e.message);
        else console.log('[migração] coluna foto adicionada em cliente');
      });
    }
  });
});

module.exports = db;