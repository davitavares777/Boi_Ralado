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
  '.svg': 'image/svg+xml'
};

function servirArquivo(res, caminhoRelativo) {
  var caminho = path.join(__dirname, 'public', caminhoRelativo);
  if (!fs.existsSync(caminho)) {
    caminho = path.join(__dirname, caminhoRelativo);
  }
  if (!fs.existsSync(caminho)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Arquivo nao encontrado: ' + caminhoRelativo);
  }
  var tipo = TIPOS[path.extname(caminho)] || 'text/plain; charset=utf-8';
  res.writeHead(200, { 'Content-Type': tipo });
  res.end(fs.readFileSync(caminho));
}

var servidor = http.createServer(function (pedido, resposta) {
  var partes = pedido.url.split('/');
  var ehApi = (partes[1] === 'api');
  var recurso = partes[2];
  var id = partes[3];
  var metodo = pedido.method;

  // UPLOAD DE IMAGEM
  if (ehApi && recurso === 'upload' && metodo === 'POST') {
    lerDados(pedido, function (d) {
      if (!d.imagem || !d.nome) return recusar(resposta, 400, 'Dados incompletos.');
      try {
        var base64Data = d.imagem.replace(/^data:image\/\w+;base64,/, "");
        var buffer = Buffer.from(base64Data, 'base64');
        var nomeArquivo = Date.now() + '-' + d.nome.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        var caminhoArquivo = path.join(__dirname, 'img', 'produtos', nomeArquivo);
        
        if (!fs.existsSync(path.join(__dirname, 'img', 'produtos'))) {
          fs.mkdirSync(path.join(__dirname, 'img', 'produtos'), { recursive: true });
        }

        fs.writeFileSync(caminhoArquivo, buffer);
        responder(resposta, 200, { url: 'img/produtos/' + nomeArquivo });
      } catch (e) {
        recusar(resposta, 500, 'Erro ao salvar imagem.');
      }
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

  // CLIENTES
  if (ehApi && recurso === 'clientes') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM cliente ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return db.get('SELECT * FROM cliente WHERE id = ?', [id], function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Cliente não encontrado.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        var sql = 'INSERT INTO cliente (nome, cpf, data_nasc, email, telefone, whatsapp, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, new Date().toISOString()];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        var sql = 'UPDATE cliente SET nome=?, cpf=?, data_nasc=?, email=?, telefone=?, whatsapp=? WHERE id=?';
        var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, id];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          if (this.changes === 0) return recusar(resposta, 404, 'Cliente não encontrado.');
          responder(resposta, 200, { id: Number(id) });
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

  // FORNECEDORES
  if (ehApi && recurso === 'fornecedores') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM fornecedor ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return db.get('SELECT * FROM fornecedor WHERE id = ?', [id], function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Fornecedor não encontrado.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.razao_social) return recusar(resposta, 400, 'Razão Social é obrigatória.');
        var sql = 'INSERT INTO fornecedor (razao_social, nome_fantasia, cnpj, inscricao_est, email, telefone, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var val = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, new Date().toISOString()];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        var sql = 'UPDATE fornecedor SET razao_social=?, nome_fantasia=?, cnpj=?, inscricao_est=?, email=?, telefone=? WHERE id=?';
        var val = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, id];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          if (this.changes === 0) return recusar(resposta, 404, 'Fornecedor não encontrado.');
          responder(resposta, 200, { id: Number(id) });
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

  // PRODUTOS
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

  // ARQUIVOS ESTÁTICOS
  if (metodo === 'GET' && !ehApi) {
    return servirArquivo(resposta, pedido.url === '/' ? 'login.html' : pedido.url);
  }

  recusar(resposta, 404, 'Rota não encontrada.');
});

servidor.listen(PORTA, function () {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});