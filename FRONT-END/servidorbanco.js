// servidor-banco.js
// Igual ao servidor.js, mas grava no SQLite em vez do dados.json.
// Antes de rodar:  npm install sqlite3

var http = require('http');
var fs = require('fs');
var path = require('path');
var db = require('./db');

var PORTA = 3000;

// ---------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------

function responderJson(res, status, conteudo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(conteudo));
}

var TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
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

// ---------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------

var servidor = http.createServer(function (req, res) {
  var caminho = req.url.split('?')[0];

  // ---- API: listar ----
  if (req.method === 'GET' && caminho === '/api/enderecos') {
    db.all('SELECT * FROM endereco ORDER BY id DESC', [], function (erro, linhas) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      responderJson(res, 200, linhas);
    });
    return;
  }

  // ---- API: cadastrar ----
  if (req.method === 'POST' && caminho === '/api/enderecos') {
    var texto = '';

    req.on('data', function (pedaco) {
      texto += pedaco;
    });

    req.on('end', function () {
      var novo;
      try {
        novo = JSON.parse(texto);
      } catch (erro) {
        return responderJson(res, 400, { erro: 'Dados invalidos.' });
      }

      if (!novo.logradouro || !novo.cidade || !novo.uf) {
        return responderJson(res, 400, { erro: 'Logradouro, cidade e UF sao obrigatorios.' });
      }

      var sql = 'INSERT INTO endereco (cep, logradouro, numero, complemento, bairro, cidade, uf) ' +
                'VALUES (?, ?, ?, ?, ?, ?, ?)';

      var valores = [novo.cep, novo.logradouro, novo.numero,
                     novo.complemento, novo.bairro, novo.cidade, novo.uf];

      // function() e nao arrow: so assim o this traz o lastID.
      db.run(sql, valores, function (erro) {
        if (erro) {
          return responderJson(res, 500, { erro: erro.message });
        }
        novo.id = this.lastID;
        console.log('Cadastrado no banco: id ' + novo.id + ' - ' + novo.logradouro);
        responderJson(res, 201, novo);
      });
    });

    return;
  }

  // ---- API: excluir ----
  if (req.method === 'DELETE' && caminho.indexOf('/api/enderecos/') === 0) {
    var id = caminho.split('/')[3];

    db.run('DELETE FROM endereco WHERE id = ?', [id], function (erro) {
      if (erro) {
        return responderJson(res, 500, { erro: erro.message });
      }
      if (this.changes === 0) {
        return responderJson(res, 404, { erro: 'Endereco nao encontrado.' });
      }
      console.log('Excluido do banco: id ' + id);
      responderJson(res, 200, { removido: Number(id) });
    });

    return;
  }

  // ---- Arquivos da pasta public ----
  if (req.method === 'GET') {
    return servirArquivo(res, caminho === '/' ? 'index.html' : caminho);
  }

  responderJson(res, 404, { erro: 'Nao encontrado.' });
});

servidor.on('error', function (erro) {
  if (erro.code === 'EADDRINUSE') {
    console.log('');
    console.log('A porta ' + PORTA + ' ja esta sendo usada.');
    console.log('Feche a outra janela do terminal e tente de novo.');
    return;
  }
  console.log('Erro: ' + erro.message);
});

servidor.listen(PORTA, function () {
  console.log('');
  console.log('  Pronto! Gravando em banco.db (SQLite).');
  console.log('');
  console.log('      http://localhost:' + PORTA);
  console.log('');
  console.log('  Para desligar, aperte Ctrl+C aqui nesta janela.');
  console.log('');
});
