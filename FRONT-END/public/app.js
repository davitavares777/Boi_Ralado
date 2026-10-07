// app.js — Sistema Boi Ralado com dados 100% dinâmicos, filtros de data e gestão completa.
(function () {
  'use strict';

  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- PERSISTÊNCIA NO LOCALSTORAGE ----------
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('br_' + k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem('br_' + k, JSON.stringify(v)); } catch (e) {} },
    getObj: function (k, def) { try { return JSON.parse(localStorage.getItem('br_' + k)) || def; } catch (e) { return def; } },
    setObj: function (k, v) { try { localStorage.setItem('br_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  function num(s) { return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  function brl(n) { return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function isoToBr(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  // ---------- ESTILOS INJETADOS ----------
  var st = document.createElement('style');
  st.textContent =
    '.br-toast{position:fixed;bottom:24px;right:24px;background:#2b0a0a;color:#fff;padding:12px 18px;border-radius:10px;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.35);font:500 14px Poppins,sans-serif;max-width:340px}' +
    '.br-toast.err{background:#b3261e}' +
    '.br-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9998}' +
    '.br-md{background:#fff;border-radius:14px;padding:24px;width:min(480px,92vw);font-family:Poppins,sans-serif;color:#2b0a0a}' +
    '.br-md h3{margin:0 0 12px;font-family:"Playfair Display",serif;color:#5C3A21;}' +
    '.br-md label{display:block;font-size:12.5px;margin:10px 0 4px;font-weight:600;text-transform:uppercase;color:#5C3A21}' +
    '.br-md input, .br-md select{width:100%;padding:10px;border:1px solid #D7C5A8;border-radius:8px;font:inherit;box-sizing:border-box;background:#F5EDE0}' +
    '.br-md .acts{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}' +
    '.br-bad{outline:2px solid #b3261e!important}' +
    '.header__icon-btn[title="Notificações"], .header__icon-btn .badge { display: none !important; }' +
    '@media print{.sidebar,.header,.footer,.btn,.filter-bar,.br-toast{display:none!important}}';
  document.head.appendChild(st);

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
      var lb = document.createElement('label'); lb.textContent = f.l;
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
    var c = document.createElement('button'); c.type = 'button'; c.className = 'btn btn--outline'; c.textContent = 'Cancelar';
    var o = document.createElement('button'); o.type = 'button'; o.className = 'btn btn--primary'; o.textContent = 'Confirmar';
    acts.appendChild(c); acts.appendChild(o); md.appendChild(acts); ov.appendChild(md); document.body.appendChild(ov);

    function fechar() { ov.remove(); }
    function confirmar() {
      var d = {}; Object.keys(inputs).forEach(function (k) { d[k] = inputs[k].value.trim(); });
      if (ok(d) !== false) fechar();
    }
    c.addEventListener('click', fechar);
    o.addEventListener('click', confirmar);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
    md.addEventListener('keydown', function (e) { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') fechar(); });
    var first = md.querySelector('input, select'); if (first) first.focus();
  }

  function fld(t) {
    var g = $$('.form-group').filter(function (g) {
      var l = $('label', g);
      return l && l.textContent.trim().toLowerCase().indexOf(t.toLowerCase()) === 0;
    })[0];
    return g && $('input,select,textarea', g);
  }

  function wire(icon, fn) {
    $$('main .btn').filter(function (b) { return $('i.' + icon, b); })
      .forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); fn(b); }); });
  }

  function tbodyRows() { return $$('.data-table tbody tr'); }
  function lastNum(r) { return num(r.cells[r.cells.length - 1].textContent); }

  // ---------- NOME DO USUÁRIO NO HEADER ----------
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

  // ---------- BUSCA GLOBAL DA CABEÇALHO ----------
  var hbSearch = $$('.header__icon-btn')[0];
  if (hbSearch) {
    hbSearch.addEventListener('click', function () {
      modal('Pesquisar no Sistema', [{ k: 'q', l: 'Termo para busca' }], function (d) {
        var q = d.q.toLowerCase();
        if (!q) return;
        var resultados = [];
        store.get('cadastros').forEach(function (c) {
          if (c.nome.toLowerCase().indexOf(q) > -1 || (c.doc && c.doc.indexOf(q) > -1)) {
            resultados.push(c.tipo + ': ' + c.nome);
          }
        });
        store.get('pedidos').forEach(function (p) {
          if (p.numero.toLowerCase().indexOf(q) > -1 || (p.cliente && p.cliente.toLowerCase().indexOf(q) > -1)) {
            resultados.push('Pedido ' + p.numero + ' (' + (p.cliente || 'Mesa ' + p.mesa) + ')');
          }
        });
        if (resultados.length) {
          toast('Encontrado: ' + resultados.slice(0, 3).join(' | ') + (resultados.length > 3 ? '...' : ''));
        } else {
          toast('Nenhum resultado para "' + d.q + '".', true);
        }
      });
    });
  }

  // ---------- REMOÇÃO DE NOTIFICAÇÕES ----------
  var hbNotif = $$('.header__icon-btn')[1];
  if (hbNotif && hbNotif.querySelector('.fa-bell')) {
    hbNotif.style.display = 'none';
  }

  // ---------- DASHBOARD ----------
  if (page === 'index.html' || page === '') {
    var dataFiltroDash = todayIso();

    // Injetar seletor de data no topo do Dashboard
    var headActions = $('.page-head > div:last-child');
    if (headActions) {
      headActions.innerHTML =
        '<div style="display:flex; align-items:center; gap:8px;">' +
        '  <label style="font-size:13px; font-weight:600; color:var(--color-brown);"><i class="fa-solid fa-calendar"></i> Data:</label>' +
        '  <input type="date" id="dashDateSelect" value="' + dataFiltroDash + '" class="btn btn--outline" style="padding:6px 12px; background:#fff;" />' +
        '</div>' +
        '<button class="btn btn--primary" id="btnNovoPedidoDash"><i class="fa-solid fa-plus"></i> Novo Pedido</button>';
    }

    var btnNovoPed = $('#btnNovoPedidoDash');
    if (btnNovoPed) btnNovoPed.addEventListener('click', function () { location.href = 'pedido.html'; });

    var inputDataDash = $('#dashDateSelect');
    if (inputDataDash) {
      inputDataDash.addEventListener('change', function () {
        dataFiltroDash = this.value;
        renderDashboard(dataFiltroDash);
      });
    }

    function renderDashboard(dataIso) {
      var dataBr = isoToBr(dataIso);
      var pedidos = store.get('pedidos');
      var entregas = store.get('entregas');

      var pedidosDoDia = pedidos.filter(function (p) { return p.data === dataIso || p.data === dataBr; });
      var entregasDoDia = entregas.filter(function (e) { return e.data === dataIso || e.data === dataBr; });

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

      // Atualizar Tabela de Últimos Pedidos
      var tb = $('.data-table tbody');
      if (tb) {
        tb.innerHTML = '';
        var listaExibir = pedidosDoDia.concat(entregasDoDia).slice(0, 10);

        if (!listaExibir.length) {
          tb.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum pedido registrado nesta data.</td></tr>';
          return;
        }

        listaExibir.forEach(function (item) {
          var tr = document.createElement('tr');
          var numPed = item.numero || item.pedido || '#000';
          var cli = item.cliente || 'Não informado';
          var mesa = item.mesa ? 'Mesa ' + item.mesa : '—';
          var tipo = item.endereco ? 'Delivery' : 'Balcão';
          var valor = brl(num(item.total));
          var st = item.status || 'Pago';
          var hora = item.hora || '12:00';

          tr.innerHTML =
            '<td><strong>' + esc(numPed) + '</strong></td>' +
            '<td>' + esc(cli) + '</td>' +
            '<td>' + esc(mesa) + '</td>' +
            '<td>' + esc(tipo) + '</td>' +
            '<td class="num">' + esc(valor) + '</td>' +
            '<td><span class="pill pill--paid">' + esc(st) + '</span></td>' +
            '<td>' + esc(hora) + '</td>';
          tb.appendChild(tr);
        });
      }
    }

    renderDashboard(dataFiltroDash);
  }

  // ---------- CADASTROS (Cliente, Fornecedor, Produto) ----------
  var cfgCadastro = {
    'cliente.html': { tipo: 'Cliente', nome: 'nome completo', doc: 'cpf', contato: ['telefone', 'e-mail'] },
    'fornecedor.html': { tipo: 'Fornecedor', nome: 'razão social', doc: 'cnpj', contato: ['e-mail', 'telefone'] },
    'produto.html': { tipo: 'Produto', nome: 'nome do produto', doc: 'código do produto', valor: 'preço unitário' }
  }[page];

  if (cfgCadastro) {
    wire('fa-floppy-disk', function () {
      var bad = 0;
      $$('.form-group').forEach(function (g) {
        if (!$('.required', g)) return;
        var i = $('input,select,textarea', g);
        if (!i || !i.value.trim()) { if (i) i.classList.add('br-bad'); bad++; } else i.classList.remove('br-bad');
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
      lista.unshift({
        id: Date.now(),
        tipo: cfgCadastro.tipo,
        nome: nome,
        doc: doc,
        contato: contato,
        valor: valorUnit,
        data: isoToBr(todayIso())
      });
      store.set('cadastros', lista);

      // Atualizar também o usuário logado se for o cadastro de um cliente principal
      if (cfgCadastro.tipo === 'Cliente') {
        store.setObj('usuario_atual', { nome: nome, papel: 'Cliente' });
        atualizarUsuarioHeader();
      }

      toast(cfgCadastro.tipo + ' cadastrado com sucesso! Redirecionando...');
      setTimeout(function () {
        location.href = 'cadastro.html';
      }, 1200);
    });
  }

  // ---------- MÓDULO DE CADASTRO (Edição Completa e Exclusão) ----------
  if (page === 'cadastro.html') {
    var tbCadastros = $('.data-table tbody');
    var icones = {
      Cliente: '<i class="fa-solid fa-user" style="color:var(--color-red);"></i>',
      Fornecedor: '<i class="fa-solid fa-truck-field" style="color:var(--color-brown);"></i>',
      Produto: '<i class="fa-solid fa-burger" style="color:var(--color-brown-dark);"></i>'
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
        if (!tr) return;
        var id = tr.dataset.id;
        var lista = store.get('cadastros');
        var item = lista.filter(function (x) { return String(x.id) === String(id); })[0];

        if (btnDel && item) {
          if (confirm('Deseja realmente remover "' + item.nome + '"?')) {
            store.set('cadastros', lista.filter(function (x) { return String(x.id) !== String(id); }));
            renderCadastros();
            toast('Cadastro removido com sucesso.');
          }
        } else if (btnEdit && item) {
          modal('Editar ' + item.tipo, [
            { k: 'nome', l: 'Nome / Razão Social', v: item.nome },
            { k: 'doc', l: 'Documento (CPF/CNPJ/Código)', v: item.doc },
            { k: 'contato', l: 'Contato / Obs', v: item.contato }
          ], function (d) {
            if (!d.nome) { toast('O nome é obrigatório.', true); return false; }
            item.nome = d.nome;
            item.doc = d.doc;
            item.contato = d.contato;
            store.set('cadastros', lista);
            renderCadastros();
            toast('Cadastro atualizado com sucesso!');
          });
        }
      });
    }
  }

  // ---------- PEDIDOS & PRODUTOS INTEGRADOS ----------
  if (page === 'pedido.html') {
    function recalcPedido() {
      var sub = 0;
      tbodyRows().forEach(function (r) { sub += lastNum(r); });
      var v = $$('.summary-card__value');
      var tx = sub * 0.1;
      if (v.length >= 3) {
        v[0].textContent = brl(sub);
        v[1].textContent = brl(tx);
        v[2].textContent = brl(sub + tx);
      }
    }

    function addItemPedido() {
      var produtosSalvos = store.get('cadastros').filter(function (c) { return c.tipo === 'Produto'; });
      var opcoes = produtosSalvos.map(function (p) {
        return { v: p.nome, l: p.nome + ' (' + brl(p.valor || 0) + ')' };
      });
      opcoes.unshift({ v: 'Outro', l: 'Outro produto / Personalizado' });

      modal('Adicionar Item ao Pedido', [
        { k: 'prodSel', l: 'Selecione o Produto Cadastrado', type: 'select', options: opcoes },
        { k: 'nome', l: 'Ou Nome do Item', v: '' },
        { k: 'qtd', l: 'Quantidade', t: 'number', v: 1 },
        { k: 'valor', l: 'Valor Unitário (R$)', v: '' },
        { k: 'comp', l: 'Complemento / Observação', v: '' }
      ], function (d) {
        var nomeFinal = d.prodSel !== 'Outro' ? d.prodSel : d.nome;
        var prodEncontrado = produtosSalvos.filter(function (p) { return p.nome === nomeFinal; })[0];
        var valUnit = num(d.valor) || (prodEncontrado ? prodEncontrado.valor : 0);
        var q = parseInt(d.qtd, 10) || 1;

        if (!nomeFinal || valUnit <= 0) {
          toast('Informe um produto e valor válidos.', true);
          return false;
        }

        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><input type="checkbox" /></td>' +
          '<td>' + esc(nomeFinal) + '</td>' +
          '<td class="num">' + q + '</td>' +
          '<td>' + esc(d.comp || '—') + '</td>' +
          '<td class="num">' + brl(valUnit) + '</td>' +
          '<td class="num"><strong>' + brl(q * valUnit) + '</strong></td>';

        $('.data-table tbody').appendChild(tr);
        recalcPedido();
        toast('Item adicionado ao pedido.');
      });
    }

    wire('fa-plus', addItemPedido);

    wire('fa-trash', function () {
      var sel = tbodyRows().filter(function (r) { return $('input:checked', r); });
      if (!sel.length) return toast('Selecione os itens que deseja remover.', true);
      sel.forEach(function (r) { r.remove(); });
      recalcPedido();
      toast('Item(ns) removido(s).');
    });

    wire('fa-floppy-disk', function () {
      if (!tbodyRows().length) return toast('Adicione ao menos um item.', true);
      var ped = {
        numero: fld('número do pedido') ? fld('número do pedido').value : '#1088',
        mesa: fld('número da mesa') ? fld('número da mesa').value : '',
        cliente: fld('nome do cliente') ? fld('nome do cliente').value : '',
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

  // ---------- RELATÓRIOS DINÂMICOS COM SELEÇÃO DE DATA ----------
  if (page === 'relatorio_balcao.html' || page === 'relatorio_delivery.html') {
    var inputDateFilter = $('.filter-bar input[type=date]');
    if (inputDateFilter) {
      inputDateFilter.value = todayIso();
      wire('fa-magnifying-glass', function () {
        var dataSel = inputDateFilter.value;
        $$('.report-section__head .pill').forEach(function (p) { p.textContent = isoToBr(dataSel); });
        toast('Relatório atualizado para a data: ' + isoToBr(dataSel));
      });
    }
  }

})();
// Lógica para o Relatório de Balcão no app.js
if (page === 'relatorio_balcao.html') {
  var inputData = $('#inputDataBalcao');
  var btnConsultar = $('#btnConsultarBalcao');

  if (inputData) {
    inputData.value = todayIso();
  }

  function carregarRelatorioBalcao(dataIso) {
    var dataBr = isoToBr(dataIso);
    var pedidos = store.get('pedidos');
    var pedidosDoDia = pedidos.filter(function (p) { return p.data === dataIso || p.data === dataBr; });

    var totalValor = 0;
    var tb = $('#tabelaRelatorioBalcao tbody');
    if (tb) tb.innerHTML = '';

    if (pillData) $('#pillDataBalcao').textContent = dataBr;

    if (!pedidosDoDia.length) {
      if (tb) tb.innerHTML = '<tr><td colspan="5" class="text-center">Nenhuma venda de balcão encontrada nesta data.</td></tr>';
      if ($('#totalGeralBalcao')) $('#totalGeralBalcao').textContent = brl(0);
      if ($('#totalQtdBalcao')) $('#totalQtdBalcao').textContent = '0';
      return;
    }

    pedidosDoDia.forEach(function (p) {
      var v = num(p.total);
      totalValor += v;

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
    // Carga inicial
    carregarRelatorioBalcao(inputData.value);
  }
}
// Aplica a máscara de CPF automaticamente em todos os inputs com ID/nome de CPF
document.addEventListener('input', function (e) {
  if (e.target && (e.target.id === 'regCpf' || e.target.placeholder.includes('000.000.000-00') || e.target.name === 'cpf')) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  }
});