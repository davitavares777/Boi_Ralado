/* =====================================================================
   BOI RALADO — app.js (Integrado com API SQLite)
   ===================================================================== */
(function () {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* =========================================================
     INJETA ESTILOS DO MODAL DE PRODUTOS
     ========================================================= */
  (function injetarEstilosModal() {
    if (document.getElementById('br-modal-produtos-style')) return;
    var style = document.createElement('style');
    style.id = 'br-modal-produtos-style';
    style.textContent = `
      .br-ov {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.55);
        backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        z-index: 9998; padding: 20px;
      }
      .br-md.br-md--produtos {
        width: min(1100px, 96vw) !important;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        padding: 22px !important;
        background: linear-gradient(145deg, #1F1610, #17100A) !important;
        border: 1px solid rgba(232, 93, 38, 0.45) !important;
        color: #F1E8D8 !important;
        box-shadow: 0 20px 50px rgba(0,0,0,.65), 0 0 60px rgba(232,93,38,.2) !important;
        border-radius: 14px !important;
      }
      .br-md.br-md--produtos h3 {
        color: #F1E8D8 !important;
        font-family: 'Playfair Display', serif !important;
        padding-bottom: 12px !important;
        border-bottom: 1px solid rgba(201,179,147,.12) !important;
        margin-bottom: 12px !important;
      }
      .br-md.br-md--produtos .br-tabela {
        flex: 1;
        overflow: auto;
        border-radius: 10px;
        border: 1px solid rgba(232, 93, 38, 0.25) !important;
        background: #120C08 !important;
        max-height: 55vh;
      }
      .br-md.br-md--produtos .br-tabela::-webkit-scrollbar { width: 10px; height: 10px; }
      .br-md.br-md--produtos .br-tabela::-webkit-scrollbar-thumb { background: rgba(232,93,38,.45); border-radius: 5px; }
      .br-md.br-md--produtos table {
        width: 100%; min-width: 640px;
        border-collapse: collapse; font-size: 13.5px;
      }
      .br-md.br-md--produtos thead th {
        padding: 11px 14px; text-align: left;
        font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.4px;
        color: #A89078 !important;
        background: #1F1610 !important;
        font-weight: 600;
        position: sticky; top: 0; z-index: 1;
        border-bottom: 1px solid rgba(232,93,38,.25) !important;
      }
      .br-md.br-md--produtos tbody td {
        padding: 10px 14px;
        border-top: 1px solid rgba(201,179,147,.12) !important;
        color: #F1E8D8 !important;
        vertical-align: middle;
        white-space: nowrap;
        background: #120C08 !important;
      }
      .br-md.br-md--produtos tbody td.num {
        text-align: right; font-variant-numeric: tabular-nums;
        color: #FF7A3D !important; font-weight: 600;
      }
      .br-md.br-md--produtos tbody tr { cursor: pointer; transition: background .15s; }
      .br-md.br-md--produtos tbody tr:hover td { background: rgba(232,93,38,.12) !important; }
      .br-md.br-md--produtos .br-prod-img {
        width: 48px; height: 48px; border-radius: 8px; overflow: hidden;
        background: radial-gradient(circle, rgba(232,93,38,.2), #120C08 70%);
        display: grid; place-items: center; flex-shrink: 0;
      }
      .br-md.br-md--produtos .br-prod-img img {
        width: 48px; height: 48px; object-fit: cover; display: block;
      }
      .br-md.br-md--produtos .br-prod-nome {
        display: block; font-weight: 600; color: #F1E8D8 !important; line-height: 1.25;
        max-width: 230px; overflow: hidden; text-overflow: ellipsis;
      }
      .br-md.br-md--produtos .br-prod-estoque {
        display: block; font-size: 11px; color: #A89078 !important; margin-top: 2px;
      }
      .br-md.br-md--produtos .br-add-ico {
        width: 32px; height: 32px; border-radius: 50%;
        display: grid; place-items: center;
        background: linear-gradient(135deg, #E85D26, #7A1010) !important;
        color: #fff !important; font-size: 13px;
        box-shadow: 0 4px 14px rgba(232,93,38,.5);
        transition: transform .15s;
      }
      .br-md.br-md--produtos tbody tr:hover .br-add-ico { transform: scale(1.1); }
      .br-md.br-md--produtos .acts {
        margin-top: 14px !important; padding-top: 12px;
        border-top: 1px solid rgba(201,179,147,.12) !important;
        display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;
      }
      .br-md.br-md--produtos .br-vazio {
        padding: 40px 16px; text-align: center; color: #A89078 !important;
        display: flex; flex-direction: column; align-items: center; gap: 12px;
      }
      .br-md.br-md--produtos .br-vazio i { font-size: 40px; color: #FF7A3D !important; opacity: .6; }
      .br-md.br-md--produtos .br-vazio p { margin: 0; color: #A89078; }
    `;
    document.head.appendChild(style);
  })();

  var store = {
    get:    function (k) { try { return JSON.parse(localStorage.getItem('br_' + k)) || []; } catch (e) { return []; } },
    set:    function (k, v) { try { localStorage.setItem('br_' + k, JSON.stringify(v)); } catch (e) {} },
    getObj: function (k, def) { try { return JSON.parse(localStorage.getItem('br_' + k)) || def; } catch (e) { return def; } },
    setObj: function (k, v) { try { localStorage.setItem('br_' + k, JSON.stringify(v)); } catch (e) {} }
  };

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
      return { ok: false, erro: 'Servidor offline. Ele está rodando em localhost:5000?' };
    });
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
        if (input.readOnly || ['checkbox', 'date', 'time', 'password', 'email'].indexOf(input.type) !== -1) return;
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

  function atualizarUsuarioHeader() {
    var usuario = store.getObj('usuario_atual', { nome: 'João Silva', papel: 'Gerente' });
    var nameEl = $('.header__user-name');
    var avatarEl = $('.header__user-avatar');
    if (nameEl) nameEl.textContent = usuario.nome;
    if (avatarEl) {
      var partes = usuario.nome.split(' ');
      var init = (partes[0] ? partes[0][0] : '') + (partes[1] ? partes[1][0] : '');
      avatarEl.textContent = init.toUpperCase() || 'BR';
    }
  }
  atualizarUsuarioHeader();

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

  /* =========================================================
     IMAGENS E PRODUTOS DO MOSTRUÁRIO (fallback)
     ========================================================= */
  var IMGS_PRODUTOS = {
    'Boi Ralado Tradicional':  'img/produtos/boi-ralado.jpg',
    'Hambúrguer Boi Ralado':   'img/produtos/hamburguer.jpg',
    'Pastel de Boi Ralado':    'img/produtos/pastel.jpg',
    'Picanha na Chapa':        'img/produtos/picanha.jpg',
    'Prato Executivo da Casa': 'img/produtos/executivo.jpg',
    'Batata Rústica':          'img/produtos/batata.jpg',
    'Suco de Laranja':         'img/produtos/suco.jpg',
    'Mousse de Maracujá':      'img/produtos/mousse.jpg'
  };
  var IMG_PADRAO = 'img/produtos/placeholder.jpg';
  function imagemDoProduto(nome) { return IMGS_PRODUTOS[nome] || IMG_PADRAO; }

  var PRODUTOS_MOSTRUARIO = [
    { nome: 'Boi Ralado Tradicional',  preco: 34.90, img: IMGS_PRODUTOS['Boi Ralado Tradicional'], estoque: 50 },
    { nome: 'Hambúrguer Boi Ralado',   preco: 32.00, img: IMGS_PRODUTOS['Hambúrguer Boi Ralado'], estoque: 40 },
    { nome: 'Pastel de Boi Ralado',    preco: 14.00, img: IMGS_PRODUTOS['Pastel de Boi Ralado'], estoque: 80 },
    { nome: 'Picanha na Chapa',        preco: 68.90, img: IMGS_PRODUTOS['Picanha na Chapa'], estoque: 25 },
    { nome: 'Prato Executivo da Casa', preco: 29.90, img: IMGS_PRODUTOS['Prato Executivo da Casa'], estoque: 60 },
    { nome: 'Batata Rústica',          preco: 24.90, img: IMGS_PRODUTOS['Batata Rústica'], estoque: 90 },
    { nome: 'Suco de Laranja',         preco: 9.00,  img: IMGS_PRODUTOS['Suco de Laranja'], estoque: 100 },
    { nome: 'Mousse de Maracujá',      preco: 12.00, img: IMGS_PRODUTOS['Mousse de Maracujá'], estoque: 45 }
  ];

  /* =========================================================
     MODAL DE PRODUTOS (API + MOSTRUÁRIO)
     ========================================================= */
  function abrirModalProdutos(onAdicionar) {
    pedir('GET', '/api/produtos').then(function (r) {
      if (!r.ok) return toast(r.erro || 'Erro ao carregar produtos.', true);
      var produtosApi = (r.dados || []);

      var nomesApi = {};
      produtosApi.forEach(function (p) { nomesApi[(p.nome || '').toLowerCase()] = true; });

      var produtosMostruario = PRODUTOS_MOSTRUARIO.filter(function (p) {
        return !nomesApi[p.nome.toLowerCase()];
      });

      var produtosApiFormatados = produtosApi.map(function (p) {
        return {
          nome: p.nome,
          preco: Number(p.preco) || 0,
          img: imagemDoProduto(p.nome),
          estoque: p.estoque || 0,
          id: p.id
        };
      });

      var produtos = produtosApiFormatados.concat(produtosMostruario);

      if (!produtos.length) {
        var ovVazio = document.createElement('div');
        ovVazio.className = 'br-ov';
        ovVazio.innerHTML =
          '<div class="br-md br-md--produtos">' +
            '<h3>Consultar itens do cardápio</h3>' +
            '<div class="br-vazio">' +
              '<i class="fa-solid fa-burger"></i>' +
              '<p>Nenhum produto cadastrado ainda.</p>' +
              '<a href="produto.html" class="btn btn--primary"><i class="fa-solid fa-plus"></i> Cadastrar produto</a>' +
            '</div>' +
            '<div class="acts"><button type="button" class="btn btn--outline" id="fecharVazio">Fechar</button></div>' +
          '</div>';
        document.body.appendChild(ovVazio);
        ovVazio.querySelector('#fecharVazio').addEventListener('click', function () { ovVazio.remove(); });
        ovVazio.addEventListener('click', function (e) { if (e.target === ovVazio) ovVazio.remove(); });
        return;
      }

      var ov = document.createElement('div');
      ov.className = 'br-ov';
      var md = document.createElement('div');
      md.className = 'br-md br-md--produtos';

      var html = '<h3>Consultar itens do cardápio</h3>';
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
        html +=
          '<tr data-idx="' + i + '">' +
            '<td><div class="br-prod-img"><img src="' + p.img + '" alt="' + esc(p.nome) + '" onerror="this.style.display=\'none\'"></div></td>' +
            '<td><span class="br-prod-nome">' + esc(p.nome) + '</span></td>' +
            '<td class="num">' + brl(p.preco) + '</td>' +
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
          onAdicionar(p.nome, num(p.preco), p.id);
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
     MODAL DE ÚLTIMOS PEDIDOS
     ========================================================= */
  function abrirModalPedidos() {
    Promise.all([
      pedir('GET', '/api/pedidos'),
      pedir('GET', '/api/entregas')
    ]).then(function (resultados) {
      var pedidos = (resultados[0].ok ? resultados[0].dados : []);
      var entregas = (resultados[1].ok ? resultados[1].dados : []);
      var lista = pedidos.concat(entregas);
      lista.sort(function (a, b) { return String(b.id || 0).localeCompare(String(a.id || 0)); });

      var ov = document.createElement('div'); ov.className = 'br-ov';
      var md = document.createElement('div'); md.className = 'br-md br-md--pedidos';
      var html = '<h3>Últimos Pedidos</h3>';

      if (!lista.length) {
        html +=
          '<div class="br-vazio">' +
            '<i class="fa-solid fa-receipt"></i>' +
            '<p>Nenhum pedido registrado ainda.</p>' +
            '<a href="pedido.html" class="btn btn--primary"><i class="fa-solid fa-plus"></i> Novo Pedido</a>' +
          '</div>';
        md.innerHTML = html;
        var actsV = document.createElement('div'); actsV.className = 'acts';
        var fecharV = document.createElement('button');
        fecharV.type = 'button'; fecharV.className = 'btn btn--outline'; fecharV.textContent = 'Fechar';
        fecharV.addEventListener('click', function () { ov.remove(); });
        actsV.appendChild(fecharV); md.appendChild(actsV);
        ov.appendChild(md); document.body.appendChild(ov);
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
        document.addEventListener('keydown', function esc(e) {
          if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
        });
        return;
      }

      html +=
        '<div class="br-pedidos-scroll"><table><thead><tr>' +
          '<th style="width:30px"></th><th>#</th><th>Cliente</th><th>Mesa / Tipo</th>' +
          '<th class="num">Valor</th><th>Status</th>' +
        '</tr></thead><tbody>';

      lista.forEach(function (item, i) {
        var isDel = !!item.pagamento;
        var numero = item.numero || ('#' + (1000 + i));
        var tipoTxt = item.mesa ? 'Mesa ' + item.mesa : (isDel ? 'Delivery' : 'Balcão');
        html +=
          '<tr data-idx="' + i + '">' +
            '<td><input type="checkbox" /></td>' +
            '<td><strong>' + esc(numero) + '</strong></td>' +
            '<td>' + esc(item.cliente || '—') + '</td>' +
            '<td><span class="br-pedido__tipo">' + esc(tipoTxt) + '</span></td>' +
            '<td class="num">' + brl(num(item.total)) + '</td>' +
            '<td><span class="pill pill--paid">' + esc(item.status || 'Pago') + '</span></td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
      md.innerHTML = html;

      var acts = document.createElement('div'); acts.className = 'acts';
      var fechar = document.createElement('button');
      fechar.type = 'button'; fechar.className = 'btn btn--outline'; fechar.textContent = 'Fechar';
      fechar.addEventListener('click', function () { ov.remove(); });
      acts.appendChild(fechar); md.appendChild(acts);

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

  /* Busca topo */
  (function buscaTopo() {
    var wrap = $('.top-search-wrap');
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
        }),
        pedir('GET', '/api/pedidos').then(function (r) {
          if (r.ok) r.dados.forEach(function (p) {
            if ((p.numero || '').toLowerCase().indexOf(q) > -1) {
              achados.push({ icone: 'fa-receipt', texto: 'Pedido ' + p.numero, href: 'pedido.html' });
            }
          });
        }),
        pedir('GET', '/api/entregas').then(function (r) {
          if (r.ok) r.dados.forEach(function (e) {
            if ((e.numero || '').toLowerCase().indexOf(q) > -1) {
              achados.push({ icone: 'fa-motorcycle', texto: 'Entrega ' + e.numero, href: 'entrega.html' });
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
      Promise.all([
        pedir('GET', '/api/pedidos'),
        pedir('GET', '/api/entregas')
      ]).then(function (resultados) {
        var pedidos = (resultados[0].ok ? resultados[0].dados : []);
        var entregas = (resultados[1].ok ? resultados[1].dados : []);
        var hoje = todayIso();

        var pedidosDoDia = pedidos.filter(function (p) { return p.data === hoje; });
        var entregasDoDia = entregas.filter(function (e) { return e.data === hoje; });

        var totalVendas = 0;
        pedidosDoDia.forEach(function (p) { totalVendas += num(p.total); });
        entregasDoDia.forEach(function (e) { totalVendas += num(e.total); });

        var statValues = $$('.stat-card__value');
        if (statValues.length >= 4) {
          statValues[0].textContent = brl(totalVendas);
          statValues[1].textContent = pedidosDoDia.length;
          statValues[2].textContent = entregasDoDia.length;
          statValues[3].textContent = pedidosDoDia.length + entregasDoDia.length;
        }

        var tb = $('.data-table tbody');
        if (!tb) return;
        tb.innerHTML = '';
        var lista = pedidosDoDia.concat(entregasDoDia).slice(0, 10);
        if (!lista.length) {
          tb.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum pedido hoje ainda.</td></tr>';
          return;
        }
        lista.forEach(function (item) {
          var isDel = !!item.pagamento;
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td><strong>' + esc(item.numero || '#000') + '</strong></td>' +
            '<td>' + esc(item.cliente || 'Não informado') + '</td>' +
            '<td>' + esc(item.mesa ? 'Mesa ' + item.mesa : '—') + '</td>' +
            '<td>' + (isDel ? 'Delivery' : 'Balcão') + '</td>' +
            '<td class="num">' + brl(num(item.total)) + '</td>' +
            '<td><span class="pill pill--paid">' + esc(item.status || 'Pago') + '</span></td>' +
            '<td>' + esc(item.hora || '12:00') + '</td>';
          tb.appendChild(tr);
        });
      });
    }
    renderDashboard();

    $$('.table-actions .btn, .btn').forEach(function (b) {
      if (/ver\s*todos/i.test(b.textContent)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) { e.preventDefault(); abrirModalPedidos(); });
      }
    });
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

    function coletarCampos() {
      var o = {};
      $$('.form-group').forEach(function (g) {
        var el = $('input,select,textarea', g);
        if (el) {
          var chave = cfgCadastro.campos[textoLabel(g)];
          if (chave) o[chave] = el.value;
        }
      });
      if (o.preco !== undefined && o.preco !== null) {
        var precoStr = String(o.preco).trim();
        if (precoStr.indexOf(',') > -1) precoStr = precoStr.replace(/\./g, '').replace(',', '.');
        o.preco = precoStr;
      }
      if (o.estoque !== undefined && o.estoque !== null) {
        o.estoque = String(o.estoque).replace(/\D/g, '') || '0';
      }
      return o;
    }

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
            if (chave === 'preco') {
              el.value = String(Number(item[chave]) || 0).replace('.', ',');
            } else {
              el.value = item[chave];
            }
          }
        });
      });
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

        var metodo = idEdicao ? 'PUT' : 'POST';
        var url = idEdicao ? cfgCadastro.api + '/' + idEdicao : cfgCadastro.api;

        pedir(metodo, url, dados).then(function (r) {
          if (!r.ok) return toast(r.erro, true);
          toast(cfgCadastro.tipo + ' ' + (idEdicao ? 'alterado' : 'cadastrado') + ' com sucesso!');
          setTimeout(function () { location.href = 'cadastro.html'; }, 1200);
        });
      });
    }
  }

  /* =========================================================
     LISTA DE CADASTROS (cadastro.html) — CORRIGIDO
     ========================================================= */
  if (page === 'cadastro.html') {
    var tbCadastros = $('.data-table tbody');

    var icones = {
      Cliente:    '<i class="fa-solid fa-user" style="color:var(--ember-light);"></i>',
      Fornecedor: '<i class="fa-solid fa-truck-field" style="color:var(--ink-300);"></i>',
      Produto:    '<i class="fa-solid fa-burger" style="color:var(--ink-400);"></i>'
    };

    function renderCadastros() {
      if (!tbCadastros) return;
      tbCadastros.innerHTML = '<tr><td colspan="6" class="text-center">Carregando...</td></tr>';

      var promessas = [
        pedir('GET', '/api/clientes').then(function (r) {
          return (r.ok ? r.dados : []).map(function (c) {
            return { tipo: 'Cliente', id: c.id, nome: c.nome, doc: c.cpf, contato: c.email || c.telefone, data: c.data_cadastro || '' };
          });
        }),
        pedir('GET', '/api/fornecedores').then(function (r) {
          return (r.ok ? r.dados : []).map(function (f) {
            return { tipo: 'Fornecedor', id: f.id, nome: f.razao_social, doc: f.cnpj, contato: f.email || f.telefone, data: f.data_cadastro || '' };
          });
        }),
        pedir('GET', '/api/produtos').then(function (r) {
          return (r.ok ? r.dados : []).map(function (p) {
            return { tipo: 'Produto', id: p.id, nome: p.nome, doc: p.codigo, contato: 'Estoque: ' + (p.estoque || 0) + ' un', data: p.data_cadastro || '' };
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
          tr.innerHTML =
            '<td>' + (icones[c.tipo] || '') + ' ' + esc(c.tipo) + '</td>' +
            '<td>' + esc(c.nome) + '</td>' +
            '<td>' + esc(c.doc || '—') + '</td>' +
            '<td>' + esc(c.contato || '—') + '</td>' +
            '<td>' + esc(c.data) + '</td>' +
            '<td class="row-actions">' +
            '  <button type="button" title="Editar" class="btnEditCad"><i class="fa-solid fa-pen"></i></button>' +
            '  <button type="button" title="Excluir" class="btnDelCad danger"><i class="fa-solid fa-trash"></i></button>' +
            '</td>';
          tbCadastros.appendChild(tr);
        });

        anexarListenersCadastros();
      });
    }

    function anexarListenersCadastros() {
      if (tbCadastros._brListener) {
        tbCadastros.removeEventListener('click', tbCadastros._brListener);
      }

      tbCadastros._brListener = function (e) {
        var btnEdit = e.target.closest('.btnEditCad');
        var btnDel = e.target.closest('.btnDelCad');
        if (!btnEdit && !btnDel) return;

        var tr = e.target.closest('tr');
        if (!tr) return;

        var id = tr.dataset.id;
        var tipo = tr.dataset.tipo;
        var nome = tr.cells[1].textContent;

        var apis = { Cliente: '/api/clientes', Fornecedor: '/api/fornecedores', Produto: '/api/produtos' };
        var paginas = { Cliente: 'cliente.html', Fornecedor: 'fornecedor.html', Produto: 'produto.html' };

        if (btnDel) {
          e.preventDefault();
          e.stopPropagation();
          if (confirm('Deseja realmente remover "' + nome + '"?')) {
            pedir('DELETE', apis[tipo] + '/' + id).then(function (r) {
              if (!r.ok) return toast(r.erro, true);
              toast('Cadastro removido com sucesso.');
              renderCadastros();
            });
          }
        } else if (btnEdit) {
          e.preventDefault();
          e.stopPropagation();
          var url = (paginas[tipo] || 'cadastro.html') + '?id=' + encodeURIComponent(id);
          location.href = url;
        }
      };

      tbCadastros.addEventListener('click', tbCadastros._brListener);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderCadastros);
    } else {
      renderCadastros();
    }
  }

  /* =========================================================
     PEDIDO — quantidade editável
     ========================================================= */
  if (page === 'pedido.html') {
    function recalcPedido() {
      var sub = 0;
      $$('.data-table tbody tr').forEach(function (r) {
        var qtdInp = r.querySelector('.qtd-input');
        if (qtdInp) {
          var q = parseInt(qtdInp.value, 10) || 1;
          var unitTxt = r.cells[4].textContent;
          var subtotal = q * num(unitTxt);
          r.cells[5].innerHTML = '<strong>' + brl(subtotal) + '</strong>';
          sub += subtotal;
        } else {
          sub += lastNum(r);
        }
      });
      var v = $$('.summary-card__value');
      if (v.length >= 2) {
        v[0].textContent = brl(sub);
        v[1].textContent = brl(sub);
      }
    }

    function adicionarLinhaPedido(nome, valorUnit, produtoId) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><input type="checkbox" /></td>' +
        '<td>' + esc(nome) + '</td>' +
        '<td class="num">' +
          '<input type="number" class="qtd-input" min="1" value="1" />' +
        '</td>' +
        '<td>—</td>' +
        '<td class="num">' + brl(valorUnit) + '</td>' +
        '<td class="num"><strong>' + brl(valorUnit) + '</strong></td>';
      tr.dataset.produtoId = produtoId || '';
      tr.dataset.nome = nome;
      tr.dataset.valorUnit = valorUnit;
      document.querySelector('.data-table tbody').appendChild(tr);

      var qtdInp = tr.querySelector('.qtd-input');
      if (qtdInp) {
        qtdInp.addEventListener('input', function () {
          if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
          recalcPedido();
        });
        qtdInp.addEventListener('blur', function () {
          if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
          recalcPedido();
        });
      }
      recalcPedido();
    }

    $$('main .btn').forEach(function (b) {
      if ($('i.fa-plus', b)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          abrirModalProdutos(function (nome, preco, produtoId) {
            adicionarLinhaPedido(nome, preco, produtoId);
            toast('"' + nome + '" adicionado.');
          });
        });
      }
    });

    $$('main .btn').forEach(function (b) {
      if ($('i.fa-trash', b)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          var sel = tbodyRows().filter(function (r) { return $('input[type=checkbox]:checked', r); });
          if (!sel.length) return toast('Marque os itens que deseja remover.', true);
          sel.forEach(function (r) { r.remove(); });
          recalcPedido();
          toast('Item(ns) removido(s).');
        });
      }
    });

    $$('main .btn').forEach(function (b) {
      if ($('i.fa-floppy-disk', b)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          var linhas = tbodyRows().filter(function (r) { return r.dataset.nome; });
          if (!linhas.length) return toast('Adicione ao menos um item.', true);

          var itens = linhas.map(function (r) {
            var qtd = parseInt(r.querySelector('.qtd-input').value, 10) || 1;
            var valorUnit = num(r.dataset.valorUnit);
            return {
              produto_id: r.dataset.produtoId ? Number(r.dataset.produtoId) : null,
              nome: r.dataset.nome,
              quantidade: qtd,
              valor_unit: valorUnit,
              subtotal: qtd * valorUnit
            };
          });

          var total = itens.reduce(function (s, i) { return s + i.subtotal; }, 0);

          var ped = {
            numero:  fld('número do pedido') ? fld('número do pedido').value : '#1088',
            mesa:    fld('número da mesa')   ? fld('número da mesa').value   : '',
            cliente: fld('nome do cliente')  ? fld('nome do cliente').value  : '',
            data: todayIso(),
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            subtotal: total,
            total: total,
            status: 'Pago',
            itens: itens
          };

          pedir('POST', '/api/pedidos', ped).then(function (r) {
            if (!r.ok) return toast(r.erro, true);
            toast('Pedido ' + ped.numero + ' salvo com sucesso!');
          });
        });
      }
    });
  }

  /* =========================================================
     ENTREGA — quantidade editável
     ========================================================= */
  if (page === 'entrega.html') {
    function recalcEntrega() {
      var sub = 0;
      $$('.data-table tbody tr').forEach(function (r) {
        var qtdInp = r.querySelector('.qtd-input');
        if (qtdInp) {
          var q = parseInt(qtdInp.value, 10) || 1;
          var unitTxt = r.cells[2].textContent;
          var subtotal = q * num(unitTxt);
          r.cells[3].innerHTML = '<strong>' + brl(subtotal) + '</strong>';
          sub += subtotal;
        } else {
          var cells = r.cells;
          if (cells.length >= 4) sub += num(cells[cells.length - 1].textContent);
        }
      });
      var forms = $$('form.form-card');
      var alvo = forms[1];
      if (!alvo) return;
      var inputs = alvo.querySelectorAll('input');
      if (inputs.length >= 2) {
        inputs[0].value = brl(sub);
        inputs[1].value = brl(sub);
      }
    }

    function adicionarLinhaEntrega(nome, valorUnit, produtoId) {
      var tb = document.querySelector('.data-table tbody');
      if (!tb) return;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(nome) + '</td>' +
        '<td class="num"><input type="number" class="qtd-input" min="1" value="1" /></td>' +
        '<td class="num">' + brl(valorUnit) + '</td>' +
        '<td class="num"><strong>' + brl(valorUnit) + '</strong></td>';
      tr.dataset.produtoId = produtoId || '';
      tr.dataset.nome = nome;
      tr.dataset.valorUnit = valorUnit;
      tb.appendChild(tr);

      var qtdInp = tr.querySelector('.qtd-input');
      if (qtdInp) {
        qtdInp.addEventListener('input', function () {
          if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
          recalcEntrega();
        });
        qtdInp.addEventListener('blur', function () {
          if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
          recalcEntrega();
        });
      }
      recalcEntrega();
    }

    $$('main .btn').forEach(function (b) {
      if ($('i.fa-plus', b)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          abrirModalProdutos(function (nome, preco, produtoId) {
            adicionarLinhaEntrega(nome, preco, produtoId);
            toast('"' + nome + '" adicionado.');
          });
        });
      }
    });

    $$('main .btn').forEach(function (b) {
      if ($('i.fa-paper-plane', b)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) {
          e.preventDefault();
          var linhas = tbodyRows().filter(function (r) { return r.dataset.nome; });
          if (!linhas.length) return toast('Adicione ao menos um item.', true);

          var itens = linhas.map(function (r) {
            var qtd = parseInt(r.querySelector('.qtd-input').value, 10) || 1;
            var valorUnit = num(r.dataset.valorUnit);
            return {
              produto_id: r.dataset.produtoId ? Number(r.dataset.produtoId) : null,
              nome: r.dataset.nome,
              quantidade: qtd,
              valor_unit: valorUnit,
              subtotal: qtd * valorUnit
            };
          });

          var total = itens.reduce(function (s, i) { return s + i.subtotal; }, 0);
          var pagamento = 'PIX';
          var selPag = $$('select');
          selPag.forEach(function (s) {
            if (s.options.length && s.options[0].textContent === 'Dinheiro') {
              pagamento = s.value;
            }
          });

          var ent = {
            numero: '#D' + String(Date.now()).slice(-4),
            cliente: fld('nome do cliente') ? fld('nome do cliente').value : '',
            endereco: fld('endereço de entrega') ? fld('endereço de entrega').value : '',
            data: todayIso(),
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            subtotal: total,
            taxa: 0,
            total: total,
            pagamento: pagamento,
            status: 'Entregue',
            itens: itens
          };

          pedir('POST', '/api/entregas', ent).then(function (r) {
            if (!r.ok) return toast(r.erro, true);
            toast('Entrega ' + ent.numero + ' registrada com sucesso!');
          });
        });
      }
    });

    var formsE = $$('form.form-card');
    if (formsE[1]) {
      var inputsTaxa = formsE[1].querySelectorAll('input');
      if (inputsTaxa[0]) inputsTaxa[0].addEventListener('input', recalcEntrega);
    }
  }

  /* Relatório balcão */
  if (page === 'relatorio_balcao.html') {
    var inputData = $('#inputDataBalcao');
    var btnConsultar = $('#btnConsultarBalcao');
    if (inputData) inputData.value = todayIso();
    function carregarRelatorioBalcao(dataIso) {
      var dataBr = isoToBr(dataIso);
      pedir('GET', '/api/pedidos').then(function (r) {
        if (!r.ok) return toast(r.erro, true);
        var pedidosDoDia = (r.dados || []).filter(function (p) { return p.data === dataIso; });
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
      });
    }
    if (btnConsultar && inputData) {
      btnConsultar.addEventListener('click', function () {
        carregarRelatorioBalcao(inputData.value);
        toast('Relatório atualizado para ' + isoToBr(inputData.value));
      });
    }
  }

  /* Relatório delivery */
  if (page === 'relatorio_delivery.html') {
    var tbDel = $('.data-table tbody');
    var dtDel = $('.filter-bar input[type=date]');
    if (dtDel && !dtDel.value) dtDel.value = todayIso();
    function desenharDelivery() {
      if (!tbDel) return;
      var dataIso = dtDel && dtDel.value ? dtDel.value : todayIso();
      var dataBr = isoToBr(dataIso);
      pedir('GET', '/api/entregas').then(function (r) {
        if (!r.ok) return toast(r.erro, true);
        var lista = (r.dados || []).filter(function (e) { return e.data === dataIso; });
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
      });
    }
    if (tbDel) {
      desenharDelivery();
      var bc = $('.filter-bar .btn--primary');
      if (bc) bc.addEventListener('click', desenharDelivery);
    }
  }

  /* Resumo relatórios */
  if (page === 'relatorios.html') {
    Promise.all([
      pedir('GET', '/api/pedidos'),
      pedir('GET', '/api/entregas')
    ]).then(function (resultados) {
      var all = (resultados[0].ok ? resultados[0].dados : []).concat(resultados[1].ok ? resultados[1].dados : []);
      var cv2 = $$('.summary-card__value');
      var sum = function (a) { return a.reduce(function (s, p) { return s + num(p.total); }, 0); };
      var total = sum(all);
      [brl(total), brl(all.length ? total / all.length : 0), all.length, '0%']
        .forEach(function (x, i) { if (cv2[i]) cv2[i].textContent = x; });
    });
  }

})();