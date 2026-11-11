// servidorbanco.js
var http = require('http');
var fs = require('fs');
var path = require('path');
var db = require('./db');

var PORTA = 3000;

function responder(res, codigo, dados) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: true, dados: dados }));
}

function recusar(res, codigo, motivo) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, erro: motivo }));
}

function lerDados(pedido, quandoChegar) {
  var texto = '';
  pedido.on('data', function (pedaco) { texto += pedaco; });
  pedido.on('end', function () {
    try { quandoChegar(JSON.parse(texto)); }
    catch (e) { quandoChegar({}); }
  });
}

var TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function servirArquivo(res, caminhoRelativo) {
  if (caminhoRelativo === '/') caminhoRelativo = '/html/login.html';
  caminhoRelativo = caminhoRelativo.replace(/^\/+/, '');
  var extensao = path.extname(caminhoRelativo);
  if (!extensao) caminhoRelativo = 'html/' + caminhoRelativo + '.html';
  var caminho = path.join(__dirname, 'public', caminhoRelativo);
  if (!fs.existsSync(caminho) && extensao === '.html' && !caminhoRelativo.startsWith('html/')) {
    var alt = path.join(__dirname, 'public', 'html', path.basename(caminhoRelativo));
    if (fs.existsSync(alt)) caminho = alt;
  }
  if (!fs.existsSync(caminho)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Arquivo nao encontrado: ' + caminhoRelativo);
  }
  var tipo = TIPOS[path.extname(caminho)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': tipo });
  res.end(fs.readFileSync(caminho));
}

// ===================================================================
// HELPER: Salva (INSERT ou UPDATE) um endereço e retorna endereco_id
// ===================================================================
function salvarEndereco(endereco, enderecoIdExistente, callback) {
  var campos = [
    endereco.cep || null,
    endereco.logradouro || null,
    endereco.numero || null,
    endereco.complemento || null,
    endereco.bairro || null,
    endereco.cidade || null,
    endereco.uf || null
  ];
  // Se não há nenhum dado de endereço, retorna null
  var temDados = campos.some(function (v) { return v !== null && v !== ''; });
  if (!temDados) return callback(null, null);

  if (enderecoIdExistente) {
    var sqlU = 'UPDATE endereco SET cep=?, logradouro=?, numero=?, complemento=?, bairro=?, cidade=?, uf=? WHERE id=?';
    db.run(sqlU, campos.concat([enderecoIdExistente]), function (erro) {
      if (erro) return callback(erro);
      callback(null, enderecoIdExistente);
    });
  } else {
    var sqlI = 'INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.run(sqlI, campos, function (erro) {
      if (erro) return callback(erro);
      callback(null, this.lastID);
    });
  }
}

// ===================================================================
// HELPER: Lê cliente/fornecedor com JOIN no endereço
// ===================================================================
function buscarComEndereco(tabela, id, callback) {
  var sql =
    'SELECT t.*, ' +
    'e.cep AS end_cep, e.logradouro AS end_logradouro, e.numero AS end_numero, ' +
    'e.complemento AS end_complemento, e.bairro AS end_bairro, ' +
    'e.cidade AS end_cidade, e.uf AS end_uf ' +
    'FROM ' + tabela + ' t LEFT JOIN endereco e ON e.id = t.endereco_id WHERE t.id = ?';
  db.get(sql, [id], function (erro, linha) {
    if (erro) return callback(erro);
    if (!linha) return callback(null, null);
    // Achata os campos de endereço
    linha.cep = linha.end_cep;
    linha.logradouro = linha.end_logradouro;
    linha.numero = linha.end_numero;
    linha.complemento = linha.end_complemento;
    linha.bairro = linha.end_bairro;
    linha.cidade = linha.end_cidade;
    linha.uf = linha.end_uf;
    delete linha.end_cep; delete linha.end_logradouro; delete linha.end_numero;
    delete linha.end_complemento; delete linha.end_bairro;
    delete linha.end_cidade; delete linha.end_uf;
    callback(null, linha);
  });
}

var servidor = http.createServer(function (pedido, resposta) {
  var url = pedido.url.split('?')[0];
  var partes = url.split('/');
  var ehApi = (partes[1] === 'api');
  var recurso = partes[2];
  var id = partes[3];
  var metodo = pedido.method;

  // UPLOAD
  if (ehApi && recurso === 'upload' && metodo === 'POST') {
    lerDados(pedido, function (d) {
      if (!d.imagem || !d.nome) return recusar(resposta, 400, 'Dados incompletos.');
      try {
        var base64Data = d.imagem.replace(/^data:image\/\w+;base64,/, "");
        var buffer = Buffer.from(base64Data, 'base64');
        var nomeArquivo = Date.now() + '-' + d.nome.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        var pastaUpload = path.join(__dirname, 'public', 'img', 'produtos');
        if (!fs.existsSync(pastaUpload)) fs.mkdirSync(pastaUpload, { recursive: true });
        fs.writeFileSync(path.join(pastaUpload, nomeArquivo), buffer);
        responder(resposta, 200, { url: 'img/produtos/' + nomeArquivo });
      } catch (e) { recusar(resposta, 500, 'Erro ao salvar imagem.'); }
    });
    return;
  }

  // CATEGORIAS
  if (ehApi && recurso === 'categorias') {
    if (metodo === 'GET') {
      return db.all('SELECT * FROM categoria ORDER BY nome ASC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        db.run('INSERT INTO categoria (nome) VALUES (?)', [d.nome], function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
  }

  // ================= CLIENTES =================
  if (ehApi && recurso === 'clientes') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM cliente ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return buscarComEndereco('cliente', id, function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Cliente não encontrado.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        salvarEndereco(d, null, function (erroEnd, endId) {
          if (erroEnd) return recusar(resposta, 400, erroEnd.message);
          var sql = 'INSERT INTO cliente (nome, cpf, data_nasc, email, telefone, whatsapp, endereco_id, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, endId, new Date().toISOString()];
          db.run(sql, val, function (erro) {
            if (erro) return recusar(resposta, 400, erro.message);
            responder(resposta, 201, { id: this.lastID, endereco_id: endId });
          });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      // Busca endereco_id atual
      db.get('SELECT endereco_id FROM cliente WHERE id = ?', [id], function (err, row) {
        if (err) return recusar(resposta, 500, err.message);
        if (!row) return recusar(resposta, 404, 'Cliente não encontrado.');
        var endIdAtual = row.endereco_id;
        lerDados(pedido, function (d) {
          salvarEndereco(d, endIdAtual, function (erroEnd, endId) {
            if (erroEnd) return recusar(resposta, 400, erroEnd.message);
            var sql = 'UPDATE cliente SET nome=?, cpf=?, data_nasc=?, email=?, telefone=?, whatsapp=?, endereco_id=? WHERE id=?';
            var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, endId, id];
            db.run(sql, val, function (erro) {
              if (erro) return recusar(resposta, 400, erro.message);
              if (this.changes === 0) return recusar(resposta, 404, 'Cliente não encontrado.');
              responder(resposta, 200, { id: Number(id), endereco_id: endId });
            });
          });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM cliente WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        if (this.changes === 0) return recusar(resposta, 404, 'Cliente não encontrado.');
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  // ================= FORNECEDORES =================
  if (ehApi && recurso === 'fornecedores') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM fornecedor ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return buscarComEndereco('fornecedor', id, function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Fornecedor não encontrado.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.razao_social) return recusar(resposta, 400, 'Razão Social é obrigatória.');
        salvarEndereco(d, null, function (erroEnd, endId) {
          if (erroEnd) return recusar(resposta, 400, erroEnd.message);
          var sql = 'INSERT INTO fornecedor (razao_social, nome_fantasia, cnpj, inscricao_est, email, telefone, endereco_id, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          var val = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, endId, new Date().toISOString()];
          db.run(sql, val, function (erro) {
            if (erro) return recusar(resposta, 400, erro.message);
            responder(resposta, 201, { id: this.lastID, endereco_id: endId });
          });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      db.get('SELECT endereco_id FROM fornecedor WHERE id = ?', [id], function (err, row) {
        if (err) return recusar(resposta, 500, err.message);
        if (!row) return recusar(resposta, 404, 'Fornecedor não encontrado.');
        var endIdAtual = row.endereco_id;
        lerDados(pedido, function (d) {
          salvarEndereco(d, endIdAtual, function (erroEnd, endId) {
            if (erroEnd) return recusar(resposta, 400, erroEnd.message);
            var sql = 'UPDATE fornecedor SET razao_social=?, nome_fantasia=?, cnpj=?, inscricao_est=?, email=?, telefone=?, endereco_id=? WHERE id=?';
            var val = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, endId, id];
            db.run(sql, val, function (erro) {
              if (erro) return recusar(resposta, 400, erro.message);
              if (this.changes === 0) return recusar(resposta, 404, 'Fornecedor não encontrado.');
              responder(resposta, 200, { id: Number(id), endereco_id: endId });
            });
          });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM fornecedor WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        if (this.changes === 0) return recusar(resposta, 404, 'Fornecedor não encontrado.');
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  // ================= PRODUTOS =================
  if (ehApi && recurso === 'produtos') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM produto ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return db.get('SELECT * FROM produto WHERE id = ?', [id], function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Produto não encontrado.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        var sql = 'INSERT INTO produto (codigo, nome, categoria, fornecedor, descricao, preco, estoque, unidade, validade, imagem, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.codigo || null, d.nome, d.categoria || null, d.fornecedor || null, d.descricao || null, Number(d.preco) || 0, Number(d.estoque) || 0, d.unidade || null, d.validade || null, d.imagem || null, new Date().toISOString()];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        var sql = 'UPDATE produto SET codigo=?, nome=?, categoria=?, fornecedor=?, descricao=?, preco=?, estoque=?, unidade=?, validade=?, imagem=? WHERE id=?';
        var val = [d.codigo || null, d.nome, d.categoria || null, d.fornecedor || null, d.descricao || null, Number(d.preco) || 0, Number(d.estoque) || 0, d.unidade || null, d.validade || null, d.imagem || null, id];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          if (this.changes === 0) return recusar(resposta, 404, 'Produto não encontrado.');
          responder(resposta, 200, { id: Number(id) });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM produto WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        if (this.changes === 0) return recusar(resposta, 404, 'Produto não encontrado.');
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  if (metodo === 'GET' && !ehApi) return servirArquivo(resposta, url);
  recusar(resposta, 404, 'Rota não encontrada.');
});

servidor.listen(PORTA, function () {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});