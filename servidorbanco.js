// servidorbanco.js
var http = require('http');
var fs = require('fs');
var path = require('path');
var db = require('./db');

var PORTA = 3000;

function responderJson(res, status, conteudo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(conteudo));
}

function lerCorpo(req) {
  return new Promise(function (resolve, reject) {
    var texto = '';
    req.on('data', function (p) { texto += p; });
    req.on('end', function () {
      try {
        resolve(texto ? JSON.parse(texto) : {});
      } catch (e) {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

var TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
};

function servirArquivo(res, caminhoRelativo) {
  var caminho = path.join(__dirname, 'public', caminhoRelativo);
  if (!fs.existsSync(caminho)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Arquivo nao encontrado: ' + caminhoRelativo);
  }
  var tipo = TIPOS[path.extname(caminho)] || 'text/plain; charset=utf-8';
  res.writeHead(200, { 'Content-Type': tipo });
  res.end(fs.readFileSync(caminho));
}

var servidor = http.createServer(async function (req, res) {
  var caminho = req.url.split('?')[0];
  var partes = caminho.split('/');
  var ehApi = (partes[1] === 'api');
  var recurso = partes[2];
  var id = partes[3];

  try {
    // ===========================================================
    // CLIENTES
    // ===========================================================
    if (ehApi && recurso === 'clientes') {
      
      // GET /api/clientes (Listar todos)
      if (req.method === 'GET' && !id) {
        return db.all('SELECT * FROM cliente ORDER BY id DESC', [], function (erro, linhas) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          responderJson(res, 200, linhas);
        });
      }

      // GET /api/clientes/5 (Buscar um para edição)
      if (req.method === 'GET' && id) {
        return db.get('SELECT * FROM cliente WHERE id = ?', [id], function (erro, linha) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          if (!linha) return responderJson(res, 404, { erro: 'Cliente não encontrado.' });
          responderJson(res, 200, linha);
        });
      }

      // POST /api/clientes (Cadastrar)
      if (req.method === 'POST') {
        var c = await lerCorpo(req);
        if (!c.nome) return responderJson(res, 400, { erro: 'Nome é obrigatório.' });
        
        var sql = 'INSERT INTO cliente (nome, cpf, data_nasc, email, telefone, whatsapp, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var valores = [c.nome, c.cpf || null, c.data_nasc || null, c.email || null, c.telefone || null, c.whatsapp || null, new Date().toISOString()];
        
        return db.run(sql, valores, function (erro) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          responderJson(res, 201, { id: this.lastID });
        });
      }

      // PUT /api/clientes/5 (Alterar)
      if (req.method === 'PUT' && id) {
        var cUp = await lerCorpo(req);
        if (!cUp.nome) return responderJson(res, 400, { erro: 'Nome é obrigatório.' });

        var sqlUp = 'UPDATE cliente SET nome=?, cpf=?, data_nasc=?, email=?, telefone=?, whatsapp=? WHERE id=?';
        var valUp = [cUp.nome, cUp.cpf || null, cUp.data_nasc || null, cUp.email || null, cUp.telefone || null, cUp.whatsapp || null, id];

        return db.run(sqlUp, valUp, function (erro) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          if (this.changes === 0) return responderJson(res, 404, { erro: 'Cliente não encontrado.' });
          responderJson(res, 200, { id: Number(id) });
        });
      }

      // DELETE /api/clientes/5 (Excluir)
      if (req.method === 'DELETE' && id) {
        return db.run('DELETE FROM cliente WHERE id = ?', [id], function (erro) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          if (this.changes === 0) return responderJson(res, 404, { erro: 'Cliente não encontrado.' });
          responderJson(res, 200, { removido: Number(id) });
        });
      }
    }

    // ===========================================================
    // PRODUTOS (Para o modal de adicionar item no pedido funcionar)
    // ===========================================================
    if (ehApi && recurso === 'produtos') {
      if (req.method === 'GET' && !id) {
        return db.all('SELECT * FROM produto ORDER BY id DESC', [], function (erro, linhas) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          responderJson(res, 200, linhas);
        });
      }

      if (req.method === 'GET' && id) {
        return db.get('SELECT * FROM produto WHERE id = ?', [id], function (erro, linha) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          if (!linha) return responderJson(res, 404, { erro: 'Produto não encontrado.' });
          responderJson(res, 200, linha);
        });
      }

      if (req.method === 'POST') {
        var p = await lerCorpo(req);
        if (!p.nome) return responderJson(res, 400, { erro: 'Nome do produto é obrigatório.' });
        
        var sqlP = 'INSERT INTO produto (codigo, nome, categoria, descricao, preco, estoque, unidade, validade, fornecedor_id, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var valP = [p.codigo || null, p.nome, p.categoria || null, p.descricao || null, Number(p.preco) || 0, Number(p.estoque) || 0, p.unidade || null, p.validade || null, p.fornecedor_id || null, new Date().toISOString()];
        
        return db.run(sqlP, valP, function (erro) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          responderJson(res, 201, { id: this.lastID });
        });
      }

      if (req.method === 'PUT' && id) {
        var pUp = await lerCorpo(req);
        var sqlPUp = 'UPDATE produto SET codigo=?, nome=?, categoria=?, descricao=?, preco=?, estoque=?, unidade=?, validade=?, fornecedor_id=? WHERE id=?';
        var valPUp = [pUp.codigo || null, pUp.nome, pUp.categoria || null, pUp.descricao || null, Number(pUp.preco) || 0, Number(pUp.estoque) || 0, pUp.unidade || null, pUp.validade || null, pUp.fornecedor_id || null, id];
        
        return db.run(sqlPUp, valPUp, function (erro) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          if (this.changes === 0) return responderJson(res, 404, { erro: 'Produto não encontrado.' });
          responderJson(res, 200, { id: Number(id) });
        });
      }

      if (req.method === 'DELETE' && id) {
        return db.run('DELETE FROM produto WHERE id = ?', [id], function (erro) {
          if (erro) return responderJson(res, 500, { erro: erro.message });
          if (this.changes === 0) return responderJson(res, 404, { erro: 'Produto não encontrado.' });
          responderJson(res, 200, { removido: Number(id) });
        });
      }
    }

    // ===========================================================
    // ARQUIVOS ESTÁTICOS
    // ===========================================================
    if (req.method === 'GET' && !ehApi) {
      return servirArquivo(res, caminho === '/' ? 'login.html' : caminho);
    }

    responderJson(res, 404, { erro: 'Rota não encontrada.' });

  } catch (e) {
    responderJson(res, 400, { erro: e.message });
  }
});

servidor.listen(PORTA, function () {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});