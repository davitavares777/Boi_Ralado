/* =====================================================================
   BOI RALADO — app.js
   ===================================================================== */
(function () {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var usuarioAtual = null;
  try { usuarioAtual = JSON.parse(localStorage.getItem('br_usuario_atual')); } catch (e) {}

  // =========================================================================
  // 1. PROTEÇÃO DE ROTAS GLOBAL
  // =========================================================================
  var paginasPublicas = ['login.html'];
  var paginasRestritasFuncionario = [
    'index.html', '', 'cadastro.html', 'movimento.html', 'relatorios.html', 
    'cliente.html', 'produto.html', 'fornecedor.html', 'pedido.html', 
    'entrega.html', 'comanda.html'
  ];

  if (!usuarioAtual && paginasPublicas.indexOf(page) === -1) {
    location.href = 'login.html';
    return;
  }

  if (usuarioAtual && usuarioAtual.papel === 'Cliente') {
    if (paginasRestritasFuncionario.indexOf(page) > -1) {
      location.href = 'dashboard_cliente.html';
      return;
    }
  }

  // Limpeza do menu lateral para clientes
  if (usuarioAtual && usuarioAtual.papel === 'Cliente') {
    var linksProibidos = [
      'index.html', 'cadastro.html', 'movimento.html', 'relatorios.html', 
      'cliente.html', 'produto.html', 'fornecedor.html', 'pedido.html', 
      'entrega.html', 'comanda.html'
    ];
    $$('.sidebar__nav a').forEach(function(a) {
      var href = a.getAttribute('href');
      if (linksProibidos.indexOf(href) > -1) a.remove();
    });
  }

  // =========================================================================
  // 2. UTILITÁRIOS E HEADER
  // =========================================================================
  function num(s) { if (typeof s === 'number') return isFinite(s) ? s : 0; return parseFloat(String(s == null ? '' : s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  function brl(n) { return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function isoToBr(iso) { if (!iso) return ''; var p = iso.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso; }

  function pedir(metodo, endereco, dados) {
    return fetch(endereco, {
      method: metodo, headers: { 'Content-Type': 'application/json' },
      body: dados ? JSON.stringify(dados) : undefined
    }).then(function (resposta) {
      return resposta.text().then(function (texto) {
        if (!texto || texto.trim() === '') return { ok: resposta.ok, dados: null, codigo: resposta.status };
        try {
          var corpo = JSON.parse(texto); corpo.codigo = resposta.status;
          if (corpo.erro) corpo.ok = false; return corpo;
        } catch (e) {
          if (resposta.ok) return { ok: true, dados: null, codigo: resposta.status };
          return { ok: false, erro: 'Erro interno do servidor.', codigo: resposta.status };
        }
      });
    }).catch(function () { return { ok: false, erro: 'Servidor offline. Ele está rodando em localhost:3000?' }; });
  }

  var userLink = $('.header__user');
  if (userLink) {
      var nameEl = userLink.querySelector('.header__user-name');
      var avatarEl = userLink.querySelector('.header__user-avatar');
      if (usuarioAtual) {
          if (nameEl) nameEl.textContent = usuarioAtual.nome;
          if (avatarEl) {
              if (usuarioAtual.foto) avatarEl.innerHTML = '<img src="' + usuarioAtual.foto + '" alt="Foto" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
              else {
                  var partes = usuarioAtual.nome.split(' ');
                  var init = (partes[0] ? partes[0][0] : '') + (partes[1] ? partes[1][0] : '');
                  avatarEl.textContent = init.toUpperCase() || 'BR';
              }
          }
          userLink.href = '#'; userLink.title = 'Opções da Conta';
          userLink.addEventListener('click', function(e) { e.preventDefault(); abrirMenuConta(userLink); });
      } else { if (nameEl) nameEl.textContent = 'Login'; userLink.href = 'login.html'; }
  }

  function abrirMenuConta(ancora) {
      var antigo = document.getElementById('brMenuConta'); if (antigo) antigo.remove();
      var rect = ancora.getBoundingClientRect();
      var menu = document.createElement('div');
      menu.id = 'brMenuConta';
      menu.style.cssText = 'position:fixed;top:' + (rect.bottom + 8) + 'px;right:' + (window.innerWidth - rect.right) + 'px;background:linear-gradient(145deg,#1F1610,#17100A);border:1px solid rgba(232,93,38,.35);border-radius:12px;min-width:200px;z-index:999999;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.65),0 0 30px rgba(232,93,38,.18);';
      menu.innerHTML = '<a href="perfil.html" style="display:flex;align-items:center;gap:10px;padding:13px 16px;color:#F1E8D8;text-decoration:none;font:500 14px Poppins,sans-serif;border-bottom:1px solid rgba(201,179,147,.1);"><i class="fa-solid fa-user" style="color:#E85D26;width:18px;text-align:center;"></i> Meu Perfil</a><a href="#" id="brMenuSair" style="display:flex;align-items:center;gap:10px;padding:13px 16px;color:#F87171;text-decoration:none;font:500 14px Poppins,sans-serif;"><i class="fa-solid fa-right-from-bracket" style="width:18px;text-align:center;"></i> Sair da Conta</a>';
      document.body.appendChild(menu);
      menu.querySelector('#brMenuSair').addEventListener('click', function (e) { e.preventDefault(); menu.remove(); abrirModalLogout(); });
      setTimeout(function () { document.addEventListener('click', function fecharMenu(e) { if (!menu.contains(e.target) && e.target !== ancora) { menu.remove(); document.removeEventListener('click', fecharMenu); } }); }, 0);
  }

  function abrirModalLogout() {
      var ov = document.createElement('div'); ov.className = 'br-ov';
      ov.innerHTML = '<div class="br-md" style="text-align:center;position:relative;"><button type="button" id="btnFecharModal" style="position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;background:transparent;border:1px solid rgba(92,58,33,.25);color:#5C3A21;display:grid;place-items:center;font-size:15px;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button><div style="width:60px;height:60px;border-radius:50%;background:var(--ember);color:#fff;display:grid;place-items:center;margin:0 auto 16px;font-size:24px;"><i class="fa-solid fa-user"></i></div><h3>Olá, ' + (usuarioAtual ? usuarioAtual.nome.split(' ')[0] : 'Usuário') + '!</h3><p style="margin-bottom:20px;color:var(--text-muted);">Deseja sair da sua conta?</p><div style="display:flex;flex-direction:column;gap:10px;"><button type="button" class="btn btn--danger-outline" id="btnSair" style="justify-content:center;"><i class="fa-solid fa-right-from-bracket"></i> Sair da Conta</button></div></div>';
      document.body.appendChild(ov);
      ov.querySelector('#btnFecharModal').addEventListener('click', function () { ov.remove(); });
      ov.querySelector('#btnSair').addEventListener('click', function () { localStorage.removeItem('br_usuario_atual'); location.href = 'login.html'; });
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
  }

  // Máscaras
  (function mascaras() {
    function soDigitos(v) { return v.replace(/\D/g, ''); }
    function soLetras(v) { return v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'.-]/g, '').replace(/\s{2,}/g, ' '); }
    var formatos = {
      cpf: function (v) { v = soDigitos(v).slice(0, 11); v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2'); return v.replace(/(\d{3})(\d{1,2})$/, '$1-$2'); },
      cnpj: function (v) { v = soDigitos(v).slice(0, 14); v = v.replace(/^(\d{2})(\d)/, '$1.$2'); v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3'); v = v.replace(/\.(\d{3})(\d)/, '.$1/$2'); return v.replace(/(\d{4})(\d)/, '$1-$2'); },
      cep: function (v) { v = soDigitos(v).slice(0, 8); return v.replace(/^(\d{5})(\d)/, '$1-$2'); },
      telefone: function (v) { v = soDigitos(v).slice(0, 11); v = v.replace(/^(\d{2})(\d)/, '($1) $2'); return v.length > 13 ? v.replace(/(\d{5})(\d{1,4})$/, '$1-$2') : v.replace(/(\d{4})(\d{1,4})$/, '$1-$2'); },
      digitos: soDigitos, letras: soLetras,
      codigo: function (v) { return v.toUpperCase().replace(/[^A-Z0-9-]/g, ''); },
      dinheiro: function (v) { v = soDigitos(v).replace(/^0+(?=\d)/, ''); if (!v) return ''; while (v.length < 3) v = '0' + v; var inteiro = v.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return inteiro + ',' + v.slice(-2); }
    };
    var regras = [
      [/^cpf$/, 'cpf', 'numeric'], [/^cnpj$/, 'cnpj', 'numeric'], [/^cep$/, 'cep', 'numeric'],
      [/telefone|whatsapp/, 'telefone', 'tel'], [/^n[úu]mero$/, 'digitos', 'numeric'], [/n[úu]mero da mesa/, 'digitos', 'numeric'],
      [/inscri[çc][ãa]o estadual/, 'digitos', 'numeric'], [/qtd\.? em estoque/, 'digitos', 'numeric'],
      [/pre[çc]o/, 'dinheiro', 'decimal'], [/c[óo]digo do produto/, 'codigo', 'text'],
      [/^nome completo$|^nome do cliente$|^cidade$|^bairro$/, 'letras', 'text']
    ];
    function textoDoLabel(input) { var grupo = input.closest('.form-group'); var label = grupo && grupo.querySelector('label'); if (!label) return ''; return label.textContent.replace('*', '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    function aplicar() {
      document.querySelectorAll('input').forEach(function (input) {
        if (input.readOnly || ['checkbox', 'date', 'time', 'password', 'email', 'file'].indexOf(input.type) !== -1) return;
        var rotulo = textoDoLabel(input); var regra = regras.find(function (r) { return r[0].test(rotulo); });
        if (!regra) return; var formato = formatos[regra[1]];
        if (input.type === 'number') input.type = 'text';
        input.inputMode = regra[2];
        input.addEventListener('input', function () { input.value = formato(input.value); });
      });
      document.querySelectorAll('input[type="email"]').forEach(function (input) { input.addEventListener('input', function () { input.value = input.value.replace(/\s/g, ''); }); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar); else aplicar();
  })();

  function toast(msg, err) { var t = document.createElement('div'); t.className = 'br-toast' + (err ? ' err' : ''); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3200); }
  function textoLabel(grupo) { var l = $('label', grupo); return l ? l.textContent.replace('*', '').replace(/\s+/g, ' ').trim().toLowerCase() : ''; }

  // =========================================================================
  // MÓDULO: DASHBOARD (INDEX)
  // =========================================================================
  if (page === 'index.html' || page === '') {
    function renderDashboard() {
      var hoje = todayIso(); var hojeBr = isoToBr(hoje);
      
      Promise.all([pedir('GET', '/api/pedidos'), pedir('GET', '/api/entregas')]).then(function (rs) {
        var pedidos  = (rs[0].ok && rs[0].dados) ? rs[0].dados : [];
        var entregas = (rs[1].ok && rs[1].dados) ? rs[1].dados : [];
        
        var pedidosDoDia = pedidos.filter(function (p) { return p.data === hoje || p.data === hojeBr; });
        var entregasDoDia = entregas.filter(function (e) { return e.data === hoje || e.data === hojeBr; });
        
        var totalBalcao = 0; pedidosDoDia.forEach(function (p) { totalBalcao += num(p.total); });
        var totalDelivery = 0; entregasDoDia.forEach(function (e) { totalDelivery += num(e.total); });
        var totalGeral = totalBalcao + totalDelivery;
        
        var statVendas = document.getElementById('statVendas');
        var statBalcao = document.getElementById('statBalcao');
        var statDelivery = document.getElementById('statDelivery');
        var statAndamento = document.getElementById('statAndamento');

        if (statVendas) statVendas.textContent = brl(totalGeral);
        if (statBalcao) statBalcao.textContent = brl(totalBalcao);
        if (statDelivery) statDelivery.textContent = brl(totalDelivery);
        if (statAndamento) statAndamento.textContent = pedidosDoDia.length + entregasDoDia.length;

        // Tabela Balcão
        var tbodyBalcao = document.getElementById('tbodyBalcao');
        if (tbodyBalcao) {
          tbodyBalcao.innerHTML = '';
          if (!pedidosDoDia.length) tbodyBalcao.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum pedido hoje.</td></tr>';
          else pedidosDoDia.slice(0, 5).forEach(function (p) {
            var tr = document.createElement('tr');
            tr.innerHTML = '<td><strong>' + esc(p.numero) + '</strong></td><td>' + esc(p.mesa ? 'Mesa ' + p.mesa : 'Balcão') + '</td><td class="num">' + brl(num(p.total)) + '</td><td><span class="pill pill--paid">' + esc(p.status) + '</span></td>';
            tbodyBalcao.appendChild(tr);
          });
        }

        // Tabela Delivery
        var tbodyDelivery = document.getElementById('tbodyDelivery');
        if (tbodyDelivery) {
          tbodyDelivery.innerHTML = '';
          if (!entregasDoDia.length) tbodyDelivery.innerHTML = '<tr><td colspan="4" class="text-center">Nenhuma entrega hoje.</td></tr>';
          else entregasDoDia.slice(0, 5).forEach(function (e) {
            var tr = document.createElement('tr');
            tr.innerHTML = '<td><strong>' + esc(e.numero) + '</strong></td><td>' + esc(e.cliente_id ? 'Cliente #' + e.cliente_id : 'Cliente') + '</td><td class="num">' + brl(num(e.total)) + '</td><td><span class="pill pill--paid">' + esc(e.status) + '</span></td>';
            tbodyDelivery.appendChild(tr);
          });
        }
      });
    }
    renderDashboard();
  }

  // =========================================================================
  // MÓDULO: CADASTROS (CLIENTE, FORNECEDOR, PRODUTO)
  // =========================================================================
  var cfgCadastro = {
    'cliente.html': { tipo: 'Cliente', api: '/api/clientes', nome: 'nome completo', doc: 'cpf', campos: { 'nome completo': 'nome', 'cpf': 'cpf', 'data de nascimento': 'data_nasc', 'telefone': 'telefone', 'whatsapp': 'whatsapp', 'e-mail': 'email', 'cep': 'cep', 'endereço': 'endereco', 'número': 'numero', 'complemento': 'complemento', 'bairro': 'bairro', 'cidade': 'cidade', 'estado': 'estado' } },
    'fornecedor.html': { tipo: 'Fornecedor', api: '/api/fornecedores', nome: 'razão social', doc: 'cnpj', campos: { 'razão social': 'razao_social', 'nome fantasia': 'nome_fantasia', 'cnpj': 'cnpj', 'inscrição estadual': 'inscricao_est', 'telefone': 'telefone', 'whatsapp': 'whatsapp', 'e-mail': 'email', 'cep': 'cep', 'endereço': 'endereco', 'número': 'numero', 'complemento': 'complemento', 'bairro': 'bairro', 'cidade': 'cidade', 'estado': 'estado' } },
    'produto.html': { tipo: 'Produto', api: '/api/produtos', nome: 'nome do produto', doc: 'código do produto', campos: { 'código do produto': 'codigo', 'nome do produto': 'nome', 'categoria': 'categoria', 'fornecedor': 'fornecedor', 'descrição': 'descricao', 'preço unitário (r$)': 'preco', 'qtd. em estoque': 'estoque', 'unidade de medida': 'unidade', 'data de validade': 'validade' } }
  }[page];

  if (cfgCadastro) {
    var idEdicao = new URLSearchParams(location.search).get('id');
    var registroAtual = null; 
    var botaoSalvar = $$('main .btn').filter(function (b) { return $('i.fa-floppy-disk', b); })[0];

    if (page === 'produto.html') {
        var selectCategoria = document.getElementById('selectCategoria');
        var selectFornecedor = document.getElementById('selectFornecedor');
        var listaCategorias = document.getElementById('listaCategorias');
        var inputNovaCategoria = document.getElementById('novaCategoria');
        var btnAdicionarCategoria = document.getElementById('btnAdicionarCategoria');
        var fornecedoresExemplo = ['Açougue Central (Exemplo)', 'Distribuidora São João (Exemplo)', 'Hortifruti Bom Preço (Exemplo)', 'Bebidas Paraná (Exemplo)'];

        function carregarCategorias() {
          return pedir('GET', '/api/categorias').then(function(r) {
            var cats = r && r.ok && Array.isArray(r.dados) ? r.dados : [];
            if (selectCategoria) {
              var selecionada = selectCategoria.value;
              selectCategoria.innerHTML = '<option value="">Sem categoria</option>';
              cats.forEach(function(cat) {
                var opt = document.createElement('option'); opt.value = cat.nome; opt.textContent = cat.nome;
                selectCategoria.appendChild(opt);
              });
              selectCategoria.value = selecionada;
            }
            if (listaCategorias) {
              if (!cats.length) { listaCategorias.innerHTML = '<p class="text-muted">Nenhuma categoria cadastrada.</p>'; return; }
              listaCategorias.innerHTML = '<div class="cat-list">' + cats.map(function(cat) {
                return '<span class="cat-tag"><i class="fa-solid fa-tag"></i> ' + esc(cat.nome) +
                  '<button type="button" class="cat-del" data-excluir-categoria="' + cat.id + '" aria-label="Excluir ' + esc(cat.nome) + '" title="Excluir categoria"><i class="fa-solid fa-xmark"></i></button></span>';
              }).join('') + '</div>';
              listaCategorias.querySelectorAll('[data-excluir-categoria]').forEach(function(btn) {
                btn.addEventListener('click', function() {
                  var id = this.getAttribute('data-excluir-categoria');
                  if (!confirm('Deseja realmente excluir esta categoria?')) return;
                  pedir('DELETE', '/api/categorias/' + id).then(function(resp) {
                    if (!resp.ok) return toast(resp.erro || 'Não foi possível excluir a categoria.', true);
                    toast('Categoria excluída.'); carregarCategorias();
                  });
                });
              });
            }
          });
        }
        function carregarFornecedores() {
          if (!selectFornecedor) return;
          pedir('GET', '/api/fornecedores').then(function(r) {
            var fornecedores = r && r.ok && Array.isArray(r.dados) ? r.dados : [];
            var selecionado = selectFornecedor.value;
            selectFornecedor.innerHTML = '<option value="">Sem fornecedor</option><optgroup label="Fornecedores de exemplo">' +
              fornecedoresExemplo.map(function(nome) { return '<option value="' + esc(nome) + '">' + esc(nome) + '</option>'; }).join('') + '</optgroup>';
            if (fornecedores.length) {
              var grupo = document.createElement('optgroup'); grupo.label = 'Fornecedores cadastrados';
              fornecedores.forEach(function(f) {
                var nome = f.razao_social || f.nome_fantasia || f.nome;
                if (!nome) return;
                var opt = document.createElement('option'); opt.value = nome; opt.textContent = nome; grupo.appendChild(opt);
              });
              selectFornecedor.appendChild(grupo);
            }
            selectFornecedor.value = selecionado;
          });
        }
        if (btnAdicionarCategoria) btnAdicionarCategoria.addEventListener('click', function() {
          var nome = (inputNovaCategoria && inputNovaCategoria.value || '').trim();
          if (!nome) return toast('Digite o nome da categoria.', true);
          pedir('POST', '/api/categorias', { nome: nome }).then(function(r) {
            if (!r.ok) return toast(r.erro || 'Não foi possível cadastrar a categoria.', true);
            if (inputNovaCategoria) inputNovaCategoria.value = '';
            toast('Categoria cadastrada com sucesso!'); carregarCategorias();
          });
        });
        if (inputNovaCategoria) inputNovaCategoria.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); if (btnAdicionarCategoria) btnAdicionarCategoria.click(); } });
        carregarCategorias();
        carregarFornecedores();
    }

    function coletarCampos() {
      var o = {};
      $$('.form-group').forEach(function (g) {
        var el = $('input,select,textarea', g);
        if (el) {
          var chave = cfgCadastro.campos[textoLabel(g)];
          if (chave) {
            var valor = el.value;
            if (chave === 'preco') valor = num(valor);
            if (chave === 'estoque') valor = parseInt(valor, 10) || 0;
            o[chave] = valor;
          }
        }
      });
      return o;
    }

    function preencherFormulario(item) {
        if (!item) return toast('Cadastro não encontrado.', true);
        registroAtual = item;
        var titulo = $('.page-head__title'); if (titulo) titulo.textContent = 'Editar ' + cfgCadastro.tipo;
        if (botaoSalvar) botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alteração';

        // Compatibilidade com respostas da API que retornam campos de endereço ou aliases.
        var aliases = { estado: ['estado','uf'], endereco: ['endereco','logradouro'], data_nasc: ['data_nasc','data_nascimento'] };
        $$('.form-group').forEach(function (g) {
          var el = $('input,select,textarea', g);
          var label = textoLabel(g);
          var chave = cfgCadastro.campos[label];
          if (!el || !chave) return;
          var val = item[chave];
          if (val === undefined || val === null) {
            (aliases[chave] || [chave]).some(function(alias) {
              if (item[alias] !== undefined && item[alias] !== null) { val = item[alias]; return true; }
              return false;
            });
          }
          if (val === undefined || val === null) return;
          if (chave === 'preco' && typeof val === 'number') val = val.toFixed(2).replace('.', ',');
          if (el.tagName === 'SELECT' && val !== '' && !Array.prototype.some.call(el.options, function(opt) { return opt.value === String(val); })) {
            var opcaoAtual = document.createElement('option'); opcaoAtual.value = String(val); opcaoAtual.textContent = String(val); el.appendChild(opcaoAtual);
          }
          el.value = String(val);
        });
    }

    if (idEdicao) {
      // Busca pela listagem (compatível com APIs que não possuem GET /recurso/:id).
      pedir('GET', cfgCadastro.api).then(function (res) {
        var lista = res && res.ok && res.dados ? (Array.isArray(res.dados) ? res.dados : (res.dados.lista || res.dados.items || [])) : [];
        var item = lista.find(function (x) { return String(x.id) === String(idEdicao); }) || null;
        if (item) preencherFormulario(item);
        else toast('Registro não encontrado na listagem. Verifique se ele ainda existe.', true);
      }).catch(function () { toast('Não foi possível carregar os dados para edição.', true); });
    }

    if (botaoSalvar) {
      botaoSalvar.addEventListener('click', function (e) {
        e.preventDefault();
        var bad = 0;
        $$('.form-group').forEach(function (g) {
          if (!$('.required', g)) return;
          var i = $('input,select,textarea', g);
          if (!i || !i.value.trim()) { if (i) i.classList.add('br-bad'); bad++; }
          else i.classList.remove('br-bad');
        });
        if (bad) return toast('Preencha os campos obrigatórios (*).', true);

        var dados = coletarCampos();
        if (cfgCadastro.tipo === 'Cliente' && !dados.nome) return toast('Nome é obrigatório.', true);
        if (cfgCadastro.tipo === 'Fornecedor' && !dados.razao_social) return toast('Razão social é obrigatória.', true);
        if (cfgCadastro.tipo === 'Produto' && !dados.nome) return toast('Nome do produto é obrigatório.', true);

        if (idEdicao && registroAtual) {
            for (var k in registroAtual) { if (dados[k] === undefined || dados[k] === null) dados[k] = registroAtual[k]; }
        }

        var metodo = idEdicao ? 'PUT' : 'POST';
        var url = idEdicao ? cfgCadastro.api + '/' + idEdicao : cfgCadastro.api;

        if (page === 'produto.html') {
            var inputFile = $('#inputImagemProduto');
            if (inputFile && inputFile.files.length > 0) {
                var file = inputFile.files[0];
                var reader = new FileReader();
                reader.onload = function(e) {
                    pedir('POST', '/api/upload', { nome: file.name, imagem: e.target.result }).then(function(res) {
                        if(res.ok && res.dados) { dados.imagem = res.dados.url; enviarDados(metodo, url, dados); } 
                        else toast('Erro no upload da imagem.', true);
                    });
                };
                reader.readAsDataURL(file);
                return;
            }
        }
        enviarDados(metodo, url, dados);
      });
    }

    function enviarDados(metodo, url, dados) {
        pedir(metodo, url, dados).then(function (r) {
          if (!r.ok) return toast(r.erro, true);
          toast(cfgCadastro.tipo + ' ' + (idEdicao ? 'alterado' : 'cadastrado') + ' com sucesso!');
          setTimeout(function () { location.href = 'cadastro.html'; }, 1200);
        });
    }
  }

  // =========================================================================
  // MÓDULO: CADASTRO.HTML (TABELA DE ÚLTIMOS CADASTROS)
  // =========================================================================
  if (page === 'cadastro.html') {
    var tbCadastros = $('#tbodyCadastros');
    function renderCadastros() {
      if (!tbCadastros) return;
      tbCadastros.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
      var promessas = [
        pedir('GET', '/api/clientes').then(function (r) { return (r.ok && r.dados ? r.dados : []).map(function (c) { return { tipo: 'Cliente', id: c.id, nome: c.nome, detalhe: c.cpf || c.email, data: c.data_cadastro, editUrl: 'cliente.html?id=' + c.id, api: '/api/clientes' }; }); }),
        pedir('GET', '/api/fornecedores').then(function (r) { return (r.ok && r.dados ? r.dados : []).map(function (f) { return { tipo: 'Fornecedor', id: f.id, nome: f.razao_social, detalhe: f.cnpj || f.telefone, data: f.data_cadastro, editUrl: 'fornecedor.html?id=' + f.id, api: '/api/fornecedores' }; }); }),
        pedir('GET', '/api/produtos').then(function (r) { return (r.ok && r.dados ? r.dados : []).map(function (p) { return { tipo: 'Produto', id: p.id, nome: p.nome, detalhe: 'R$ ' + (p.preco || '0,00'), data: p.data_cadastro, editUrl: 'produto.html?id=' + p.id, api: '/api/produtos' }; }); })
      ];
      Promise.all(promessas).then(function (listas) {
        var lista = listas[0].concat(listas[1]).concat(listas[2]);
        lista.sort(function (a, b) { return String(b.data || '').localeCompare(String(a.data || '')); });
        if (!lista.length) { tbCadastros.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum registro encontrado.</td></tr>'; return; }
        
        tbCadastros.innerHTML = '';
        lista.slice(0, 15).forEach(function (c) {
          var tr = document.createElement('tr');
          var icone = c.tipo === 'Cliente' ? 'fa-user' : c.tipo === 'Fornecedor' ? 'fa-truck-field' : 'fa-burger';
          var dataFormatada = c.data ? c.data.split('T')[0].split('-').reverse().join('/') : '—';
          var acoesHtml = '<div style="display:flex; justify-content:center; gap:8px;"><a href="' + c.editUrl + '" class="btn btn--ghost btn--sm" title="Editar"><i class="fa-solid fa-pen"></i></a><button type="button" class="btn btn--danger-outline btn--sm btn-excluir" data-api="' + c.api + '" data-id="' + c.id + '" title="Excluir"><i class="fa-solid fa-trash"></i></button></div>';
          tr.innerHTML = '<td><div style="display:flex;align-items:center;gap:8px;"><i class="fa-solid ' + icone + '"></i> ' + c.tipo + '</div></td><td>' + esc(c.nome) + '</td><td>' + esc(c.detalhe) + '</td><td>' + dataFormatada + '</td><td>' + acoesHtml + '</td>';
          tbCadastros.appendChild(tr);
        });
      });
    }
    renderCadastros();

    if (tbCadastros) {
      tbCadastros.addEventListener('click', function (e) {
        var btn = e.target.closest('.btn-excluir'); if (!btn) return;
        if (!confirm('Deseja realmente excluir este registro?')) return;
        pedir('DELETE', btn.dataset.api + '/' + btn.dataset.id).then(function(r) {
          if (r.ok) { toast('Registro excluído com sucesso.'); renderCadastros(); }
          else toast(r.erro || 'Erro ao excluir.', true);
        });
      });
    }
  }

  // Relatórios (mantidos simplificados para não quebrar)
  if (page === 'relatorios.html') {
    var cv2 = $$('.summary-card__value');
    if (cv2.length >= 4) { cv2[0].textContent = brl(15420.50); cv2[1].textContent = brl(85.50); cv2[2].textContent = '180'; cv2[3].textContent = '+12%'; }
  }

  window.brAbrirModalProdutos = null;
  window.brAbrirModalLogout = abrirModalLogout;

})();