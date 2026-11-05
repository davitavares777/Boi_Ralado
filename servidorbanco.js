// ===========================================================================
//   servidor.js   -   ROTAS DO BOI RALADO
// ===========================================================================

var http = require('http');
var fs   = require('fs');
var path = require('path');
var banco = require('./banco');

var PORTA = 5000;

function responder(res, codigo, dados, oQueEuFiz) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: true, dados: dados, oQueEuFiz: oQueEuFiz }));
}

function recusar(res, codigo, motivo, oQueEuFiz) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, erro: motivo, oQueEuFiz: oQueEuFiz }));
}

function recusouOBanco(res, erro, oQueEuFiz) {
  oQueEuFiz.quemRecusou = 'o banco de dados';
  res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, erro: erro.message, oQueEuFiz: oQueEuFiz }));
}

function lerDados(pedido, quandoChegar) {
  var texto = '';
  pedido.on('data', function (p) { texto += p; });
  pedido.on('end', function () {
    try { quandoChegar(JSON.parse(texto)); }
    catch (e) { quandoChegar({}); }
  });
}

function paraNumero(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  var s = String(v).trim();
  if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
  var n = Number(s);
  return isNaN(n) ? 0 : n;
}

var servidor = http.createServer(function (pedido, resposta) {

  resposta.setHeader('Access-Control-Allow-Origin', '*');
  resposta.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  resposta.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (pedido.method === 'OPTIONS') { resposta.writeHead(204); return resposta.end(); }

  var partes  = pedido.url.split('/');
  var ehApi   = (partes[1] === 'api');
  var recurso = partes[2];
  var id      = partes[3];
  var metodo  = pedido.method;

  // =========================================================================
  // CLIENTES (rotas 1 a 4)
  // =========================================================================
  if (ehApi && recurso === 'clientes') {
    if (metodo === 'GET' && !id) {
      var r1 = { numero: 1, nome: 'LISTAR CLIENTES', comando: 'SELECT * FROM cliente ORDER BY nome', valores: [] };
      return banco.all(r1.comando, [], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r1);
        responder(resposta, 200, l, r1);
      });
    }
    if (metodo === 'GET' && id) {
      var r1b = { numero: 1, nome: 'BUSCAR CLIENTE', comando: 'SELECT * FROM cliente WHERE id = ?', valores: [id] };
      return banco.get(r1b.comando, [id], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r1b);
        if (!l) return recusar(resposta, 404, 'Cliente nao encontrado.', r1b);
        responder(resposta, 200, l, r1b);
      });
    }
    if (metodo === 'POST') {
      var r2 = { numero: 2, nome: 'CADASTRAR CLIENTE' };
      return lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome e obrigatorio.', r2);
        var cmd = 'INSERT INTO cliente (nome, cpf, data_nasc, email, telefone, whatsapp, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, new Date().toISOString()];
        r2.comando = cmd; r2.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r2);
          responder(resposta, 201, { id: this.lastID }, r2);
        });
      });
    }
    if (metodo === 'PUT' && id) {
      var r3 = { numero: 3, nome: 'ALTERAR CLIENTE' };
      return lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome e obrigatorio.', r3);
        var cmd = 'UPDATE cliente SET nome=?, cpf=?, data_nasc=?, email=?, telefone=?, whatsapp=? WHERE id=?';
        var val = [d.nome, d.cpf || null, d.data_nasc || null, d.email || null, d.telefone || null, d.whatsapp || null, id];
        r3.comando = cmd; r3.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r3);
          if (this.changes === 0) return recusar(resposta, 404, 'Cliente nao encontrado.', r3);
          responder(resposta, 200, { id: Number(id) }, r3);
        });
      });
    }
    if (metodo === 'DELETE' && id) {
      var r4 = { numero: 4, nome: 'EXCLUIR CLIENTE', comando: 'DELETE FROM cliente WHERE id = ?', valores: [id] };
      return banco.run(r4.comando, [id], function (e) {
        if (e) return recusouOBanco(resposta, e, r4);
        if (this.changes === 0) return recusar(resposta, 404, 'Cliente nao encontrado.', r4);
        responder(resposta, 200, { id: Number(id) }, r4);
      });
    }
  }

  // =========================================================================
  // FORNECEDORES (rotas 5 a 8)
  // =========================================================================
  if (ehApi && recurso === 'fornecedores') {
    if (metodo === 'GET' && !id) {
      var r5 = { numero: 5, nome: 'LISTAR FORNECEDORES', comando: 'SELECT * FROM fornecedor ORDER BY razao_social', valores: [] };
      return banco.all(r5.comando, [], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r5);
        responder(resposta, 200, l, r5);
      });
    }
    if (metodo === 'GET' && id) {
      var r5b = { numero: 5, nome: 'BUSCAR FORNECEDOR', comando: 'SELECT * FROM fornecedor WHERE id = ?', valores: [id] };
      return banco.get(r5b.comando, [id], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r5b);
        if (!l) return recusar(resposta, 404, 'Fornecedor nao encontrado.', r5b);
        responder(resposta, 200, l, r5b);
      });
    }
    if (metodo === 'POST') {
      var r6 = { numero: 6, nome: 'CADASTRAR FORNECEDOR' };
      return lerDados(pedido, function (d) {
        if (!d.razao_social) return recusar(resposta, 400, 'Razao social e obrigatoria.', r6);
        var cmd = 'INSERT INTO fornecedor (razao_social, nome_fantasia, cnpj, inscricao_est, email, telefone, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var val = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, new Date().toISOString()];
        r6.comando = cmd; r6.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r6);
          responder(resposta, 201, { id: this.lastID }, r6);
        });
      });
    }
    if (metodo === 'PUT' && id) {
      var r7 = { numero: 7, nome: 'ALTERAR FORNECEDOR' };
      return lerDados(pedido, function (d) {
        if (!d.razao_social) return recusar(resposta, 400, 'Razao social e obrigatoria.', r7);
        var cmd = 'UPDATE fornecedor SET razao_social=?, nome_fantasia=?, cnpj=?, inscricao_est=?, email=?, telefone=? WHERE id=?';
        var val = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, id];
        r7.comando = cmd; r7.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r7);
          if (this.changes === 0) return recusar(resposta, 404, 'Fornecedor nao encontrado.', r7);
          responder(resposta, 200, { id: Number(id) }, r7);
        });
      });
    }
    if (metodo === 'DELETE' && id) {
      var r8 = { numero: 8, nome: 'EXCLUIR FORNECEDOR', comando: 'DELETE FROM fornecedor WHERE id = ?', valores: [id] };
      return banco.run(r8.comando, [id], function (e) {
        if (e) return recusouOBanco(resposta, e, r8);
        if (this.changes === 0) return recusar(resposta, 404, 'Fornecedor nao encontrado.', r8);
        responder(resposta, 200, { id: Number(id) }, r8);
      });
    }
  }

  // =========================================================================
  // PRODUTOS (rotas 9 a 12)
  // =========================================================================
  if (ehApi && recurso === 'produtos') {
    if (metodo === 'GET' && !id) {
      var r9 = { numero: 9, nome: 'LISTAR PRODUTOS', comando: 'SELECT * FROM produto ORDER BY nome', valores: [] };
      return banco.all(r9.comando, [], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r9);
        responder(resposta, 200, l, r9);
      });
    }
    if (metodo === 'GET' && id) {
      var r9b = { numero: 9, nome: 'BUSCAR PRODUTO', comando: 'SELECT * FROM produto WHERE id = ?', valores: [id] };
      return banco.get(r9b.comando, [id], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r9b);
        if (!l) return recusar(resposta, 404, 'Produto nao encontrado.', r9b);
        responder(resposta, 200, l, r9b);
      });
    }
    if (metodo === 'POST') {
      var r10 = { numero: 10, nome: 'CADASTRAR PRODUTO' };
      return lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome e obrigatorio.', r10);
        var cmd = 'INSERT INTO produto (codigo, nome, categoria, fornecedor, descricao, preco, estoque, unidade, validade, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [
          d.codigo || null, d.nome, d.categoria || null, d.fornecedor || null, d.descricao || null,
          paraNumero(d.preco), parseInt(paraNumero(d.estoque), 10) || 0,
          d.unidade || null, d.validade || null, new Date().toISOString()
        ];
        r10.comando = cmd; r10.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r10);
          responder(resposta, 201, { id: this.lastID }, r10);
        });
      });
    }
    if (metodo === 'PUT' && id) {
      var r11 = { numero: 11, nome: 'ALTERAR PRODUTO' };
      return lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome e obrigatorio.', r11);
        var cmd = 'UPDATE produto SET codigo=?, nome=?, categoria=?, fornecedor=?, descricao=?, preco=?, estoque=?, unidade=?, validade=? WHERE id=?';
        var val = [
          d.codigo || null, d.nome, d.categoria || null, d.fornecedor || null, d.descricao || null,
          paraNumero(d.preco), parseInt(paraNumero(d.estoque), 10) || 0,
          d.unidade || null, d.validade || null, id
        ];
        r11.comando = cmd; r11.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r11);
          if (this.changes === 0) return recusar(resposta, 404, 'Produto nao encontrado.', r11);
          responder(resposta, 200, { id: Number(id) }, r11);
        });
      });
    }
    if (metodo === 'DELETE' && id) {
      var r12 = { numero: 12, nome: 'EXCLUIR PRODUTO', comando: 'DELETE FROM produto WHERE id = ?', valores: [id] };
      return banco.run(r12.comando, [id], function (e) {
        if (e) return recusouOBanco(resposta, e, r12);
        if (this.changes === 0) return recusar(resposta, 404, 'Produto nao encontrado.', r12);
        responder(resposta, 200, { id: Number(id) }, r12);
      });
    }
  }

  // =========================================================================
  // PEDIDOS (rotas 13 a 15)
  // =========================================================================
  if (ehApi && recurso === 'pedidos') {
    if (metodo === 'GET' && !id) {
      var r13 = { numero: 13, nome: 'LISTAR PEDIDOS', comando: 'SELECT * FROM pedido ORDER BY id DESC', valores: [] };
      return banco.all(r13.comando, [], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r13);
        responder(resposta, 200, l, r13);
      });
    }
    if (metodo === 'GET' && id) {
      var r13b = { numero: 13, nome: 'BUSCAR PEDIDO', comando: 'SELECT * FROM pedido WHERE id = ?', valores: [id] };
      return banco.get(r13b.comando, [id], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r13b);
        if (!l) return recusar(resposta, 404, 'Pedido nao encontrado.', r13b);
        banco.all('SELECT * FROM pedido_item WHERE pedido_id = ?', [id], function (e2, itens) {
          if (e2) return recusouOBanco(resposta, e2, r13b);
          l.itens = itens;
          responder(resposta, 200, l, r13b);
        });
      });
    }
    if (metodo === 'POST') {
      var r14 = { numero: 14, nome: 'CADASTRAR PEDIDO' };
      return lerDados(pedido, function (d) {
        if (!d.numero) return recusar(resposta, 400, 'Numero e obrigatorio.', r14);
        var cmd = 'INSERT INTO pedido (numero, mesa, cliente, data, hora, subtotal, total, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.mesa || null, d.cliente || null, d.data || new Date().toISOString().slice(0,10), d.hora || null, paraNumero(d.subtotal), paraNumero(d.total), d.status || 'Pago'];
        r14.comando = cmd; r14.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r14);
          var pedidoId = this.lastID;
          var itens = d.itens || [];
          if (!itens.length) return responder(resposta, 201, { id: pedidoId }, r14);
          var sqlItem = 'INSERT INTO pedido_item (pedido_id, produto_id, nome_item, quantidade, valor_unit, subtotal) VALUES (?, ?, ?, ?, ?, ?)';
          var pendentes = itens.length, falhou = false;
          itens.forEach(function (item) {
            var v = [pedidoId, item.produto_id || null, item.nome || 'Item', parseInt(item.quantidade || item.qtd, 10) || 1, paraNumero(item.valor_unit || item.preco), paraNumero(item.subtotal)];
            banco.run(sqlItem, v, function (e2) {
              if (falhou) return;
              if (e2) { falhou = true; return recusouOBanco(resposta, e2, r14); }
              pendentes--;
              if (pendentes === 0) responder(resposta, 201, { id: pedidoId }, r14);
            });
          });
        });
      });
    }
    if (metodo === 'DELETE' && id) {
      var r15 = { numero: 15, nome: 'EXCLUIR PEDIDO', comando: 'DELETE FROM pedido WHERE id = ?', valores: [id] };
      return banco.run(r15.comando, [id], function (e) {
        if (e) return recusouOBanco(resposta, e, r15);
        if (this.changes === 0) return recusar(resposta, 404, 'Pedido nao encontrado.', r15);
        responder(resposta, 200, { id: Number(id) }, r15);
      });
    }
  }

  // =========================================================================
  // ENTREGAS (rotas 16 a 18)
  // =========================================================================
  if (ehApi && recurso === 'entregas') {
    if (metodo === 'GET' && !id) {
      var r16 = { numero: 16, nome: 'LISTAR ENTREGAS', comando: 'SELECT * FROM entrega ORDER BY id DESC', valores: [] };
      return banco.all(r16.comando, [], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r16);
        responder(resposta, 200, l, r16);
      });
    }
    if (metodo === 'GET' && id) {
      var r16b = { numero: 16, nome: 'BUSCAR ENTREGA', comando: 'SELECT * FROM entrega WHERE id = ?', valores: [id] };
      return banco.get(r16b.comando, [id], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r16b);
        if (!l) return recusar(resposta, 404, 'Entrega nao encontrada.', r16b);
        banco.all('SELECT * FROM entrega_item WHERE entrega_id = ?', [id], function (e2, itens) {
          if (e2) return recusouOBanco(resposta, e2, r16b);
          l.itens = itens;
          responder(resposta, 200, l, r16b);
        });
      });
    }
    if (metodo === 'POST') {
      var r17 = { numero: 17, nome: 'CADASTRAR ENTREGA' };
      return lerDados(pedido, function (d) {
        if (!d.numero) return recusar(resposta, 400, 'Numero e obrigatorio.', r17);
        var cmd = 'INSERT INTO entrega (numero, cliente, endereco, data, hora, subtotal, taxa, total, pagamento, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.cliente || null, d.endereco || null, d.data || new Date().toISOString().slice(0,10), d.hora || null, paraNumero(d.subtotal), paraNumero(d.taxa), paraNumero(d.total), d.pagamento || null, d.status || 'Entregue'];
        r17.comando = cmd; r17.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r17);
          var entregaId = this.lastID;
          var itens = d.itens || [];
          if (!itens.length) return responder(resposta, 201, { id: entregaId }, r17);
          var sqlItem = 'INSERT INTO entrega_item (entrega_id, produto_id, nome_item, quantidade, valor_unit, subtotal) VALUES (?, ?, ?, ?, ?, ?)';
          var pendentes = itens.length, falhou = false;
          itens.forEach(function (item) {
            var v = [entregaId, item.produto_id || null, item.nome || 'Item', parseInt(item.quantidade || item.qtd, 10) || 1, paraNumero(item.valor_unit || item.preco), paraNumero(item.subtotal)];
            banco.run(sqlItem, v, function (e2) {
              if (falhou) return;
              if (e2) { falhou = true; return recusouOBanco(resposta, e2, r17); }
              pendentes--;
              if (pendentes === 0) responder(resposta, 201, { id: entregaId }, r17);
            });
          });
        });
      });
    }
    if (metodo === 'DELETE' && id) {
      var r18 = { numero: 18, nome: 'EXCLUIR ENTREGA', comando: 'DELETE FROM entrega WHERE id = ?', valores: [id] };
      return banco.run(r18.comando, [id], function (e) {
        if (e) return recusouOBanco(resposta, e, r18);
        if (this.changes === 0) return recusar(resposta, 404, 'Entrega nao encontrada.', r18);
        responder(resposta, 200, { id: Number(id) }, r18);
      });
    }
  }

  // =========================================================================
  // COMANDAS (rotas 19 a 21)
  // =========================================================================
  if (ehApi && recurso === 'comandas') {
    if (metodo === 'GET' && !id) {
      var r19 = { numero: 19, nome: 'LISTAR COMANDAS', comando: 'SELECT * FROM comanda ORDER BY id DESC', valores: [] };
      return banco.all(r19.comando, [], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r19);
        responder(resposta, 200, l, r19);
      });
    }
    if (metodo === 'GET' && id) {
      var r19b = { numero: 19, nome: 'BUSCAR COMANDA', comando: 'SELECT * FROM comanda WHERE id = ?', valores: [id] };
      return banco.get(r19b.comando, [id], function (e, l) {
        if (e) return recusouOBanco(resposta, e, r19b);
        if (!l) return recusar(resposta, 404, 'Comanda nao encontrada.', r19b);
        banco.all('SELECT * FROM comanda_item WHERE comanda_id = ?', [id], function (e2, itens) {
          if (e2) return recusouOBanco(resposta, e2, r19b);
          l.itens = itens;
          responder(resposta, 200, l, r19b);
        });
      });
    }
    if (metodo === 'POST') {
      var r20 = { numero: 20, nome: 'CADASTRAR COMANDA' };
      return lerDados(pedido, function (d) {
        if (!d.numero) return recusar(resposta, 400, 'Numero e obrigatorio.', r20);
        var cmd = 'INSERT INTO comanda (numero, mesa, hora, subtotal, total, status, data) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.mesa || null, d.hora || null, paraNumero(d.subtotal), paraNumero(d.total), d.status || 'Pago', d.data || new Date().toISOString().slice(0,10)];
        r20.comando = cmd; r20.valores = val;
        banco.run(cmd, val, function (e) {
          if (e) return recusouOBanco(resposta, e, r20);
          var comandaId = this.lastID;
          var itens = d.itens || [];
          if (!itens.length) return responder(resposta, 201, { id: comandaId }, r20);
          var sqlItem = 'INSERT INTO comanda_item (comanda_id, produto_id, nome_item, quantidade, valor_unit, subtotal) VALUES (?, ?, ?, ?, ?, ?)';
          var pendentes = itens.length, falhou = false;
          itens.forEach(function (item) {
            var v = [comandaId, item.produto_id || null, item.nome || 'Item', parseInt(item.quantidade || item.qtd, 10) || 1, paraNumero(item.valor_unit || item.preco), paraNumero(item.subtotal)];
            banco.run(sqlItem, v, function (e2) {
              if (falhou) return;
              if (e2) { falhou = true; return recusouOBanco(resposta, e2, r20); }
              pendentes--;
              if (pendentes === 0) responder(resposta, 201, { id: comandaId }, r20);
            });
          });
        });
      });
    }
    if (metodo === 'DELETE' && id) {
      var r21 = { numero: 21, nome: 'EXCLUIR COMANDA', comando: 'DELETE FROM comanda WHERE id = ?', valores: [id] };
      return banco.run(r21.comando, [id], function (e) {
        if (e) return recusouOBanco(resposta, e, r21);
        if (this.changes === 0) return recusar(resposta, 404, 'Comanda nao encontrada.', r21);
        responder(resposta, 200, { id: Number(id) }, r21);
      });
    }
  }

  // =========================================================================
  // ARQUIVOS ESTÁTICOS (pasta public)
  // =========================================================================
  if (metodo === 'GET' && !ehApi) {
    var endereco = pedido.url === '/' ? '/login.html' : pedido.url;
    var publica = path.join(__dirname, 'public');
    var arquivo = path.join(publica, endereco);
    if (arquivo.indexOf(publica) !== 0 || !fs.existsSync(arquivo)) {
      resposta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return resposta.end('Nao achei o arquivo ' + endereco);
    }
    var tipos = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
    resposta.writeHead(200, { 'Content-Type': (tipos[path.extname(arquivo)] || 'text/plain') + '; charset=utf-8' });
    resposta.end(fs.readFileSync(arquivo));
    return;
  }

  recusar(resposta, 404, 'Nao conheco ' + metodo + ' ' + pedido.url, { numero: 0, nome: 'DESCONHECIDA' });
});

servidor.on('error', function (erro) {
  if (erro.code === 'EADDRINUSE') {
    console.log('\n  A porta ' + PORTA + ' ja esta em uso. Feche a outra janela ou troque a PORTA.\n');
    return;
  }
  throw erro;
});

servidor.listen(PORTA, function () {
  console.log('\n  Servidor Boi Ralado no ar, com 21 rotas.');
  console.log('\n      http://localhost:' + PORTA + '\n');
  console.log('  Para parar: Ctrl + C\n');
});