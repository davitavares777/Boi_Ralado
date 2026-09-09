// endereco.js
// Conversa com a API /api/enderecos e desenha a tela.

const form = document.getElementById('loginForm');
const aviso = document.getElementById('aviso');
const corpoTabela = document.getElementById('corpoTabela');

// ---------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------

// Monta um objeto com os campos do formulario, lidos pelo atributo "name".
// Evitamos Object.fromEntries porque ele nao existe em navegadores antigos.
function lerFormulario(formulario) {
  const dados = {};
  const campos = new FormData(formulario);
  campos.forEach(function (valor, chave) {
    dados[chave] = valor;
  });
  return dados;
}

function mostrarAviso(texto, ehErro) {
  aviso.textContent = texto;
  aviso.className = ehErro ? 'erro' : '';
}

// ---------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------
form.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const dados = lerFormulario(form);

  fetch('/api/enderecos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
    .then(function (resposta) {
      // Guardamos o status porque ele se perde depois do .json()
      return resposta.json().then(function (corpo) {
        return { ok: resposta.ok, corpo: corpo };
      });
    })
    .then(function (resultado) {
      if (!resultado.ok) {
        mostrarAviso(resultado.corpo.erro, true);
        return;
      }
      mostrarAviso('Endereço ' + resultado.corpo.id + ' salvo.', false);
      form.reset();
      carregarEnderecos();
    })
    .catch(function (erro) {
      mostrarAviso('Falha na comunicação: ' + erro.message, true);
    });
});

// ---------------------------------------------------------------
// READ
// ---------------------------------------------------------------
function carregarEnderecos() {
  fetch('/api/enderecos')
    .then(function (resposta) {
      return resposta.json();
    })
    .then(function (lista) {
      desenharTabela(lista);
    })
    .catch(function (erro) {
      mostrarAviso('Falha ao carregar a lista: ' + erro.message, true);
    });
}

function desenharTabela(lista) {
  corpoTabela.innerHTML = '';

  if (lista.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.textContent = 'Nenhum endereço cadastrado ainda.';
    tr.appendChild(td);
    corpoTabela.appendChild(tr);
    return;
  }

  lista.forEach(function (endereco) {
    const tr = document.createElement('tr');

    const colunas = [
      endereco.id,
      endereco.email,
      endereco.senha

    
    ];

    colunas.forEach(function (valor) {
      const td = document.createElement('td');
      // textContent, e nao innerHTML: assim um endereco com "<" ou ">"
      // aparece como texto em vez de virar marcacao.
      td.textContent = (valor === null ? '' : valor);
      tr.appendChild(td);
    });

    const tdBotao = document.createElement('td');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = 'Excluir';
    botao.addEventListener('click', function () {
      excluirEndereco(endereco.id);
    });
    tdBotao.appendChild(botao);
    tr.appendChild(tdBotao);

    corpoTabela.appendChild(tr);
  });
}

// ---------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------
function excluirEndereco(id) {
  fetch('/api/enderecos/' + id, { method: 'DELETE' })
    .then(function () {
      mostrarAviso('Endereço ' + id + ' removido.', false);
      carregarEnderecos();
    })
    .catch(function (erro) {
      mostrarAviso('Falha ao remover: ' + erro.message, true);
    });
}

// Primeira carga, assim que a pagina abre.
carregarEnderecos();
