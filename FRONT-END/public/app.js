// app.js — faz os botões do sistema Boi Ralado funcionarem.
// Os dados ficam no localStorage do navegador (sem precisar do servidor).
(function () {
  'use strict';
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem('br_' + k)) || []; } catch (e) { return []; } },
    set: function (k, v) { try { localStorage.setItem('br_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  function num(s) { return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0; }
  function brl(n) { return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function today() { return new Date().toLocaleDateString('pt-BR'); }

  // ---------- estilos de toast / modal ----------
  var st = document.createElement('style');
  st.textContent =
    '.br-toast{position:fixed;bottom:24px;right:24px;background:#2b0a0a;color:#fff;padding:12px 18px;border-radius:10px;z-index:9999;box-shadow:0 6px 20px rgba(0,0,0,.35);font:500 14px Poppins,sans-serif;max-width:340px}' +
    '.br-toast.err{background:#b3261e}' +
    '.br-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9998}' +
    '.br-md{background:#fff;border-radius:14px;padding:24px;width:min(440px,92vw);font-family:Poppins,sans-serif;color:#2b0a0a}' +
    '.br-md h3{margin:0 0 8px}.br-md label{display:block;font-size:13px;margin:10px 0 4px;font-weight:500}' +
    '.br-md input{width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;font:inherit;box-sizing:border-box}' +
    '.br-md .acts{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}' +
    '.br-bad{outline:2px solid #b3261e!important}' +
    '.sidebar.br-hide{display:none}' +
    '@media(max-width:900px){.sidebar.br-open{display:flex!important;position:fixed;left:0;top:0;bottom:0;z-index:100}}' +
    '@media print{.sidebar,.header,.footer,.btn,.filter-bar,.br-toast{display:none!important}}';
  document.head.appendChild(st);

  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'br-toast' + (err ? ' err' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  // fields: [{k, l, t, v}] — ok(valores) devolve false para manter aberto
  function modal(title, fields, ok) {
    var ov = document.createElement('div');
    ov.className = 'br-ov';
    var md = document.createElement('div');
    md.className = 'br-md';
    md.innerHTML = '<h3>' + esc(title) + '</h3>';
    var inputs = {};
    fields.forEach(function (f) {
      var lb = document.createElement('label'); lb.textContent = f.l;
      var inp = document.createElement('input'); inp.type = f.t || 'text'; inp.value = f.v == null ? '' : f.v;
      if (f.t === 'number') inp.min = 1;
      inputs[f.k] = inp; md.appendChild(lb); md.appendChild(inp);
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
    var first = md.querySelector('input'); if (first) first.focus();
  }

  // campo de formulário pelo início do texto do label
  function fld(t) {
    var g = $$('.form-group').filter(function (g) {
      var l = $('label', g);
      return l && l.textContent.trim().toLowerCase().indexOf(t.toLowerCase()) === 0;
    })[0];
    return g && $('input,select,textarea', g);
  }
  // botões de main pelo ícone
  function wire(icon, fn) {
    $$('main .btn').filter(function (b) { return $('i.' + icon, b); })
      .forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); fn(b); }); });
  }
  function tbodyRows() { return $$('.data-table tbody tr'); }
  function lastNum(r) { return num(r.cells[r.cells.length - 1].textContent); }
  function nextNumber(input) { input.value = '#' + (num(input.value) + 1); }

  // ---------- cabeçalho (todas as páginas) ----------
  var mb = $('.header__menu-btn');
  if (mb) mb.addEventListener('click', function () {
    var s = $('.sidebar'); if (s) s.classList.toggle(window.innerWidth > 900 ? 'br-hide' : 'br-open');
  });
  var hb = $$('.header__icon-btn');
  if (hb[0]) hb[0].addEventListener('click', function () {
    if (!tbodyRows().length) return toast('Não há tabela para filtrar nesta página.', true);
    modal('Buscar na tabela', [{ k: 'q', l: 'Digite o que procura (vazio mostra tudo)' }], function (d) {
      var q = d.q.toLowerCase(), achou = 0;
      tbodyRows().forEach(function (r) {
        var ok = !q || r.textContent.toLowerCase().indexOf(q) > -1;
        r.style.display = ok ? '' : 'none'; if (ok) achou++;
      });
      toast(q ? achou + ' resultado(s) encontrado(s).' : 'Filtro removido.');
    });
  });
  if (hb[1]) hb[1].addEventListener('click', function () {
    var b = $('.badge', hb[1]); if (b) b.style.display = 'none';
    toast('Nenhuma notificação nova.');
  });

  // ---------- DASHBOARD ----------
  if (page === 'index.html' || page === '') {
    wire('fa-plus', function () { location.href = 'pedido.html'; });
    wire('fa-calendar', function () { toast('Hoje é ' + today() + '.'); });
  }

  // ---------- CADASTROS (cliente / fornecedor / produto) ----------
  var cfg = {
    'cliente.html': { tipo: 'Cliente', nome: 'nome completo', doc: 'cpf', contato: ['telefone', 'e-mail'] },
    'fornecedor.html': { tipo: 'Fornecedor', nome: 'razão social', doc: 'cnpj', contato: ['e-mail', 'telefone'] },
    'produto.html': { tipo: 'Produto', nome: 'nome do produto', doc: 'código do produto' }
  }[page];

  if (cfg) {
    wire('fa-floppy-disk', function () {
      var bad = 0;
      $$('.form-group').forEach(function (g) {
        if (!$('.required', g)) return;
        var i = $('input,select,textarea', g);
        if (!i.value.trim()) { i.classList.add('br-bad'); bad++; } else i.classList.remove('br-bad');
      });
      if (bad) return toast('Preencha os campos obrigatórios (*).', true);
      var contato = '';
      if (cfg.tipo === 'Produto') contato = 'Estoque: ' + (fld('qtd. em estoque').value || 0) + ' un';
      else cfg.contato.forEach(function (c) { if (!contato && fld(c).value) contato = fld(c).value; });
      var lista = store.get('cadastros');
      lista.unshift({
        id: Date.now(), tipo: cfg.tipo, nome: fld(cfg.nome).value.trim(), doc: fld(cfg.doc).value.trim(),
        contato: contato, data: today()
      });
      store.set('cadastros', lista);
      $('form.form-card').reset();
      toast(cfg.tipo + ' salvo com sucesso!');
    });
    $$('input,select,textarea', $('form.form-card')).forEach(function (i) {
      i.addEventListener('input', function () { i.classList.remove('br-bad'); });
    });
  }

  // ---------- CADASTRO (lista de últimos cadastros) ----------
  if (page === 'cadastro.html') {
    var tb = $('.data-table tbody');
    var icones = {
      Cliente: '<i class="fa-solid fa-user" style="color:var(--color-red);"></i>',
      Fornecedor: '<i class="fa-solid fa-truck-field" style="color:var(--color-brown);"></i>',
      Produto: '<i class="fa-solid fa-burger" style="color:var(--color-brown-dark);"></i>'
    };
    store.get('cadastros').reverse().forEach(function (c) {
      var tr = document.createElement('tr'); tr.dataset.id = c.id;
      tr.innerHTML = '<td>' + icones[c.tipo] + ' ' + c.tipo + '</td><td>' + esc(c.nome) + '</td><td>' + esc(c.doc) +
        '</td><td>' + esc(c.contato) + '</td><td>' + c.data +
        '</td><td class="row-actions"><button title="Editar"><i class="fa-solid fa-pen"></i></button><button title="Excluir" class="danger"><i class="fa-solid fa-trash"></i></button></td>';
      tb.insertBefore(tr, tb.firstChild);
    });
    tb.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var tr = b.closest('tr'), id = tr.dataset.id;
      if ($('i.fa-trash', b)) {
        if (!confirm('Excluir "' + tr.cells[1].textContent + '"?')) return;
        if (id) store.set('cadastros', store.get('cadastros').filter(function (c) { return String(c.id) !== id; }));
        tr.remove(); toast('Cadastro excluído.');
      } else if ($('i.fa-pen', b)) {
        var novo = prompt('Novo nome:', tr.cells[1].textContent);
        if (!novo || !novo.trim()) return;
        tr.cells[1].textContent = novo.trim();
        if (id) store.set('cadastros', store.get('cadastros').map(function (c) {
          if (String(c.id) === id) c.nome = novo.trim(); return c;
        }));
        toast('Cadastro atualizado.');
      }
    });
  }

  // ---------- itens (pedido / entrega) ----------
  function addItem(entrega) {
    modal('Adicionar item', [
      { k: 'nome', l: 'Nome do item' },
      { k: 'qtd', l: 'Quantidade', t: 'number', v: 1 },
      { k: 'valor', l: 'Valor unitário (R$)' }
    ].concat(entrega ? [] : [{ k: 'comp', l: 'Complemento' }]), function (d) {
      var q = parseInt(d.qtd, 10) || 0, v = num(d.valor);
      if (!d.nome || q < 1 || v <= 0) { toast('Informe nome, quantidade e valor válidos.', true); return false; }
      var tr = document.createElement('tr');
      var cels = entrega ? [d.nome, q, brl(v), brl(q * v)] : [d.nome, q, d.comp || '—', brl(v), brl(q * v)];
      var html = entrega ? '' : '<td><input type="checkbox" /></td>';
      tr.innerHTML = html + cels.map(function (c, i) {
        var numerica = entrega ? i > 0 : (i === 1 || i >= 3);
        return '<td' + (numerica ? ' class="num"' : '') + '></td>';
      }).join('');
      var off = entrega ? 0 : 1;
      cels.forEach(function (c, i) { tr.cells[i + off].textContent = c; });
      $('.data-table tbody').appendChild(tr);
      entrega ? recalcEntrega() : recalcPedido();
      toast('Item adicionado.');
    });
  }

  // ---------- PEDIDO ----------
  function recalcPedido() {
    var sub = 0; tbodyRows().forEach(function (r) { sub += lastNum(r); });
    var v = $$('.summary-card__value'), tx = sub * 0.1;
    v[0].textContent = brl(sub); v[1].textContent = brl(tx); v[2].textContent = brl(sub + tx);
  }
  function pedidoDados(status) {
    return {
      numero: fld('número do pedido').value, mesa: fld('número da mesa').value.trim(),
      cliente: fld('nome do cliente').value.trim(), data: fld('data').value, hora: fld('hora').value, status: status,
      total: num($$('.summary-card__value')[2].textContent),
      itens: tbodyRows().map(function (r) {
        return { nome: r.cells[1].textContent, qtd: r.cells[2].textContent, comp: r.cells[3].textContent, subtotal: r.cells[5].textContent };
      })
    };
  }
  if (page === 'pedido.html') {
    wire('fa-plus', function () { addItem(false); });
    wire('fa-trash', function () {
      var sel = tbodyRows().filter(function (r) { return $('input:checked', r); });
      if (!sel.length) return toast('Marque os itens que deseja remover.', true);
      sel.forEach(function (r) { r.remove(); }); recalcPedido(); toast('Item(ns) removido(s).');
    });
    var all = $('thead input[type=checkbox]');
    if (all) all.addEventListener('change', function () {
      tbodyRows().forEach(function (r) { $('input', r).checked = all.checked; });
    });
    wire('fa-eraser', function () {
      tbodyRows().forEach(function (r) { r.remove(); });
      fld('número da mesa').value = ''; fld('nome do cliente').value = '';
      if (all) all.checked = false; recalcPedido(); toast('Pedido limpo.');
    });
    wire('fa-floppy-disk', function () {
      if (!tbodyRows().length) return toast('Adicione ao menos um item.', true);
      var l = store.get('pedidos'); l.unshift(pedidoDados('Aberto')); store.set('pedidos', l);
      toast('Pedido ' + fld('número do pedido').value + ' salvo.');
    });
    wire('fa-check-double', function () {
      if (!fld('número da mesa').value.trim()) return toast('Informe o número da mesa.', true);
      if (!tbodyRows().length) return toast('Adicione ao menos um item.', true);
      var l = store.get('pedidos'), n = fld('número do pedido').value;
      l.unshift(pedidoDados('Finalizado')); store.set('pedidos', l);
      tbodyRows().forEach(function (r) { r.remove(); });
      fld('número da mesa').value = ''; fld('nome do cliente').value = '';
      nextNumber(fld('número do pedido')); recalcPedido();
      toast('Pedido ' + n + ' finalizado!');
    });
  }

  // ---------- COMANDA ----------
  if (page === 'comanda.html') {
    var sel = fld('status do pagamento'), pill = $('.table-actions .pill');
    var cls = { Pago: 'pill--paid', Pendente: 'pill--pending', Parcial: 'pill--pending', Cancelado: 'pill--cancelled' };
    var setStatus = function (s) {
      sel.value = s; pill.textContent = 'Status: ' + s; pill.className = 'pill ' + cls[s];
    };
    sel.addEventListener('change', function () { setStatus(sel.value); });
    wire('fa-ban', function () {
      if (!confirm('Cancelar esta comanda?')) return;
      setStatus('Cancelado'); toast('Comanda cancelada.');
    });
    wire('fa-print', function () { window.print(); });
    wire('fa-paper-plane', function () {
      if (sel.value === 'Cancelado') return toast('Comanda cancelada não pode ser emitida.', true);
      var l = store.get('comandas');
      l.unshift({ numero: fld('número da comanda').value, mesa: fld('número da mesa').value, hora: fld('horário').value, status: sel.value, total: fld('subtotal').value });
      store.set('comandas', l);
      toast('Comanda ' + fld('número da comanda').value + ' emitida.');
    });
  }

  // ---------- ENTREGA ----------
  function recalcEntrega() {
    var sub = 0; tbodyRows().forEach(function (r) { sub += lastNum(r); });
    fld('subtotal').value = brl(sub);
    fld('total').value = brl(sub + num(fld('taxa de entrega').value));
  }
  if (page === 'entrega.html') {
    wire('fa-plus', function () { addItem(true); });
    fld('taxa de entrega').addEventListener('input', recalcEntrega);
    fld('taxa de entrega').addEventListener('blur', function () {
      this.value = brl(num(this.value)); recalcEntrega();
    });
    wire('fa-print', function () { window.print(); });
    wire('fa-paper-plane', function () {
      var bad = 0;
      ['nome do cliente', 'telefone'].forEach(function (n) {
        var i = fld(n); if (!i.value.trim()) { i.classList.add('br-bad'); bad++; } else i.classList.remove('br-bad');
      });
      if (bad) return toast('Informe nome e telefone do cliente.', true);
      if (!tbodyRows().length) return toast('Adicione ao menos um item.', true);
      var l = store.get('entregas');
      l.unshift({
        pedido: fld('número do pedido').value, cliente: fld('nome do cliente').value, telefone: fld('telefone').value,
        endereco: fld('endereço de entrega').value + ', ' + fld('número').value,
        pagamento: fld('forma de pagamento').value, total: fld('total').value
      });
      store.set('entregas', l);
      toast('Ordem ' + fld('número do pedido').value + ' gerada!');
      nextNumber(fld('número do pedido'));
    });
  }

  // ---------- RELATÓRIOS ----------
  if (page === 'relatorio_balcao.html' || page === 'relatorio_delivery.html') {
    var dt = $('.filter-bar input[type=date]'), per = $('.filter-bar select');
    function fmt(v) { return v ? v.split('-').reverse().join('/') : today(); }
    function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
    per.addEventListener('change', function () {
      var d = new Date();
      if (per.value === 'Ontem') d.setDate(d.getDate() - 1);
      if (per.value === 'Últimos 7 dias') d.setDate(d.getDate() - 6);
      if (per.value === 'Este mês') d.setDate(1);
      if (per.value !== 'Personalizado') dt.value = iso(d);
    });
    wire('fa-magnifying-glass', function () {
      $$('.report-section__head .pill').forEach(function (p) { p.textContent = fmt(dt.value); });
      toast('Relatório consultado para ' + fmt(dt.value) + '.');
    });
    wire('fa-print', function () { window.print(); });
    wire('fa-file-export', function () {
      var linhas = [];
      $$('.data-table').forEach(function (t) {
        $$('tr', t).forEach(function (r) {
          linhas.push($$('th,td', r).map(function (c) { return '"' + c.textContent.trim().replace(/"/g, '""') + '"'; }).join(';'));
        });
        linhas.push('');
      });
      var blob = new Blob(['\ufeff' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = page.replace('.html', '') + '_' + (dt.value || iso(new Date())) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Relatório exportado (CSV).');
    });
  }
})();
