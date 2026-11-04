/* =====================================================================
   BOI RALADO — app.js
   ===================================================================== */
(function () {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

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

  function modal(title, fields, ok) {
    var ov = document.createElement('div');
    ov.className = 'br-ov';
    var md = document.createElement('div');
    md.className = 'br-md';
    md.innerHTML = '<h3>' + esc(title) + '</h3>';
    var inputs = {};
    fields.forEach(function (f) {
      var lb = document.createElement('label');
      lb.textContent = f.l;
      var inp;
      if (f.type === 'select') {
        inp = document.createElement('select');
        (f.options || []).forEach(function (opt) {
          var o = document.createElement('option');
          o.value = typeof opt === 'object' ? opt.v : opt;
          o.textContent = typeof opt === 'object' ? opt.l : opt;
          if (o.value === f.v) o.selected = true;
          inp.appendChild(o);
        });
      } else {
        inp = document.createElement('input');
        inp.type = f.t || 'text';
        inp.value = f.v == null ? '' : f.v;
        if (f.t === 'number') inp.min = 1;
      }
      inputs[f.k] = inp;
      md.appendChild(lb);
      md.appendChild(inp);
    });
    var acts = document.createElement('div'); acts.className = 'acts';
    var c = document.createElement('button');
    c.type = 'button'; c.className = 'btn btn--outline'; c.textContent = 'Cancelar';
    var o = document.createElement('button');
    o.type = 'button'; o.className = 'btn btn--primary'; o.textContent = 'Confirmar';
    acts.appendChild(c); acts.appendChild(o);
    md.appendChild(acts); ov.appendChild(md); document.body.appendChild(ov);

    function fechar() { ov.remove(); }
    function confirmar() {
      var d = {};
      Object.keys(inputs).forEach(function (k) { d[k] = inputs[k].value.trim(); });
      if (ok(d) !== false) fechar();
    }
    c.addEventListener('click', fechar);
    o.addEventListener('click', confirmar);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    md.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') confirmar();
      if (e.key === 'Escape') fechar();
    });
    var first = md.querySelector('input, select');
    if (first) first.focus();
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

  /* =========================================================
     MODAL DE PRODUTOS
     ========================================================= */
  function abrirModalProdutos(onAdicionar) {
    var produtos = store.get('cadastros').filter(function (c) { return c.tipo === 'Produto'; });

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
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
      });
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
      var preco = num(p.valor);
      html +=
        '<tr data-idx="' + i + '">' +
          '<td><div class="br-prod-img"><img src="' + imagemDoProduto(p.nome) + '" alt="' + esc(p.nome) + '"></div></td>' +
          '<td><span class="br-prod-nome">' + esc(p.nome) + '</span></td>' +
          '<td class="num">' + brl(preco) + '</td>' +
          '<td><small class="br-prod-estoque">' + esc(p.contato || '—') + '</small></td>' +
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
        onAdicionar(p.nome, num(p.valor));
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
  }

  /* =========================================================
     MODAL DE ÚLTIMOS PEDIDOS
     ========================================================= */
  function abrirModalPedidos() {
    var pedidos = store.get('pedidos');
    var entregas = store.get('entregas');
    var lista = pedidos.concat(entregas);
    lista.sort(function (a, b) { return String(b.numero || '').localeCompare(String(a.numero || '')); });

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
      var isDel = !!item.endereco;
      var numero = item.numero || ('#' + (1000 + i));
      var tipoTxt = item.mesa ? 'Mesa ' + item.mesa : (isDel ? 'Delivery' : 'Balcão');
      var tipoCls = isDel ? 'br-pedido__tipo--del' : '';
      html +=
        '<tr data-idx="' + i + '">' +
          '<td><input type="checkbox" /></td>' +
          '<td><strong>' + esc(numero) + '</strong></td>' +
          '<td>' + esc(item.cliente || '—') + '</td>' +
          '<td><span class="br-pedido__tipo ' + tipoCls + '">' + esc(tipoTxt) + '</span></td>' +
          '<td class="num">' + brl(num(item.total)) + '</td>' +
          '<td><span class="pill pill--paid">' + esc(item.status || 'Pago') + '</span></td>' +
        '</tr>';
    });
    html += '</tbody></table></div>';
    html +=
      '<div class="br-pedidos-total">' +
        '<span>Selecionados: <b id="brSelCount">0</b></span>' +
        '<span>Total dos selecionados: <b id="brSelTotal">R$ 0,00</b></span>' +
      '</div>';
    md.innerHTML = html;

    var acts = document.createElement('div'); acts.className = 'acts';
    var fechar = document.createElement('button');
    fechar.type = 'button'; fechar.className = 'btn btn--outline'; fechar.textContent = 'Fechar';
    fechar.addEventListener('click', function () { ov.remove(); });
    var confirmar = document.createElement('button');
    confirmar.type = 'button'; confirmar.className = 'btn btn--primary';
    confirmar.innerHTML = '<i class="fa-solid fa-check"></i> Confirmar seleção';
    acts.appendChild(fechar); acts.appendChild(confirmar); md.appendChild(acts);

    var selCount = md.querySelector('#brSelCount');
    var selTotal = md.querySelector('#brSelTotal');
    function recalcular() {
      var n = 0, tot = 0;
      md.querySelectorAll('tbody tr').forEach(function (tr) {
        var chk = tr.querySelector('input[type=checkbox]');
        if (chk && chk.checked) {
          n++; tot += num(tr.cells[4].textContent);
          tr.classList.add('is-sel');
        } else tr.classList.remove('is-sel');
      });
      selCount.textContent = n;
      selTotal.textContent = brl(tot);
    }
    md.querySelectorAll('tbody tr').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.tagName === 'INPUT') { recalcular(); return; }
        var chk = tr.querySelector('input[type=checkbox]');
        if (chk) { chk.checked = !chk.checked; recalcular(); }
      });
    });
    confirmar.addEventListener('click', function () {
      var escolhidos = [];
      md.querySelectorAll('tbody tr').forEach(function (tr) {
        var chk = tr.querySelector('input[type=checkbox]');
        if (chk && chk.checked) escolhidos.push(tr.cells[1].textContent.trim());
      });
      if (!escolhidos.length) return toast('Selecione ao menos um pedido.', true);
      toast(escolhidos.length + ' pedido(s): ' + escolhidos.join(', '));
      ov.remove();
    });

    ov.appendChild(md); document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
    });
    recalcular();
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
    var PAGINA_DO_TIPO_LOCAL = { Cliente: 'cliente.html', Fornecedor: 'fornecedor.html', Produto: 'produto.html' };
    function buscar(q) {
      q = q.toLowerCase().trim();
      if (!q) { results.style.display = 'none'; results.innerHTML = ''; return; }
      var achados = [];
      store.get('cadastros').forEach(function (c) {
        if ((c.nome || '').toLowerCase().indexOf(q) > -1 || (c.doc || '').indexOf(q) > -1) {
          var pag = PAGINA_DO_TIPO_LOCAL[c.tipo] || 'cadastro.html';
          achados.push({
            icone: c.tipo === 'Produto' ? 'fa-burger' : (c.tipo === 'Fornecedor' ? 'fa-truck-field' : 'fa-user'),
            texto: c.tipo + ': ' + c.nome,
            href: pag + '?id=' + encodeURIComponent(c.id)
          });
        }
      });
      store.get('pedidos').forEach(function (p) {
        if ((p.numero || '').toLowerCase().indexOf(q) > -1 || (p.cliente || '').toLowerCase().indexOf(q) > -1) {
          achados.push({ icone: 'fa-receipt', texto: 'Pedido ' + p.numero + ' — ' + (p.cliente || 'Cliente'), href: 'pedido.html' });
        }
      });
      store.get('entregas').forEach(function (e) {
        if ((e.numero || '').toLowerCase().indexOf(q) > -1 || (e.cliente || '').toLowerCase().indexOf(q) > -1) {
          achados.push({ icone: 'fa-motorcycle', texto: 'Entrega ' + e.numero + ' — ' + (e.cliente || 'Cliente'), href: 'entrega.html' });
        }
      });
      if (!achados.length) results.innerHTML = '<div class="empty">Nenhum resultado para "' + esc(q) + '"</div>';
      else results.innerHTML = achados.slice(0, 8).map(function (a) {
        return '<a href="' + esc(a.href) + '"><i class="fa-solid ' + a.icone + '"></i> ' + esc(a.texto) + '</a>';
      }).join('');
      results.style.display = 'block';
    }
    input.addEventListener('input', function () { buscar(this.value); });
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

    $$('.table-actions .btn, .btn').forEach(function (b) {
      if (/ver\s*todos/i.test(b.textContent)) {
        var clone = b.cloneNode(true);
        b.parentNode.replaceChild(clone, b);
        clone.addEventListener('click', function (e) { e.preventDefault(); abrirModalPedidos(); });
      }
    });
  }

  /* Cadastros */
  var cfgCadastro = {
    'cliente.html':    { tipo: 'Cliente',    nome: 'nome completo',   doc: 'cpf',               contato: ['telefone', 'e-mail'] },
    'fornecedor.html': { tipo: 'Fornecedor', nome: 'razão social',    doc: 'cnpj',              contato: ['e-mail', 'telefone'] },
    'produto.html':    { tipo: 'Produto',    nome: 'nome do produto', doc: 'código do produto', valor: 'preço unitário' }
  }[page];

  if (cfgCadastro) {
    var idEdicao = new URLSearchParams(location.search).get('id');
    var botaoSalvar = $$('main .btn').filter(function (b) { return $('i.fa-floppy-disk', b); })[0];

    function coletarCampos() {
      var o = {};
      $$('.form-group').forEach(function (g) {
        var el = $('input,select,textarea', g);
        if (el) o[textoLabel(g)] = el.value;
      });
      return o;
    }

    if (idEdicao) {
      var itemEdit = store.get('cadastros').filter(function (x) { return String(x.id) === String(idEdicao); })[0];
      if (!itemEdit) toast('Cadastro não encontrado.', true);
      else {
        var titulo = $('.page-head__title');
        if (titulo) titulo.textContent = 'Editar ' + cfgCadastro.tipo;
        if (botaoSalvar) botaoSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alteração';
        if (itemEdit.campos) {
          $$('.form-group').forEach(function (g) {
            var el = $('input,select,textarea', g);
            var v = itemEdit.campos[textoLabel(g)];
            if (el && v !== undefined) el.value = v;
          });
        } else {
          if (fld(cfgCadastro.nome)) fld(cfgCadastro.nome).value = itemEdit.nome || '';
          if (fld(cfgCadastro.doc)) fld(cfgCadastro.doc).value = itemEdit.doc || '';
        }
      }
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

        var nome = fld(cfgCadastro.nome) ? fld(cfgCadastro.nome).value.trim() : '';
        var doc = fld(cfgCadastro.doc) ? fld(cfgCadastro.doc).value.trim() : '';
        var valorUnit = cfgCadastro.valor && fld(cfgCadastro.valor) ? num(fld(cfgCadastro.valor).value) : 0;

        var contato = '';
        if (cfgCadastro.tipo === 'Produto') {
          contato = 'Estoque: ' + (fld('qtd. em estoque') ? fld('qtd. em estoque').value || 0 : 0) + ' un';
        } else {
          cfgCadastro.contato.forEach(function (c) {
            if (!contato && fld(c) && fld(c).value) contato = fld(c).value;
          });
        }

        var lista = store.get('cadastros');
        if (idEdicao) {
          var existente = lista.filter(function (x) { return String(x.id) === String(idEdicao); })[0];
          if (!existente) return toast('Cadastro não encontrado.', true);
          existente.nome = nome; existente.doc = doc;
          existente.contato = contato; existente.valor = valorUnit;
          existente.campos = coletarCampos();
          store.set('cadastros', lista);
          toast(cfgCadastro.tipo + ' alterado com sucesso!');
        } else {
          lista.unshift({
            id: Date.now(), tipo: cfgCadastro.tipo, nome: nome, doc: doc,
            contato: contato, valor: valorUnit, campos: coletarCampos(),
            data: isoToBr(todayIso())
          });
          store.set('cadastros', lista);
          if (cfgCadastro.tipo === 'Cliente') {
            store.setObj('usuario_atual', { nome: nome, papel: 'Cliente' });
            atualizarUsuarioHeader();
          }
          toast(cfgCadastro.tipo + ' cadastrado com sucesso!');
        }
        setTimeout(function () { location.href = 'cadastro.html'; }, 1200);
      });
    }
  }

  /* Lista de cadastros */
  if (page === 'cadastro.html') {
    var tbCadastros = $('.data-table tbody');
    var icones = {
      Cliente:    '<i class="fa-solid fa-user" style="color:var(--ember-light);"></i>',
      Fornecedor: '<i class="fa-solid fa-truck-field" style="color:var(--ink-300);"></i>',
      Produto:    '<i class="fa-solid fa-burger" style="color:var(--ink-400);"></i>'
    };
    function renderCadastros() {
      if (!tbCadastros) return;
      tbCadastros.innerHTML = '';
      var lista = store.get('cadastros');
      if (!lista.length) {
        tbCadastros.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum cadastro realizado ainda.</td></tr>';
        return;
      }
      lista.forEach(function (c) {
        var tr = document.createElement('tr');
        tr.dataset.id = c.id;
        tr.innerHTML =
          '<td>' + (icones[c.tipo] || '') + ' ' + esc(c.tipo) + '</td>' +
          '<td>' + esc(c.nome) + '</td>' +
          '<td>' + esc(c.doc) + '</td>' +
          '<td>' + esc(c.contato) + '</td>' +
          '<td>' + esc(c.data) + '</td>' +
          '<td class="row-actions">' +
          '  <button title="Editar" class="btnEditCad"><i class="fa-solid fa-pen"></i></button>' +
          '  <button title="Excluir" class="danger btnDelCad"><i class="fa-solid fa-trash"></i></button>' +
          '</td>';
        tbCadastros.appendChild(tr);
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
        var lista = store.get('cadastros');
        var item = lista.filter(function (x) { return String(x.id) === String(id); })[0];
        if (!item) return;
        if (btnDel) {
          if (confirm('Deseja realmente remover "' + item.nome + '"?')) {
            store.set('cadastros', lista.filter(function (x) { return String(x.id) !== String(id); }));
            renderCadastros();
            toast('Cadastro removido com sucesso.');
          }
        } else if (btnEdit) {
          location.href = (PAGINA_DO_TIPO[item.tipo] || 'cadastro.html') + '?id=' + encodeURIComponent(id);
        }
      });
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
      var tx = sub * 0.1;
      if (v.length >= 3) {
        v[0].textContent = brl(sub);
        v[1].textContent = brl(tx);
        v[2].textContent = brl(sub + tx);
      }
    }

    function adicionarLinhaPedido(nome, valorUnit) {
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
          abrirModalProdutos(function (nome, preco) {
            adicionarLinhaPedido(nome, preco);
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
          if (!tbodyRows().length) return toast('Adicione ao menos um item.', true);
          var ped = {
            numero:  fld('número do pedido') ? fld('número do pedido').value : '#1088',
            mesa:    fld('número da mesa')   ? fld('número da mesa').value   : '',
            cliente: fld('nome do cliente')  ? fld('nome do cliente').value  : '',
            data: todayIso(),
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            total: num($$('.summary-card__value')[2].textContent),
            status: 'Pago'
          };
          var peds = store.get('pedidos');
          peds.unshift(ped);
          store.set('pedidos', peds);
          toast('Pedido ' + ped.numero + ' salvo com sucesso!');
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
      if (inputs.length >= 3) {
        var taxa = num(inputs[1].value);
        inputs[0].value = brl(sub);
        inputs[2].value = brl(sub + taxa);
      }
    }

    function adicionarLinhaEntrega(nome, valorUnit) {
      var tb = document.querySelector('.data-table tbody');
      if (!tb) return;
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + esc(nome) + '</td>' +
        '<td class="num"><input type="number" class="qtd-input" min="1" value="1" /></td>' +
        '<td class="num">' + brl(valorUnit) + '</td>' +
        '<td class="num"><strong>' + brl(valorUnit) + '</strong></td>';
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
          abrirModalProdutos(function (nome, preco) {
            adicionarLinhaEntrega(nome, preco);
            toast('"' + nome + '" adicionado.');
          });
        });
      }
    });

    var formsE = $$('form.form-card');
    if (formsE[1]) {
      var inputsTaxa = formsE[1].querySelectorAll('input');
      if (inputsTaxa[1]) inputsTaxa[1].addEventListener('input', recalcEntrega);
    }
  }

  /* Relatório balcão */
  if (page === 'relatorio_balcao.html') {
    var inputData = $('#inputDataBalcao');
    var btnConsultar = $('#btnConsultarBalcao');
    if (inputData) inputData.value = todayIso();
    function carregarRelatorioBalcao(dataIso) {
      var dataBr = isoToBr(dataIso);
      var pedidos = store.get('pedidos');
      var pedidosDoDia = pedidos.filter(function (p) { return p.data === dataIso || p.data === dataBr; });
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
      var lista = store.get('entregas').filter(function (e) { return e.data === dataIso || e.data === dataBr; });
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
    var all = store.get('pedidos').concat(store.get('entregas'));
    var cv2 = $$('.summary-card__value');
    var sum = function (a) { return a.reduce(function (s, p) { return s + num(p.total); }, 0); };
    var total = sum(all);
    [brl(total), brl(all.length ? total / all.length : 0), all.length, '0%']
      .forEach(function (x, i) { if (cv2[i]) cv2[i].textContent = x; });
  }

})();