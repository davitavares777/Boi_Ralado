// servidorbanco.js
var http = require('http');
var fs = require('fs');
var path = require('path');
var db = require('./db');

var PORTA = 3000;

function responder(res, codigo, dados) {
  var corpo = JSON.stringify({ ok: true, dados: dados });
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(corpo) });
  res.end(corpo);
}

function recusar(res, codigo, motivo) {
  var corpo = JSON.stringify({ ok: false, erro: motivo });
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(corpo) });
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
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function servirArquivo(res, caminhoRelativo) {
  if (caminhoRelativo === '/' || caminhoRelativo === '') caminhoRelativo = 'login.html';
  caminhoRelativo = caminhoRelativo.replace(/^\/+/, '');
  
  if (!path.extname(caminhoRelativo)) {
    caminhoRelativo += '.html';
  }

  var candidatos = [
    path.join(__dirname, 'public', 'html', caminhoRelativo),
    path.join(__dirname, 'public', 'html', path.basename(caminhoRelativo)),
    path.join(__dirname, 'public', caminhoRelativo),
    path.join(__dirname, 'html', caminhoRelativo),
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
  var urlPartes = pedido.url.split('?');
  var url = urlPartes[0];
  var parametrosUrl = new URLSearchParams(urlPartes[1] || '');
  var partes = url.split('/');
  var ehApi = (partes[1] === 'api');
  var recurso = partes[2];
  var id = partes[3];
  var metodo = pedido.method;

  // ========== UPLOADS ==========
  if (ehApi && (recurso === 'upload' || recurso === 'upload-avatar') && metodo === 'POST') {
    lerDados(pedido, function (d) {
      if (!d.imagem || !d.nome) return recusar(resposta, 400, 'Dados incompletos.');
      try {
        var base64Data = d.imagem.replace(/^data:image\/\w+;base64,/, "");
        var buffer = Buffer.from(base64Data, 'base64');
        var prefixo = recurso === 'upload-avatar' ? 'avatar-' : '';
        var nomeArquivo = prefixo + Date.now() + '-' + d.nome.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        var subPasta = recurso === 'upload-avatar' ? 'avatares' : 'produtos';
        var pastaUpload = path.join(__dirname, 'public', 'img', subPasta);
        
        if (!fs.existsSync(pastaUpload)) fs.mkdirSync(pastaUpload, { recursive: true });
        fs.writeFileSync(path.join(pastaUpload, nomeArquivo), buffer);
        responder(resposta, 200, { url: 'img/' + subPasta + '/' + nomeArquivo });
      } catch (e) { recusar(resposta, 500, 'Erro ao salvar imagem.'); }
    });
    return;
  }

  // ========== LOGIN / CADASTRO ==========
  if (ehApi && recurso === 'login' && metodo === 'POST') {
    lerDados(pedido, function (d) {
      if (!d.email && !d.cpf) return recusar(resposta, 400, 'Informe e-mail ou CPF.');
      if (!d.senha) return recusar(resposta, 400, 'Informe a senha.');
      
      var sql = 'SELECT u.*, f.cargo FROM usuario u LEFT JOIN funcionario f ON f.usuario_id = u.id WHERE (u.email = ? OR u.cpf = ?) AND u.senha = ?';
      db.get(sql, [d.email || '', d.cpf || '', d.senha], function (erro, usuario) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!usuario) return recusar(resposta, 401, 'Credenciais inválidas.');
        responder(resposta, 200, {
          id: usuario.id, nome: usuario.nome, email: usuario.email, cpf: usuario.cpf,
          papel: usuario.papel, cargo: usuario.cargo || null, foto: usuario.foto
        });
      });
    });
    return;
  }

  if (ehApi && recurso === 'cadastro' && metodo === 'POST') {
    lerDados(pedido, function (d) {
      if (!d.nome || !d.email || !d.senha || !d.papel) return recusar(resposta, 400, 'Dados incompletos.');
      
      var sql = 'INSERT INTO usuario (nome, email, cpf, senha, papel, data_cadastro, foto) VALUES (?, ?, ?, ?, ?, ?, ?)';
      var val = [d.nome, d.email, d.cpf || null, d.senha, d.papel, new Date().toISOString(), d.foto || null];
      
      db.run(sql, val, function (erro) {
        if (erro) {
          if (erro.message.includes('UNIQUE')) return recusar(resposta, 409, 'E-mail ou CPF já cadastrado.');
          return recusar(resposta, 400, erro.message);
        }
        var usuarioId = this.lastID;
        
        if (d.papel === 'Funcionario' && d.cargo) {
          db.run('INSERT INTO funcionario (usuario_id, cargo) VALUES (?, ?)', [usuarioId, d.cargo]);
        }
        
        if (d.papel === 'Cliente') {
          var sqlEnd = 'INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?)';
          var valEnd = [d.cep || '', d.endereco || 'Não informado', d.numero || '', d.complemento || '', d.bairro || '', d.cidade || 'Não informada', d.estado || 'AC'];
          db.run(sqlEnd, valEnd, function (errEnd) {
            var endId = this.lastID;
            var sqlCli = 'INSERT INTO cliente (nome, cpf, data_nasc, email, telefone, whatsapp, endereco_id, data_cadastro, foto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            var valCli = [d.nome, d.cpf || null, d.data_nasc || null, d.email, d.telefone || null, d.whatsapp || null, endId, new Date().toISOString(), d.foto || null];
            db.run(sqlCli, valCli);
          });
        }
        
        responder(resposta, 201, { id: usuarioId, papel: d.papel, cargo: d.cargo || null });
      });
    });
    return;
  }

  if (ehApi && recurso === 'usuarios' && metodo === 'GET') {
    db.all('SELECT id, nome, email, cpf, papel, data_cadastro FROM usuario ORDER BY id DESC', [], function (erro, lista) {
      if (erro) return recusar(resposta, 500, erro.message);
      responder(resposta, 200, lista);
    });
    return;
  }

  // ========== GRÁFICOS DINÂMICOS ==========
  if (ehApi && recurso === 'graficos' && metodo === 'GET') {
    var contextoGrafico = parametrosUrl.get('contexto') || 'geral';
    Promise.all([
      new Promise(function(resolve) { db.all('SELECT p.*, pi.nome_item, pi.quantidade, pi.valor_unit, pr.categoria AS categoria_produto FROM pedido p LEFT JOIN pedido_item pi ON pi.pedido_id = p.id LEFT JOIN produto pr ON lower(pr.nome) = lower(pi.nome_item)', [], function(e, rows) { resolve(e ? [] : rows || []); }); }),
      new Promise(function(resolve) { db.all('SELECT e.*, ei.nome_item, ei.quantidade, ei.valor_unit, pr.categoria AS categoria_produto FROM entrega e LEFT JOIN entrega_item ei ON ei.entrega_id = e.id LEFT JOIN produto pr ON lower(pr.nome) = lower(ei.nome_item)', [], function(e, rows) { resolve(e ? [] : rows || []); }); })
    ]).then(function(resultados) {
      var pedidosRows = resultados[0], entregasRows = resultados[1];
      var usarPedidos = contextoGrafico !== 'delivery';
      var usarEntregas = contextoGrafico !== 'balcao';
      var pedidos = [], entregas = [], itens = [];
      if (usarPedidos || contextoGrafico === 'delivery') {
        pedidosRows.forEach(function(row) {
          var ehPedidoCliente = !!row.cliente_email;
          if (contextoGrafico === 'delivery' && !ehPedidoCliente) return;
          if (contextoGrafico === 'balcao' && ehPedidoCliente) return;
          var atual = pedidos.find(function(x) { return x.id === row.id; });
          if (!atual) { atual = { id: row.id, total: Number(row.total) || 0, data: row.data, pagamento: row.pagamento || 'Não informado', pagamento_status: row.pagamento_status, status: row.status }; pedidos.push(atual); }
          if (row.nome_item) itens.push({ nome: row.nome_item, qtd: Number(row.quantidade) || 0, categoria: row.categoria_produto || 'Outros' });
        });
      }
      if (usarEntregas) {
        entregasRows.forEach(function(row) {
          var atual = entregas.find(function(x) { return x.id === row.id; });
          if (!atual) { atual = { id: row.id, total: Number(row.total) || 0, data: row.data, pagamento: row.pagamento || 'Não informado', pagamento_status: 'Pago', status: row.status }; entregas.push(atual); }
          if (row.nome_item) itens.push({ nome: row.nome_item, qtd: Number(row.quantidade) || 0, categoria: row.categoria_produto || 'Outros' });
        });
      }
      var pagamentos = {};
      pedidos.concat(entregas).forEach(function(x) { if (x.pagamento_status === 'Pago' || x.status === 'Pago') pagamentos[x.pagamento] = (pagamentos[x.pagamento] || 0) + x.total; });
      var vendasPorDia = {};
      pedidos.concat(entregas).forEach(function(x) { if (x.data) vendasPorDia[x.data] = (vendasPorDia[x.data] || 0) + x.total; });
      var ultimosDias = [];
      for (var i = 6; i >= 0; i--) { var dia = new Date(); dia.setDate(dia.getDate() - i); var iso = dia.getFullYear() + '-' + String(dia.getMonth()+1).padStart(2,'0') + '-' + String(dia.getDate()).padStart(2,'0'); ultimosDias.push({ dia: dia.toLocaleDateString('pt-BR', { weekday: 'short' }), valor: Number(vendasPorDia[iso] || 0) }); }
      var vendidos = {}; var categorias = {};
      itens.forEach(function(x) { vendidos[x.nome] = (vendidos[x.nome] || 0) + x.qtd; categorias[x.categoria] = (categorias[x.categoria] || 0) + x.qtd; });
      var dados = {
        categorias: Object.keys(categorias).map(function(nome) { return { nome: nome, qtd: categorias[nome] }; }),
        pagamentos: Object.keys(pagamentos).map(function(nome) { return { nome: nome, valor: pagamentos[nome] }; }),
        faturamento7dias: ultimosDias,
        maisVendidos: Object.keys(vendidos).map(function(nome) { return { nome: nome, qtd: vendidos[nome] }; }).sort(function(a,b) { return b.qtd-a.qtd; }).slice(0,8),
        totais: [pedidos.length, entregas.length, pedidos.reduce(function(s,x){return s+x.total;},0), entregas.reduce(function(s,x){return s+x.total;},0)]
      };
      responder(resposta, 200, dados);
    });
    return;
  }


  // ========== CLIENTES / PERFIL ==========
  if (ehApi && recurso === 'clientes') {
    if (metodo === 'GET') {
      db.all('SELECT c.*, e.cep, e.logradouro AS endereco, e.numero, e.complemento, e.bairro, e.cidade, e.uf AS estado FROM cliente c LEFT JOIN endereco e ON e.id = c.endereco_id ORDER BY c.id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista || []);
      });
      return;
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        db.run('INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [d.cep || '', d.endereco || 'Não informado', d.numero || '', d.complemento || '', d.bairro || '', d.cidade || 'Não informada', d.estado || 'AC'],
          function (errEnd) {
            if (errEnd) return recusar(resposta, 400, errEnd.message);
            var endId = this.lastID;
            db.run('INSERT INTO cliente (nome, cpf, email, telefone, endereco_id, data_cadastro) VALUES (?, ?, ?, ?, ?, ?)',
              [d.nome, d.cpf || null, d.email || null, d.telefone || null, endId, new Date().toISOString()],
              function (errCli) {
                if (errCli) return recusar(resposta, 400, errCli.message);
                responder(resposta, 201, { id: this.lastID, endereco_id: endId });
              });
          });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        db.get('SELECT endereco_id FROM cliente WHERE id = ?', [id], function (errBusca, cli) {
          if (errBusca) return recusar(resposta, 500, errBusca.message);
          if (!cli) return recusar(resposta, 404, 'Cliente não encontrado.');
          function salvarCliente(endId) {
            db.run('UPDATE cliente SET nome=?, cpf=?, email=?, telefone=?, endereco_id=? WHERE id=?',
              [d.nome, d.cpf || null, d.email || null, d.telefone || null, endId, id],
              function (errCli) {
                if (errCli) return recusar(resposta, 400, errCli.message);
                responder(resposta, 200, { id: Number(id), endereco_id: endId });
              });
          }
          var valores = [d.cep || '', d.endereco || 'Não informado', d.numero || '', d.complemento || '', d.bairro || '', d.cidade || 'Não informada', d.estado || 'AC'];
          if (cli.endereco_id) {
            db.run('UPDATE endereco SET cep=?, logradouro=?, numero=?, complemento=?, bairro=?, cidade=?, uf=? WHERE id=?',
              valores.concat([cli.endereco_id]), function (errEnd) {
                if (errEnd) return recusar(resposta, 400, errEnd.message);
                salvarCliente(cli.endereco_id);
              });
          } else {
            db.run('INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?)',
              valores, function (errEnd) {
                if (errEnd) return recusar(resposta, 400, errEnd.message);
                salvarCliente(this.lastID);
              });
          }
        });
      });
      return;
    }
  }

  // ========== CATEGORIAS ==========
  if (ehApi && recurso === 'categorias') {
    if (metodo === 'GET') {
      db.all('SELECT * FROM categoria ORDER BY nome ASC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
      return;
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.nome) return recusar(resposta, 400, 'Nome é obrigatório.');
        db.get('SELECT id FROM categoria WHERE lower(nome) = lower(?)', [String(d.nome).trim()], function(errBusca, existente) {
          if (errBusca) return recusar(resposta, 500, errBusca.message);
          if (existente) return recusar(resposta, 409, 'Esta categoria já está cadastrada.');
          db.run('INSERT INTO categoria (nome) VALUES (?)', [String(d.nome).trim()], function (erro) {
            if (erro) return recusar(resposta, 400, erro.message);
            responder(resposta, 201, { id: this.lastID, nome: String(d.nome).trim() });
          });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM categoria WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  // ========== FORNECEDORES ==========
  if (ehApi && recurso === 'fornecedores') {
    if (metodo === 'GET' && !id) {
      db.all('SELECT f.*, e.cep, e.logradouro as endereco, e.numero, e.complemento, e.bairro, e.cidade, e.uf as estado FROM fornecedor f LEFT JOIN endereco e ON f.endereco_id = e.id ORDER BY f.id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
      return;
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        if (!d.razao_social) return recusar(resposta, 400, 'Razão social é obrigatória.');
        var sqlEnd = 'INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?)';
        var valEnd = [d.cep || '', d.endereco || 'Não informado', d.numero || '', d.complemento || '', d.bairro || '', d.cidade || 'Não informada', d.estado || 'AC'];
        db.run(sqlEnd, valEnd, function (errEnd) {
          if (errEnd) return recusar(resposta, 400, 'Erro no endereço: ' + errEnd.message);
          var enderecoId = this.lastID;
          var sqlForn = 'INSERT INTO fornecedor (razao_social, nome_fantasia, cnpj, inscricao_est, email, telefone, endereco_id, data_cadastro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          var valForn = [d.razao_social, d.nome_fantasia || null, d.cnpj || null, d.inscricao_est || null, d.email || null, d.telefone || null, enderecoId, new Date().toISOString()];
          db.run(sqlForn, valForn, function (errForn) {
            if (errForn) return recusar(resposta, 400, 'Erro no fornecedor: ' + errForn.message);
            responder(resposta, 201, { id: this.lastID, endereco_id: enderecoId });
          });
        });
      });
      return;
    }
  }

  // ========== PRODUTOS ==========
  if (ehApi && recurso === 'produtos') {
    if (metodo === 'GET') {
      db.all('SELECT * FROM produto ORDER BY id DESC', [], function (erro, lista) {
        if (erro) return recusar(resposta, 500, erro.message);
        responder(resposta, 200, lista);
      });
      return;
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
  }

  // ========== PEDIDOS ==========
  if (ehApi && recurso === 'pedidos') {
    if (metodo === 'GET') {
      db.all('SELECT * FROM pedido ORDER BY id DESC', [], function (erro, pedidos) {
        if (erro) return recusar(resposta, 500, erro.message);
        var emailFiltro = (parametrosUrl.get('cliente_email') || '').toLowerCase();
        var listaFiltrada = emailFiltro ? (pedidos || []).filter(function(p) { return String(p.cliente_email || '').toLowerCase() === emailFiltro; }) : (pedidos || []);
        if (!listaFiltrada.length) return responder(resposta, 200, []);
        var promessas = listaFiltrada.map(function(p) {
          return new Promise(function(resolve) {
            db.all('SELECT nome_item, quantidade, valor_unit, subtotal FROM pedido_item WHERE pedido_id = ?', [p.id], function(erroItem, itens) {
              p.itens = (itens || []).map(function(i) { return { nome_item: i.nome_item, quantidade: i.quantidade, valor_unit: i.valor_unit, nome: i.nome_item, qtd: i.quantidade, preco: i.valor_unit, subtotal: i.subtotal }; });
              resolve(p);
            });
          });
        });
        Promise.all(promessas).then(function(pedidosCompletos) { responder(resposta, 200, pedidosCompletos); });
      });
      return;
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        var sql = 'INSERT INTO pedido (numero, mesa, cliente_id, data, hora, subtotal, taxa, total, status, observacao, cliente_email, pagamento, pagamento_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.mesa || null, d.cliente_id || null, d.data, d.hora, Number(d.subtotal) || 0, Number(d.taxa) || 0, Number(d.total) || 0, d.status || 'Em preparo', d.observacao || null, d.cliente_email || null, d.pagamento || null, d.pagamento_status || 'Pendente'];
        
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          var pedidoId = this.lastID;
          if (d.itens && d.itens.length > 0) {
            var stmt = db.prepare('INSERT INTO pedido_item (pedido_id, nome_item, quantidade, valor_unit, subtotal) VALUES (?, ?, ?, ?, ?)');
            d.itens.forEach(function(item) { stmt.run(pedidoId, item.nome, item.qtd, item.preco, item.qtd * item.preco); });
            stmt.finalize();
          }
          responder(resposta, 201, { id: pedidoId });
        });
      });
      return;
    }
    if (metodo === 'PUT' && id) {
      lerDados(pedido, function (d) {
        var sql = 'UPDATE pedido SET numero=COALESCE(?, numero), mesa=COALESCE(?, mesa), status=COALESCE(?, status), observacao=COALESCE(?, observacao), pagamento=COALESCE(?, pagamento), pagamento_status=COALESCE(?, pagamento_status) WHERE id=?';
        var val = [d.numero || null, d.mesa || null, d.status || null, d.observacao || null, d.pagamento || null, d.pagamento_status || null, id];
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          responder(resposta, 200, { ok: true });
        });
      });
      return;
    }
    if (metodo === 'DELETE' && id) {
      db.run('DELETE FROM pedido WHERE id = ?', [id], function (erro) {
        if (erro) return recusar(resposta, 400, erro.message);
        responder(resposta, 200, { id: Number(id) });
      });
      return;
    }
  }

  // ========== ENTREGAS ==========
  if (ehApi && recurso === 'entregas') {
    if (metodo === 'GET') {
      db.all('SELECT * FROM entrega ORDER BY id DESC', [], function (erro, entregas) {
        if (erro) return recusar(resposta, 500, erro.message);
        if (!entregas || entregas.length === 0) return responder(resposta, 200, []);
        var promessas = entregas.map(function(e) {
          return new Promise(function(resolve) {
            db.all('SELECT * FROM entrega_item WHERE entrega_id = ?', [e.id], function(erroItem, itens) {
              e.itens = itens || [];
              resolve(e);
            });
          });
        });
        Promise.all(promessas).then(function(entregasCompletas) {
          responder(resposta, 200, entregasCompletas);
        });
      });
      return;
    }
    if (metodo === 'POST') {
      lerDados(pedido, function (d) {
        var sql = 'INSERT INTO entrega (numero, cliente_id, endereco_id, data, hora, subtotal, taxa, total, pagamento, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        var val = [d.numero, d.cliente_id || null, d.endereco_id || null, d.data, d.hora, Number(d.subtotal) || 0, Number(d.taxa) || 0, Number(d.total) || 0, d.pagamento || null, d.status || 'Entregue'];
        
        db.run(sql, val, function (erro) {
          if (erro) return recusar(resposta, 400, erro.message);
          var entregaId = this.lastID;
          if (d.itens && d.itens.length > 0) {
            var stmt = db.prepare('INSERT INTO entrega_item (entrega_id, nome_item, quantidade, valor_unit, subtotal) VALUES (?, ?, ?, ?, ?)');
            d.itens.forEach(function(item) { stmt.run(entregaId, item.nome, item.qtd, item.preco, item.qtd * item.preco); });
            stmt.finalize();
          }
          responder(resposta, 201, { id: entregaId });
        });
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