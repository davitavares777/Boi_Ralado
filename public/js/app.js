/* =====================================================================
   BOI RALADO — app.js (Integrado com API SQLite)
   ===================================================================== */
(function () {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // --- UTILITÁRIOS ---
  function num(s) {
    return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }
  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function isoToBr(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  // ===================================================================
  // FUNÇÃO CENTRAL DE COMUNICAÇÃO COM A API
  // ===================================================================
  function pedir(metodo, endereco, dados) {
    return fetch(endereco, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: dados ? JSON.stringify(dados) : undefined
    })
    .then(function (resposta) {
      return resposta.text().then(function (texto) {
        try {
          var corpo = JSON.parse(texto);
          corpo.codigo = resposta.status;
          if (corpo.erro) corpo.ok = false;
          return corpo;
        } catch (e) {
          return { ok: false, erro: 'Erro interno do servidor.', codigo: resposta.status };
        }
      });
    })
    .catch(function () {
      return { ok: false, erro: 'Servidor offline. Ele está rodando em localhost:3000?' };
    });
  }

  // --- CONTROLE DE ACESSO (LOGIN) ---
  var usuarioAtual = null;
  try { usuarioAtual = JSON.parse(localStorage.getItem('br_usuario_atual')); } catch(e) {}

  if (!usuarioAtual && page !== 'login.html') {
    location.href = 'login.html';
    return;
  }

  if (usuarioAtual && usuarioAtual.papel === 'Cliente') {
    var linksFuncionario = ['cadastro.html', 'movimento.html', 'relatorios.html', 'cliente.html', 'produto.html', 'fornecedor.html', 'pedido.html', 'entrega.html', 'comanda.html'];
    $$('.sidebar__nav a').forEach(function(a) {
        var href = a.getAttribute('href');
        if (linksFuncionario.indexOf(href) > -1) {
            a.style.display = 'none';
        }
    });
  }

  // Atualiza header com nome do usuário e modal de logout
  var userLink = $('.header__user');
  if (userLink) {
      var nameEl = userLink.querySelector('.header__user-name');
      var avatarEl = userLink.querySelector('.header__user-avatar');
      
      if (usuarioAtual) {
          if (nameEl) nameEl.textContent = usuarioAtual.nome;
          if (avatarEl) {
              var partes = usuarioAtual.nome.split(' ');
              var init = (partes[0] ? partes[0][0] : '') + (partes[1] ? partes[1][0] : '');
              avatarEl.textContent = init.toUpperCase() || 'BR';
          }
          userLink.href = '#';
          userLink.title = 'Opções da Conta';
          userLink.addEventListener('click', function(e) {
              e.preventDefault();
              abrirModalLogout();
          });
      } else {
          if (nameEl) nameEl.textContent = 'Login';
          userLink.href = 'login.html';
      }
  }

  function abrirModalLogout() {
      var ov = document.createElement('div');
      ov.className = 'br-ov';
      ov.innerHTML = 
        '<div class="br-md" style="text-align:center;">' +
            '<div style="width:60px;height:60px;border-radius:50%;background:var(--ember);color:#fff;display:grid;place-items:center;margin:0 auto 16px;font-size:24px;"><i class="fa-solid fa-user"></i></div>' +
            '<h3>Olá, ' + (usuarioAtual ? usuarioAtual.nome.split(' ')[0] : 'Usuário') + '!</h3>' +
            '<p style="margin-bottom:20px;color:var(--text-muted);">O que você deseja fazer?</p>' +
            '<div style="display:flex;flex-direction:column;gap:10px;">' +
                '<a href="login.html" class="btn btn--primary" style="justify-content:center;"><i class="fa-solid fa-right-to-bracket"></i> Mudar de Conta</a>' +
                '<button type="button" class="btn btn--danger-outline" id="btnSair" style="justify-content:center;"><i class="fa-solid fa-right-from-bracket"></i> Sair da Conta</button>' +
            '</div>' +
        '</div>';
      document.body.appendChild(ov);
      
      ov.querySelector('#btnSair').addEventListener('click', function() {
          localStorage.removeItem('br_usuario_atual');
          location.href = 'login.html';
      });
      
      ov.addEventListener('click', function(e) { if(e.target === ov) ov.remove(); });
  }

  /* ---------- MÁSCARAS ---------- */
  (function mascaras() {
    function soDigitos(v) { return v.replace(/\D/g, ''); }
    function soLetras(v) {
      return v.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'.-]/g, '').replace(/\s{2,}/g, ' ');
    }
    var formatos = {
      cpf: function (v) {
        v = soDigitos(v).slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2');
        return v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      },
      cnpj: function (v) {
        v = soDigitos(v).slice(0, 14);
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        return v.replace(/(\d{4})(\d)/, '$1-$2');
      },
      cep: function (v) {
        v = soDigitos(v).slice(0, 8);
        return v.replace(/^(\d{5})(\d)/, '$1-$2');
      },
      telefone: function (v) {
        v = soDigitos(v).slice(0, 11);
        v = v.replace(/^(\d{2})(\d)/, '($1) $2');
        return v.length > 13
          ? v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
          : v.replace(/(\d{4})(\d{1,4})$/, '$1-$2');
      },
      digitos: soDigitos,
      letras: soLetras,
      codigo: function (v) { return v.toUpperCase().replace(/[^A-Z0-9-]/g, ''); },
      dinheiro: function (v) {
        v = soDigitos(v).replace(/^0+(?=\d)/, '');
        if (!v) return '';
        while (v.length < 3) v = '0' + v;
        var inteiro = v.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return inteiro + ',' + v.slice(-2);
      }
    };
    var regras = [
      [/^cpf$/, 'cpf', 'numeric'],
      [/^cnpj$/, 'cnpj', 'numeric'],
      [/^cep$/, 'cep', 'numeric'],
      [/telefone|whatsapp/, 'telefone', 'tel'],
      [/^n[úu]mero$/, 'digitos', 'numeric'],
      [/n[úu]mero da mesa/, 'digitos', 'numeric'],
      [/inscri[çc][ãa]o estadual/, 'digitos', 'numeric'],
      [/qtd\.? em estoque/, 'digitos', 'numeric'],
      [/pre[çc]o/, 'dinheiro', 'decimal'],
      [/c[óo]digo do produto/, 'codigo', 'text'],
      [/^nome completo$|^nome do cliente$|^cidade$|^bairro$/, 'letras', 'text']
    ];
    function textoDoLabel(input) {
      var grupo = input.closest('.form-group');
      var label = grupo && grupo.querySelector('label');
      if (!label) return '';
      return label.textContent.replace('*', '').replace(/\s+/g, ' ').trim().toLowerCase();
    }
    function aplicar() {
      document.querySelectorAll('input').forEach(function (input) {
        if (input.readOnly || ['checkbox', 'date', 'time', 'password', 'email', 'file'].indexOf(input.type) !== -1) return;
        var rotulo = textoDoLabel(input);
        var regra = regras.find(function (r) { return r[0].test(rotulo); });
        if (!regra) return;
        var formato = formatos[regra[1]];
        if (input.type === 'number') input.type = 'text';
        input.inputMode = regra[2];
        input.addEventListener('input', function () { input.value = formato(input.value); });
      });
      document.querySelectorAll('input[type="email"]').forEach(function (input) {
        input.addEventListener('input', function () { input.value = input.value.replace(/\s/g, ''); });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicar);
    else aplicar();
  })();

  /* ---------- UI ---------- */
  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'br-toast' + (err ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function textoLabel(grupo) {
    var l = $('label', grupo);
    return l ? l.textContent.replace('*', '').replace(/\s+/g, ' ').trim().toLowerCase() : '';
  }
  function fld(t) {
    var g = $$('.form-group').filter(function (g) {
      var l = $('label', g);
      return l && l.textContent.trim().toLowerCase().indexOf(t.toLowerCase()) === 0;
    })[0];
    return g && $('input,select,textarea', g);
  }
  function tbodyRows() { return $$('.data-table tbody tr'); }
  function lastNum(r) { return num(r.cells[r.cells.length - 1].textContent); }

  var IMGS_PADRAO = 'img/produtos/placeholder.jpg';
  function imagemDoProduto(prod) {
      if (prod.imagem) return prod.imagem;
      var mapa = {
        'Boi Ralado Tradicional':  'img/produtos/boi-ralado.jpg',
        'Hambúrguer Boi Ralado':   'img/produtos/hamburguer.jpg',
        'Pastel de Boi Ralado':    'img/produtos/pastel.jpg',
        'Picanha na Chapa':        'img/produtos/picanha.jpg',
        'Prato Executivo da Casa': 'img/produtos/executivo.jpg',
        'Batata Rústica':          'img/produtos/batata.jpg',
        'Suco de Laranja':         'img/produtos/suco.jpg',
        'Mousse de Maracujá':      'img/produtos/mousse.webp'
      };
      return mapa[prod.nome] || IMGS_PADRAO;
  }

  // =========================================================
  // MODAL DE PRODUTOS (Busca da API)
  // =========================================================
  function abrirModalProdutos(onAdicionar) {
    pedir('GET', '/api/produtos').then(function (r) {
      if (!r.ok) return toast(r.erro, true);
      var produtos = r.dados || [];

      var ov = document.createElement('div');
      ov.className = 'br-ov';
      var md = document.createElement('div');
      md.className = 'br-md br-md--produtos';

      var html = '<h3>Consultar itens</h3>';

      if (!produtos.length) {
        html +=
          '<div class="br-vazio">' +
            '<i class="fa-solid fa-burger"></i>' +
            '<p>Nenhum produto cadastrado ainda. Cadastre um produto para poder adicioná-lo.</p>' +
            '<a href="produto.html" class="btn btn--primary"><i class="fa-solid fa-plus"></i> Cadastrar produto</a>' +
          '</div>';
        md.innerHTML = html;

        var actsV = document.createElement('div'); actsV.className = 'acts';
        var fecharV = document.createElement('button');
        fecharV.type = 'button'; fecharV.className = 'btn btn--outline'; fecharV.textContent = 'Fechar';
        fecharV.addEventListener('click', function () { ov.remove(); });
        actsV.appendChild(fecharV); md.appendChild(actsV);
        ov.appendChild(md); document.body.appendChild(ov);
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
        return;
      }

      html +=
        '<div class="br-tabela">' +
          '<table>' +
            '<thead><tr>' +
              '<th style="width:60px"></th>' +
              '<th>Produto</th>' +
              '<th class="num" style="width:110px">Preço</th>' +
              '<th style="width:120px">Estoque</th>' +
              '<th style="width:50px"></th>' +
            '</tr></thead><tbody>';

      produtos.forEach(function (p, i) {
        var preco = num(p.preco);
        var imgUrl = imagemDoProduto(p);
        html +=
          '<tr data-idx="' + i + '">' +
            '<td><div class="br-prod-img"><img src="' + imgUrl + '" alt="' + esc(p.nome) + '"></div></td>' +
            '<td><span class="br-prod-nome">' + esc(p.nome) + '</span></td>' +
            '<td class="num">' + brl(preco) + '</td>' +
            '<td><small class="br-prod-estoque">' + (p.estoque || 0) + ' un</small></td>' +
            '<td><span class="br-add-ico"><i class="fa-solid fa-plus"></i></span></td>' +
          '</tr>';
      });

      html += '</tbody></table></div>';
      md.innerHTML = html;

      var acts = document.createElement('div'); acts.className = 'acts';
      var fechar = document.createElement('button');
      fechar.type = 'button'; fechar.className = 'btn btn--outline'; fechar.textContent = 'Fechar';
      fechar.addEventListener('click', function () { ov.remove(); });
      acts.appendChild(fechar); md.appendChild(acts);

      md.querySelectorAll('tbody tr').forEach(function (tr) {
        tr.addEventListener('click', function () {
          var idx = parseInt(tr.dataset.idx, 10);
          var p = produtos[idx];
          if (!p) return;
          onAdicionar(p.nome, num(p.preco));
          var ico = tr.querySelector('.br-add-ico');
          if (ico) {
            ico.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(function () { ico.innerHTML = '<i class="fa-solid fa-plus"></i>'; }, 600);
          }
        });
      });

      ov.appendChild(md); document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
      });
    });
  }

  /* =========================================================
     MÓDULOS POR PÁGINA
     ========================================================= */

  /* Busca topo (agora no aside) */
  (function buscaTopo() {
    var wrap = $('.sidebar__search-wrap');
    var input = $('#topSearch');
    var results = $('#topSearchResults');
    if (!wrap || !input || !results) return;

    function buscar(q) {
      q = q.toLowerCase().trim();
      if (!q) { results.style.display = 'none'; results.innerHTML = ''; return; }

      var achados = [];
      var promessas = [
        pedir('GET', '/api/clientes').then(function (r) {
          if (r.ok) r.dados.forEach(function (c) {
            if ((c.nome || '').toLowerCase().indexOf(q) > -1 || (c.cpf || '').indexOf(q) > -1) {
              achados.push({ icone: 'fa-user', texto: 'Cliente: ' + c.nome, href: 'cliente.html?id=' + c.id });
            }
          });
        }),
        pedir('GET', '/api/fornecedores').then(function (r) {
          if (r.ok) r.dados.forEach(function (f) {
            if ((f.razao_social || '').toLowerCase().indexOf(q) > -1 || (f.cnpj || '').indexOf(q) > -1) {
              achados.push({ icone: 'fa-truck-field', texto: 'Fornecedor: ' + f.razao_social, href: 'fornecedor.html?id=' + f.id });
            }
          });
        }),
        pedir('GET', '/api/produtos').then(function (r) {
          if (r.ok) r.dados.forEach(function (p) {
            if ((p.nome || '').toLowerCase().indexOf(q) > -1 || (p.codigo || '').indexOf(q) > -1) {
              achados.push({ icone: 'fa-burger', texto: 'Produto: ' + p.nome, href: 'produto.html?id=' + p.id });
            }
          });
        })
      ];

      Promise.all(promessas).then(function () {
        if (!achados.length) results.innerHTML = '<div class="empty">Nenhum resultado para "' + esc(q) + '"</div>';
        else results.innerHTML = achados.slice(0, 8).map(function (a) {
          return '<a href="' + esc(a.href) + '"><i class="fa-solid ' + a.icone + '"></i> ' + esc(a.texto) + '</a>';
        }).join('');
        results.style.display = 'block';
      });
    }

    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var val = this.value;
      timer = setTimeout(function () { buscar(val); }, 300);
    });
    input.addEventListener('focus', function () { if (this.value) buscar(this.value); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) results.style.display = 'none'; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { results.style.display = 'none'; input.blur(); }
    });
  })();

  var PAGINA_DO_TIPO = { Cliente: 'cliente.html', Fornecedor: 'fornecedor.html', Produto: 'produto.html' };

  /* Dashboard */
  if (page === 'index.html' || page === '') {
    function renderDashboard() {
      var pedidos = store.get('pedidos');
      var entregas = store.get('entregas');
      var hoje = todayIso();
      var pedidosDoDia = pedidos.filter(function (p) { return p.data === hoje || p.data === isoToBr(hoje); });
      var entregasDoDia = entregas.filter(function (e) { return e.data === hoje || e.data === isoToBr(hoje); });

      var totalVendas = 0;
      pedidosDoDia.forEach(function (p) { totalVendas += num(p.total); });
      entregasDoDia.forEach(function (e) { totalVendas += num(e.total); });

      var statValues = $$('.stat-card__value');
      if (statValues.length >= 4 && totalVendas > 0) {
        statValues[0].textContent = brl(totalVendas);
        statValues[1].textContent = pedidosDoDia.length;
        statValues[2].textContent = entregasDoDia.length;
        statValues[3].textContent = pedidosDoDia.length + entregasDoDia.length;
      }

      var tb = $('.data-table tbody');
      if (!tb) return;
      tb.innerHTML = '';
      var lista = pedidosDoDia.concat(entregasDoDia).slice(0, 10);
      if (!lista.length) return;
      lista.forEach(function (item) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><strong>' + esc(item.numero || item.pedido || '#000') + '</strong></td>' +
          '<td>' + esc(item.cliente || 'Não informado') + '</td>' +
          '<td>' + esc(item.mesa ? 'Mesa ' + item.mesa : '—') + '</td>' +
          '<td>' + (item.endereco ? 'Delivery' : 'Balcão') + '</td>' +
          '<td class="num">' + brl(num(item.total)) + '</td>' +
          '<td><span class="pill pill--paid">' + esc(item.status || 'Pago') + '</span></td>' +
          '<td>' + esc(item.hora || '12:00') + '</td>';
        tb.appendChild(tr);
      });
    }
    renderDashboard();
  }

  /* =========================================================
     CADASTROS (Cliente, Fornecedor, Produto)
     ========================================================= */
  var cfgCadastro = {
    'cliente.html': {
      tipo: 'Cliente',
      api: '/api/clientes',
      nome: 'nome completo',
      doc: 'cpf',
      campos: {
        'nome completo': 'nome',
        'cpf': 'cpf',
        'data de nascimento': 'data_nasc',
        'telefone': 'telefone',
        'e-mail': 'email',
        'whatsapp': 'whatsapp'
      }
    },
    'fornecedor.html': {
      tipo: 'Fornecedor',
      api: '/api/fornecedores',
      nome: 'razão social',
      doc: 'cnpj',
      campos: {
        'razão social': 'razao_social',
        'nome fantasia': 'nome_fantasia',
        'cnpj': 'cnpj',
        'inscrição estadual': 'inscricao_est',
        'telefone': 'telefone',
        'e-mail': 'email'
      }
    },
    'produto.html': {
      tipo: 'Produto',
      api: '/api/produtos',
      nome: 'nome do produto',
      doc: 'código do produto',
      campos: {
        'código do produto': 'codigo',
        'nome do produto': 'nome',
        'categoria': 'categoria',
        'fornecedor': 'fornecedor',
        'descrição': 'descricao',
        'preço unitário (r$)': 'preco',
        'qtd. em estoque': 'estoque',
        'unidade de medida': 'unidade',
        'data de validade': 'validade'
      }
    }
  }[page];

  if (cfgCadastro) {
    var idEdicao = new URLSearchParams(location.search).get('id');
    var botaoSalvar = $$('main .btn').filter(function (b) { return $('i.fa-floppy-disk', b); })[0];

    // --- POPULAR SELECTS DE CATEGORIA E FORNECEDOR ---
    if (page === 'produto.html') {
        var selectCategoria = $$('.form-group').filter(function(g) { return textoLabel(g) === 'categoria'; })[0].querySelector('select');
        var selectFornecedor = $$('.form-group').filter(function(g) { return textoLabel(g) === 'fornecedor'; })[0].querySelector('select');

        pedir('GET', '/api/categorias').then(function(r) {
            if(r.ok && r.dados) {
                r.dados.forEach(function(cat) {
                    var opt = document.createElement('option');
                    opt.value = cat.nome;
                    opt.textContent = cat.nome;
                    selectCategoria.appendChild(opt);
                });
            }
        });

        pedir('GET', '/api/fornecedores').then(function(r) {
            if(r.ok && r.dados) {
                r.dados.forEach(function(forn) {
                    var opt = document.createElement('option');
                    opt.value = forn.razao_social;
                    opt.textContent = forn.razao_social;
                    selectFornecedor.appendChild(opt);
                });
            }
        });
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

    // Carregar dados para edição
    if (idEdicao) {
      pedir('GET', cfgCadastro.api + '/' + idEdicao).then(function (r) {
        if (!r.ok) return toast(r.erro, true);
        var item = r.dados;
        if (!item) return toast('Cadastro não encontrado.', true);

        var titulo = $('.page-head__title');
        if (titulo) titulo.textContent = 'Editar ' + cfgCadastro.tipo;
        if (botaoSalvar) botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alteração';

        $$('.form-group').forEach(function (g) {
          var el = $('input,select,textarea', g);
          var chave = cfgCadastro.campos[textoLabel(g)];
          if (el && chave && item[chave] !== undefined && item[chave] !== null) {
            el.value = item[chave];
          }
        });
      });
    }

    // Salvar (POST ou PUT)
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

        // Validação mínima
        if (cfgCadastro.tipo === 'Cliente' && !dados.nome) return toast('Nome é obrigatório.', true);
        if (cfgCadastro.tipo === 'Fornecedor' && !dados.razao_social) return toast('Razão social é obrigatória.', true);
        if (cfgCadastro.tipo === 'Produto' && !dados.nome) return toast('Nome do produto é obrigatório.', true);

        var metodo = idEdicao ? 'PUT' : 'POST';
        var url = idEdicao ? cfgCadastro.api + '/' + idEdicao : cfgCadastro.api;

        // Se for produto, faz o upload da imagem primeiro
        if (page === 'produto.html') {
            var inputFile = $('#inputImagemProduto');
            if (inputFile && inputFile.files.length > 0) {
                var file = inputFile.files[0];
                var reader = new FileReader();
                reader.onload = function(e) {
                    var base64 = e.target.result;
                    pedir('POST', '/api/upload', { nome: file.name, imagem: base64 }).then(function(res) {
                        if(res.ok) {
                            dados.imagem = res.dados.url;
                            enviarDados(metodo, url, dados);
                        } else {
                            toast('Erro ao fazer upload da imagem.', true);
                        }
                    });
                };
                reader.readAsDataURL(file);
                return; // Espera o upload terminar
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

  /* =========================================================
     LISTA DE CADASTROS (Card "Últimos Cadastros" Refatorado)
     ========================================================= */
  if (page === 'cadastro.html') {
    var tbCadastros = $('.data-table tbody');

    function renderCadastros() {
      if (!tbCadastros) return;
      tbCadastros.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

      var promessas = [
        pedir('GET', '/api/clientes').then(function (r) {
          return (r.ok ? r.dados : []).map(function (c) {
            return { tipo: 'Cliente', id: c.id, nome: c.nome, info: c.cpf || '—', contato: c.email || c.telefone, data: c.data_cadastro };
          });
        }),
        pedir('GET', '/api/fornecedores').then(function (r) {
          return (r.ok ? r.dados : []).map(function (f) {
            return { tipo: 'Fornecedor', id: f.id, nome: f.razao_social, info: f.cnpj || '—', contato: f.email || f.telefone, data: f.data_cadastro };
          });
        }),
        pedir('GET', '/api/produtos').then(function (r) {
          return (r.ok ? r.dados : []).map(function (p) {
            return { tipo: 'Produto', id: p.id, nome: p.nome, info: 'Estoque: ' + (p.estoque || 0) + ' un', contato: p.categoria || '—', data: p.data_cadastro };
          });
        })
      ];

      Promise.all(promessas).then(function (listas) {
        var lista = listas[0].concat(listas[1]).concat(listas[2]);
        lista.sort(function (a, b) { return String(b.id).localeCompare(String(a.id)); });

        if (!lista.length) {
          tbCadastros.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum cadastro realizado ainda.</td></tr>';
          return;
        }

        tbCadastros.innerHTML = '';
        lista.forEach(function (c) {
          var tr = document.createElement('tr');
          tr.dataset.id = c.id;
          tr.dataset.tipo = c.tipo;
          
          var icone = '';
          var cor = '';
          if (c.tipo === 'Cliente') { icone = 'fa-user'; cor = 'var(--ember-light)'; }
          else if (c.tipo === 'Fornecedor') { icone = 'fa-truck-field'; cor = 'var(--ink-300)'; }
          else { icone = 'fa-burger'; cor = 'var(--ink-400)'; }

          var dataFormatada = c.data ? c.data.split('T')[0].split('-').reverse().join('/') : '—';

          tr.innerHTML =
            '<td><div style="display:flex;align-items:center;gap:8px;"><i class="fa-solid ' + icone + '" style="color:' + cor + ';"></i> ' + c.tipo + '</div></td>' +
            '<td>' + esc(c.nome) + '</td>' +
            '<td>' + esc(c.info) + '</td>' +
            '<td>' + esc(c.contato) + '</td>' +
            '<td>' + dataFormatada + '</td>' +
            '<td class="row-actions">' +
            '  <button title="Editar" class="btnEditCad"><i class="fa-solid fa-pen"></i></button>' +
            '  <button title="Excluir" class="danger btnDelCad"><i class="fa-solid fa-trash"></i></button>' +
            '</td>';
          tbCadastros.appendChild(tr);
        });
      });
    }

    renderCadastros();

    if (tbCadastros) {
      tbCadastros.addEventListener('click', function (e) {
        var btnEdit = e.target.closest('.btnEditCad');
        var btnDel = e.target.closest('.btnDelCad');
        var tr = e.target.closest('tr');
        if (!tr || !tr.dataset.id) return;
        var id = tr.dataset.id;
        var tipo = tr.dataset.tipo;
        var nome = tr.cells[1].textContent;

        var apis = { Cliente: '/api/clientes', Fornecedor: '/api/fornecedores', Produto: '/api/produtos' };

        if (btnDel) {
          if (confirm('Deseja realmente remover "' + nome + '"?')) {
            pedir('DELETE', apis[tipo] + '/' + id).then(function (r) {
              if (!r.ok) return toast(r.erro, true);
              toast('Cadastro removido com sucesso.');
              renderCadastros();
            });
          }
        } else if (btnEdit) {
          location.href = (PAGINA_DO_TIPO[tipo] || 'cadastro.html') + '?id=' + encodeURIComponent(id);
        }
      });
    }
  }

  /* =========================================================
     PEDIDO — quantidade editável (A função abrirModalProdutos já faz o trabalho)
     ========================================================= */
  if (page === 'pedido.html') {
      // A lógica de adicionar item já é tratada pelo app.js global
  }

  /* =========================================================
     ENTREGA — sem clonagem de botões
     ========================================================= */
  if (page === 'entrega.html') {
    // Lógica própria do entrega.html
  }

  /* Relatório balcão */
  if (page === 'relatorio_balcao.html') {
    var inputData = $('#inputDataBalcao');
    var btnConsultar = $('#btnConsultarBalcao');
    if (inputData) inputData.value = todayIso();
    
    function popularDadosExemplo() {
        var hoje = todayIso();
        var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
        var ontemIso = ontem.toISOString().split('T')[0];
        
        var exemplos = [
            { numero: '#C1001', cliente: 'João', total: 150.00, data: hoje, hora: '12:30', status: 'Pago' },
            { numero: '#C1002', cliente: 'Maria', total: 85.50, data: hoje, hora: '13:00', status: 'Pago' },
            { numero: '#C1003', cliente: 'Pedro', total: 120.00, data: ontemIso, hora: '12:15', status: 'Pago' },
            { numero: '#C1004', cliente: 'Ana', total: 45.00, data: ontemIso, hora: '13:45', status: 'Pago' }
        ];
        localStorage.setItem('br_relatorio_balcao', JSON.stringify(exemplos));
    }
    if (!localStorage.getItem('br_relatorio_balcao')) {
        popularDadosExemplo();
    }

    function carregarRelatorioBalcao(dataIso) {
      var dataBr = isoToBr(dataIso);
      var todosDados = JSON.parse(localStorage.getItem('br_relatorio_balcao')) || [];
      var pedidosDoDia = todosDados.filter(function (p) { return p.data === dataIso || p.data === dataBr; });
      
      var totalValor = 0;
      var tb = $('#tabelaRelatorioBalcao tbody');
      if (tb) tb.innerHTML = '';
      if ($('#pillDataBalcao')) $('#pillDataBalcao').textContent = dataBr;
      
      if (!pedidosDoDia.length) {
        if (tb) tb.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma venda de balcão nesta data.</td></tr>';
        if ($('#totalGeralBalcao')) $('#totalGeralBalcao').textContent = brl(0);
        if ($('#totalQtdBalcao')) $('#totalQtdBalcao').textContent = '0';
        return;
      }
      pedidosDoDia.forEach(function (p) {
        var v = num(p.total); totalValor += v;
        if (tb) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + esc(p.hora || '12:00') + '</td>' +
            '<td>' + esc(p.mesa ? 'Mesa ' + p.mesa : 'Balcão') + '</td>' +
            '<td>' + esc(p.cliente || 'Cliente') + '</td>' +
            '<td class="num">' + brl(v) + '</td>' +
            '<td><span class="pill pill--paid">' + esc(p.status || 'Pago') + '</span></td>';
          tb.appendChild(tr);
        }
      });
      if ($('#totalGeralBalcao')) $('#totalGeralBalcao').textContent = brl(totalValor);
      if ($('#totalQtdBalcao')) $('#totalQtdBalcao').textContent = pedidosDoDia.length;
    }
    if (btnConsultar && inputData) {
      btnConsultar.addEventListener('click', function () {
        carregarRelatorioBalcao(inputData.value);
        toast('Relatório atualizado para ' + isoToBr(inputData.value));
      });
    }
    carregarRelatorioBalcao(todayIso());
  }

  /* Relatório delivery */
  if (page === 'relatorio_delivery.html') {
    var tbDel = $('.data-table tbody');
    var dtDel = $('.filter-bar input[type=date]');
    if (dtDel && !dtDel.value) dtDel.value = todayIso();

    function popularDadosDelivery() {
        var hoje = todayIso();
        var ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
        var ontemIso = ontem.toISOString().split('T')[0];
        
        var exemplos = [
            { numero: '#D1001', cliente: 'Carlos', endereco: 'Rua A, 10', total: 75.00, data: hoje, hora: '19:00', status: 'Entregue', pagamento: 'PIX' },
            { numero: '#D1002', cliente: 'Julia', endereco: 'Rua B, 20', total: 55.00, data: hoje, hora: '19:30', status: 'Entregue', pagamento: 'Cartão' },
            { numero: '#D1003', cliente: 'Marcos', endereco: 'Rua C, 30', total: 90.00, data: ontemIso, hora: '20:00', status: 'Entregue', pagamento: 'Dinheiro' }
        ];
        localStorage.setItem('br_relatorio_delivery', JSON.stringify(exemplos));
    }
    if (!localStorage.getItem('br_relatorio_delivery')) {
        popularDadosDelivery();
    }

    function desenharDelivery() {
      if (!tbDel) return;
      var dataIso = dtDel && dtDel.value ? dtDel.value : todayIso();
      var dataBr = isoToBr(dataIso);
      
      var todosDados = JSON.parse(localStorage.getItem('br_relatorio_delivery')) || [];
      var lista = todosDados.filter(function (e) { return e.data === dataIso || e.data === dataBr; });
      
      var tot = 0, taxa = 0, pg = { Dinheiro: 0, 'Cartão': 0, PIX: 0 };
      tbDel.innerHTML = '';
      if (!lista.length) {
        tbDel.innerHTML = '<tr><td colspan="9" class="text-center">Nenhuma entrega nesta data.</td></tr>';
      } else {
        lista.forEach(function (e) {
          var t = num(e.total); tot += t; taxa += e.taxa || 0;
          pg[e.pagamento] = (pg[e.pagamento] || 0) + t;
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td><strong>' + esc(e.numero) + '</strong></td>' +
            '<td>' + esc(e.hora || '') + '</td>' +
            '<td>' + esc(e.cliente) + '</td>' +
            '<td>' + esc(e.endereco) + '</td>' +
            '<td>' + esc(e.pagamento || '—') + '</td>' +
            '<td class="num">' + brl(e.taxa || 0) + '</td>' +
            '<td class="num">' + brl(e.subtotal || 0) + '</td>' +
            '<td class="num">' + brl(t) + '</td>' +
            '<td><span class="pill pill--paid">' + esc(e.status || 'Entregue') + '</span></td>';
          tbDel.appendChild(tr);
        });
      }
      var cv = $$('.total-cell__value');
      [brl(tot), lista.length, brl(pg.Dinheiro), brl(pg['Cartão']), brl(pg.PIX), brl(taxa)]
        .forEach(function (x, i) { if (cv[i]) cv[i].textContent = x; });
    }
    if (tbDel) {
      desenharDelivery();
      var bc = $('.filter-bar .btn--primary');
      if (bc) bc.addEventListener('click', desenharDelivery);
    }
  }

  /* Resumo relatórios */
  if (page === 'relatorios.html') {
    var cv2 = $$('.summary-card__value');
    if (cv2.length >= 4) {
        cv2[0].textContent = brl(15420.50);
        cv2[1].textContent = brl(85.50);
        cv2[2].textContent = '180';
        cv2[3].textContent = '+12%';
    }
  }

})();