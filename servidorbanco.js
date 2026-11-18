// servidorbanco.js
var http = require('http');
var fs = require('fs');
var path = require('path');
var bcrypt = require('bcrypt');
var db = require('./db');

var PORTA = process.env.PORT || 3000;
var RAIZ = path.join(__dirname, 'public');
var CODIGO_MESTRE = process.env.CODIGO_FUNCIONARIO || 'BOI2026';

// ---------- Helpers ----------
function responder(res, codigo, dados) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: true, dados: dados }));
}

function recusar(res, codigo, motivo) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, erro: motivo }));
}

function lerDados(req, cb) {
  var texto = '';
  req.on('data', function (p) { texto += p; });
  req.on('end', function () {
    try { cb(JSON.parse(texto || '{}')); }
    catch (e) { cb({}); }
  });
}

var TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon'
};

function servirArquivo(res, caminho) {
  fs.readFile(caminho, function (erro, conteudo) {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado: ' + caminho);
      return;
    }
    var ext = path.extname(caminho).toLowerCase();
    res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream' });
    res.end(conteudo);
  });
}

// ---------- Servidor ----------
var servidor = http.createServer(function (req, res) {
  var url = req.url.split('?')[0];
  var partes = url.split('/');
  var ehApi = (partes[1] === 'api');
  var recurso = (partes[2] || '').toLowerCase();
  var metodo = req.method;

  // LOG DE DIAGNÓSTICO — olhe o terminal ao testar
  console.log('[REQ]', metodo, url, '| ehApi:', ehApi, '| recurso:', recurso);

  // ============================================================
  // LOGIN
  // ============================================================
  if (ehApi && recurso === 'login' && metodo === 'POST') {
    return lerDados(req, function (d) {
      if (!d.tipo || !d.identificador || !d.senha) {
        return recusar(res, 400, 'Preencha todos os campos.');
      }

      if (d.tipo === 'funcionario') {
        db.get('SELECT * FROM funcionario WHERE email = ?', [d.identificador], function (erro, user) {
          if (erro) return recusar(res, 500, erro.message);
          if (!user) return recusar(res, 401, 'E-mail ou senha inválidos.');
          if (!user.ativo) return recusar(res, 403, 'Conta desativada.');
          bcrypt.compare(d.senha, user.senha, function (err, ok) {
            if (err || !ok) return recusar(res, 401, 'E-mail ou senha inválidos.');
            responder(res, 200, { tipo: 'funcionario', id: user.id, nome: user.nome, funcao: user.funcao });
          });
        });
        return;
      }

      if (d.tipo === 'cliente') {
        db.get('SELECT * FROM cliente WHERE cpf = ? OR email = ?', [d.identificador, d.identificador], function (erro, user) {
          if (erro) return recusar(res, 500, erro.message);
          if (!user) return recusar(res, 401, 'CPF/E-mail ou senha inválidos.');
          if (!user.senha) return recusar(res, 401, 'Conta sem senha cadastrada.');
          bcrypt.compare(d.senha, user.senha, function (err, ok) {
            if (err || !ok) return recusar(res, 401, 'CPF/E-mail ou senha inválidos.');
            responder(res, 200, { tipo: 'cliente', id: user.id, nome: user.nome });
          });
        });
        return;
      }

      return recusar(res, 400, 'Tipo inválido.');
    });
  }

  // ============================================================
  // CADASTRO FUNCIONÁRIO
  // ============================================================
  if (ehApi && recurso === 'cadastro-funcionario' && metodo === 'POST') {
    return lerDados(req, function (d) {
      if (!d.nome || !d.email || !d.funcao || !d.senha || !d.codigo_autorizacao) {
        return recusar(res, 400, 'Preencha todos os campos obrigatórios.');
      }
      if (d.codigo_autorizacao !== CODIGO_MESTRE) {
        return recusar(res, 403, 'Código de autorização inválido.');
      }

      db.get('SELECT id FROM funcionario WHERE email = ?', [d.email], function (erro, existente) {
        if (erro) return recusar(res, 500, erro.message);
        if (existente) return recusar(res, 400, 'E-mail já cadastrado.');

        bcrypt.hash(d.senha, 10, function (errHash, hash) {
          if (errHash) return recusar(res, 500, 'Erro ao processar senha.');

          db.run('BEGIN IMMEDIATE');
          db.run('INSERT INTO codigos_utilizados (codigo) VALUES (?)', [d.codigo_autorizacao], function (errReserva) {
            if (errReserva) {
              db.run('ROLLBACK');
              return recusar(res, 403, 'Este código já foi utilizado no sistema.');
            }
            var sql = 'INSERT INTO funcionario (nome, email, funcao, senha, ativo, data_cadastro) VALUES (?, ?, ?, ?, 1, ?)';
            var val = [d.nome, d.email, d.funcao, hash, new Date().toISOString()];
            db.run(sql, val, function (errInsert) {
              if (errInsert) {
                db.run('ROLLBACK');
                return recusar(res, 400, errInsert.message);
              }
              db.run('COMMIT');
              responder(res, 201, { id: this.lastID, mensagem: 'Funcionário cadastrado com sucesso!' });
            });
          });
        });
      });
    });
  }

  // ============================================================
  // CADASTRO CLIENTE
  // ============================================================
  if (ehApi && recurso === 'cadastro-cliente' && metodo === 'POST') {
    return lerDados(req, function (d) {
      if (!d.nome || !d.cpf || !d.email || !d.senha) {
        return recusar(res, 400, 'Nome, CPF, e-mail e senha são obrigatórios.');
      }
      if (d.senha !== d.confirmar_senha) {
        return recusar(res, 400, 'As senhas não coincidem.');
      }

      db.get('SELECT id FROM cliente WHERE cpf = ?', [d.cpf], function (erro, porCpf) {
        if (erro) return recusar(res, 500, erro.message);
        if (porCpf) return recusar(res, 400, 'CPF já cadastrado.');

        db.get('SELECT id FROM cliente WHERE email = ?', [d.email], function (erro2, porEmail) {
          if (erro2) return recusar(res, 500, erro2.message);
          if (porEmail) return recusar(res, 400, 'E-mail já cadastrado.');

          bcrypt.hash(d.senha, 10, function (errHash, hash) {
            if (errHash) return recusar(res, 500, 'Erro ao processar senha.');

            var uf = d.uf || d.estado || 'AC';
            var sqlEnd = 'INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) VALUES (?, ?, ?, ?, ?, ?, ?)';
            var valEnd = [
              d.cep || '', d.endereco || 'Não informado', d.numero || '',
              d.complemento || '', d.bairro || '', d.cidade || 'Não informada', uf
            ];

            db.run(sqlEnd, valEnd, function (errEnd) {
              if (errEnd) return recusar(res, 400, 'Erro no endereço: ' + errEnd.message);
              var enderecoId = this.lastID;

              var sqlCli = 'INSERT INTO cliente (nome, cpf, email, telefone, endereco_id, data_cadastro, senha) VALUES (?, ?, ?, ?, ?, ?, ?)';
              var valCli = [d.nome, d.cpf, d.email, d.telefone || null, enderecoId, new Date().toISOString(), hash];

              db.run(sqlCli, valCli, function (errCli) {
                if (errCli) return recusar(res, 400, 'Erro no cliente: ' + errCli.message);
                responder(res, 201, { id: this.lastID, mensagem: 'Cliente cadastrado com sucesso!' });
              });
            });
          });
        });
      });
    });
  }

  // ============================================================
  // ARQUIVOS ESTÁTICOS
  // ============================================================
  if (!ehApi) {
    var rel = (url === '/') ? '/html/login.html' : url;
    var caminho = path.join(RAIZ, rel);
    if (!caminho.startsWith(RAIZ)) {
      res.writeHead(403); res.end('Acesso negado'); return;
    }
    return servirArquivo(res, caminho);
  }

  // ============================================================
  // 404 FINAL — só cai aqui se nada acima bateu
  // ============================================================
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, erro: 'Rota não encontrada: ' + metodo + ' ' + url }));
});

servidor.listen(PORTA, function () {
  console.log('Servidor rodando em http://localhost:' + PORTA);
});