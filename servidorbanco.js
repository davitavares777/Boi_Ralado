// servidorbanco.js
var http = require('http');
var fs = require('fs');
var path = require('path');
var db = require('./db');

var PORTA = 3000;

function responder(res, codigo, dados) {
  var corpo = JSON.stringify({ ok: true, dados: dados });
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(corpo)
  });
  res.end(corpo);
}

function recusar(res, codigo, motivo) {
  var corpo = JSON.stringify({ ok: false, erro: motivo });
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(corpo)
  });
  res.end(corpo);
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

  var candidatos = [
    path.join(__dirname, 'public', caminhoRelativo),
    path.join(__dirname, 'public', 'html', path.basename(caminhoRelativo)),
    path.join(__dirname, 'public', caminhoRelativo.replace(/^html\//, '')),
    path.join(__dirname, caminhoRelativo)
  ];

  var caminho = candidatos.find(function (c) { return fs.existsSync(c); });

  if (!caminho) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Arquivo nao encontrado: ' + caminhoRelativo);
  }

  var tipo = TIPOS[path.extname(caminho)] || 'application/octet-stream';
  var conteudo = fs.readFileSync(caminho);
  res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': conteudo.length });
  res.end(conteudo);
}

var servidor = http.createServer(function (pedido, resposta) {
  var url = pedido.url.split('?')[0];
  var partes = url.split('/');
  var ehApi = (partes[1] === 'api');
  var recurso = partes[2];
  var id = partes[3];
  var metodo = pedido.method;

  // ========== UPLOAD DE IMAGEM DE PRODUTO ==========
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
      } catch (e) {
        recusar(resposta, 500, 'Erro ao salvar imagem.');
      }
    });
    return;
  }

  // ========== UPLOAD DE AVATAR ==========
  if (ehApi && recurso === 'upload-avatar' && metodo === 'POST') {
    lerDados(pedido, function (d) {
      if (!d.imagem || !d.nome) return recusar(resposta, 400, 'Dados incompletos.');
      try {
        var base64Data = d.imagem.replace(/^data:image\/\w+;base64,/, "");
        var buffer = Buffer.from(base64Data, 'base64');
        var nomeArquivo = 'avatar-' + Date.now() + '-' + d.nome.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        var pastaUpload = path.join(__dirname, 'public', 'img', 'avatares');
        if (!fs.existsSync(pastaUpload)) fs.mkdirSync(pastaUpload, { recursive: true });
        fs.writeFileSync(path.join(pastaUpload, nomeArquivo), buffer);

        var urlPublica = 'img/avatares/' + nomeArquivo;

        if (d.cliente_id) {
          db.run('UPDATE cliente SET foto = ? WHERE id = ?', [urlPublica, d.cliente_id], function (erro) {
            if (erro) console.log('[avatar] não foi possível salvar no banco:', erro.message);
            responder(resposta, 200, { url: urlPublica, cliente_id: d.cliente_id });
          });
        } else {
          responder(resposta, 200, { url: urlPublica });
        }
      } catch (e) {
        recusar(resposta, 500, 'Erro ao salvar avatar.');
      }
    });
    return;
  }

  // ========== CATEGORIAS ==========
  if (ehApi && recurso === 'categorias') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM categoria ORDER BY nome ASC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }

    if (metodo === 'GET' && id) {
      return db.get('SELECT * FROM categoria WHERE id = ?', [id], function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Categoria não encontrada.');
        responder(resposta, 200, linha);
      });
    }

    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        db.get('SELECT id FROM categoria WHERE nome = ?', [d.nome], function (erro, existe) {
          if (erro) return recusar(resposta, 500, erro.message);
          if (existe) return recusar(resposta, 400, 'Já existe uma categoria com esse nome.');
          db.run('INSERT INTO categoria (nome) VALUES (?)', [d.nome], function (erro2) {
            if (erro2) return recusar(resposta, 400, erro2.message);
            responder(resposta, 201, { id: this.lastID, nome: d.nome });
          });
        });
      });
      return;
    }

    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        db.run('UPDATE categoria SET nome = ? WHERE id = ?', [d.nome, id], function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          if (this.changes === 0) return recusar(resposta, 404, 'Categoria não encontrada.');
          responder(resposta, 200, { id: Number(id), nome: d.nome });
        });
      });
      return;
    }

    if (metodo === 'DELETE' && id) {
      var identificador = decodeURIComponent(id);
      var ehNumerico = /^\d+$/.test(identificador);

      if (ehNumerico) {
        db.run('DELETE FROM categoria WHERE id = ?', [identificador], function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          if (this.changes === 0) return recusar(resposta, 404, 'Categoria não encontrada.');
          responder(resposta, 200, { id: Number(identificador) });
        });
      } else {
        db.run('DELETE FROM categoria WHERE nome = ?', [identificador], function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          if (this.changes === 0) return recusar(resposta, 404, 'Categoria não encontrada.');
          responder(resposta, 200, { nome: identificador });
        });
      }
      return;
    }

    return recusar(resposta, 405, 'Método não permitido.');
  }

  // ========== CLIENTES ==========
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
        var sql = 'INSERT INTO cliente (nome, cpf, data_nasc, email, telefone, whatsapp, data_cadastro, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, new Date().toISOString(), d.foto || null];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        var sql = 'UPDATE cliente SET nome=?, cpf=?, data_nasc=?, email=?, telefone=?, whatsapp=?, foto=? WHERE id=?';
        var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, d.foto || null, id];
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

  // ========== FORNECEDORES ==========
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

  // ========== PRODUTOS ==========
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

  // ========== PEDIDOS ==========
  if (ehApi && recurso === 'pedidos') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM pedido ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return db.get('SELECT * FROM pedido WHERE id = ?', [id], function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Pedido não encontrado.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.numero) return recusar(resposta, 400, 'Número é obrigatório.');
        var sql = 'INSERT INTO pedido (numero, mesa, cliente_id, data, hora, subtotal, taxa, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.mesa || null, d.cliente_id || null, d.data || null, d.hora || null, Number(d.subtotal) || 0, Number(d.taxa) || 0, Number(d.total) || 0, d.status || 'Pago'];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM pedido WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        if (this.changes === 0) return recusar(resposta, 404, 'Pedido não encontrado.');
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  // ========== ENTREGAS ==========
  if (ehApi && recurso === 'entregas') {
    if (metodo === 'GET' && !id) {
      return db.all('SELECT * FROM entrega ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
    }
    if (metodo === 'GET' && id) {
      return db.get('SELECT * FROM entrega WHERE id = ?', [id], function (erro, linha) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!linha) return recusar(resposta, 404, 'Entrega não encontrada.');
        responder(resposta, 200, linha);
      });
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.numero) return recusar(resposta, 400, 'Número é obrigatório.');
        var sql = 'INSERT INTO entrega (numero, cliente_id, endereco_id, data, hora, subtotal, taxa, total, pagamento, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.cliente_id || null, d.endereco_id || null, d.data || null, d.hora || null, Number(d.subtotal) || 0, Number(d.taxa) || 0, Number(d.total) || 0, d.pagamento || null, d.status || 'Entregue'];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 201, { id: this.lastID });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM entrega WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        if (this.changes === 0) return recusar(resposta, 404, 'Entrega não encontrada.');
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  // ========== ARQUIVOS ESTÁTICOS ==========
  if (metodo === 'GET' && !ehApi) return servirArquivo(resposta, url);

  recusar(resposta, 404, 'Rota não encontrada.');
});

servidor.listen(PORTA, function () {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});