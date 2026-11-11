// comanda.js — Emitir Comanda (consome /api/produtos)
(function () {
  'use strict';

  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function num(s) {
    return parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function toast(msg, err) {
    var t = document.createElement('div');
    t.className = 'br-toast';
    t.style.background = err ? '#b3261e' : '#2b0a0a';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }
  function pedir(metodo, endereco) {
    return fetch(endereco, { method: metodo })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, erro: 'Servidor offline.' }; });
  }

  var IMGS_PADRAO = '../img/produtos/placeholder.jpg';
  function imagemDoProduto(prod) {
    if (prod.imagem) return '../' + prod.imagem;
    var mapa = {
      'Boi Ralado Tradicional':  '../img/produtos/boi-ralado.jpg',
      'Hambúrguer Boi Ralado':   '../img/produtos/hamburguer.jpg',
      'Pastel de Boi Ralado':    '../img/produtos/pastel.jpg',
      'Picanha na Chapa':        '../img/produtos/picanha.jpg',
      'Prato Executivo da Casa': '../img/produtos/executivo.jpg',
      'Batata Rústica':          '../img/produtos/batata.jpg',
      'Suco de Laranja':         '../img/produtos/suco.jpg',
      'Mousse de Maracujá':      '../img/produtos/mousse.webp'
    };
    return mapa[prod.nome] || IMGS_PADRAO;
  }

  var tbody = document.getElementById('tbodyComanda');
  if (!tbody) return;

  function atualizarLinhaVazia() {
    var linhas = tbody.querySelectorAll('tr[data-produto]');
    var vazia = document.getElementById('linhaVazia');
    if (linhas.length === 0) {
      if (!vazia) {
        var tr = document.createElement('tr');
        tr.id = 'linhaVazia';
        tr.innerHTML = '<td colspan="5" class="text-center">Nenhum item adicionado ainda. Clique em <strong>"Adicionar Item"</strong> para começar.</td>';
        tbody.appendChild(tr);
      }
    } else {
      if (vazia) vazia.remove();
    }
  }

  function recalcular() {
    var subtotal = 0;
    tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) {
      var preco = parseFloat(tr.dataset.preco) || 0;
      var qtd = parseInt(tr.querySelector('.qtd-input').value, 10) || 1;
      var sub = preco * qtd;
      tr.querySelector('.subtotal-cell').textContent = brl(sub);
      subtotal += sub;
    });
    var taxa = subtotal * 0.10;
    var total = subtotal + taxa;
    document.getElementById('subtotal').textContent = brl(subtotal);
    document.getElementById('taxaServico').textContent = brl(taxa);
    document.getElementById('totalPagar').textContent = brl(total);
  }

  function adicionarLinha(produto) {
    var tr = document.createElement('tr');
    tr.dataset.produto = produto.nome;
    tr.dataset.preco = produto.preco;
    tr.innerHTML =
      '<td><input type="checkbox" /></td>' +
      '<td><div class="comanda-produto-cell">' +
        '<img src="' + (produto.img || '') + '" alt="' + esc(produto.nome) + '" class="comanda-produto-img" onerror="this.style.display=\'none\'">' +
        '<span class="comanda-produto-nome">' + esc(produto.nome) + '</span>' +
      '</div></td>' +
      '<td class="num"><input type="number" class="qtd-input" min="1" value="1"></td>' +
      '<td class="num">' + brl(produto.preco) + '</td>' +
      '<td class="num subtotal-cell">' + brl(produto.preco) + '</td>';

    tbody.appendChild(tr);

    var qtdInp = tr.querySelector('.qtd-input');
    qtdInp.addEventListener('input', function () {
      if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
      recalcular();
    });
    qtdInp.addEventListener('blur', function () {
      if (this.value === '' || parseInt(this.value, 10) < 1) this.value = 1;
      recalcular();
    });

    atualizarLinhaVazia();
    recalcular();
  }

  function abrirModalProdutos(onAdicionar) {
    pedir('GET', '/api/produtos').then(function (r) {
      var produtos = (r.ok ? r.dados : []).map(function (p) {
        return {
          nome: p.nome,
          preco: Number(p.preco) || 0,
          img: imagemDoProduto(p),
          estoque: p.estoque || 0
        };
      });

      var ov = document.createElement('div');
      ov.className = 'br-ov';
      var md = document.createElement('div');
      md.className = 'br-md br-md--produtos';

      if (!produtos.length) {
        md.innerHTML = '<h3>Consultar itens</h3>' +
          '<div class="br-vazio"><i class="fa-solid fa-burger"></i><p>Nenhum produto cadastrado.</p>' +
          '<a href="produto.html" class="btn btn--primary"><i class="fa-solid fa-plus"></i> Cadastrar produto</a></div>';
        var actsV = document.createElement('div'); actsV.className = 'acts';
        var fecharV = document.createElement('button');
        fecharV.type = 'button'; fecharV.className = 'btn btn--outline'; fecharV.textContent = 'Fechar';
        fecharV.addEventListener('click', function () { ov.remove(); });
        actsV.appendChild(fecharV); md.appendChild(actsV);
        ov.appendChild(md); document.body.appendChild(ov);
        ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
        return;
      }

      var html = '<h3>Consultar itens do cardápio</h3><div class="br-tabela"><table><thead><tr>' +
        '<th style="width:60px"></th><th>Produto</th><th class="num" style="width:110px">Preço</th><th style="width:120px">Estoque</th><th style="width:50px"></th>' +
        '</tr></thead><tbody>';
      produtos.forEach(function (p, i) {
        html += '<tr data-idx="' + i + '">' +
          '<td><div class="br-prod-img"><img src="' + p.img + '" onerror="this.style.display=\'none\'"></div></td>' +
          '<td><span class="br-prod-nome">' + esc(p.nome) + '</span></td>' +
          '<td class="num">' + brl(p.preco) + '</td>' +
          '<td><small class="br-prod-estoque">' + p.estoque + ' un</small></td>' +
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
          onAdicionar(p);
          var ico = tr.querySelector('.br-add-ico');
          if (ico) {
            ico.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(function () { ico.innerHTML = '<i class="fa-solid fa-plus"></i>'; }, 600);
          }
        });
      });

      ov.appendChild(md); document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    });
  }

  document.getElementById('btnAdicionarItem').addEventListener('click', function () {
    abrirModalProdutos(function (produto) {
      var existente = null;
      tbody.querySelectorAll('tr[data-produto]').forEach(function (tr) {
        if (tr.dataset.produto === produto.nome) existente = tr;
      });
      if (existente) {
        var inp = existente.querySelector('.qtd-input');
        inp.value = (parseInt(inp.value, 10) || 1) + 1;
        recalcular();
        toast('"' + produto.nome + '" +1 unidade.');
        return;
      }
      adicionarLinha(produto);
      toast('"' + produto.nome + '" adicionado à comanda.');
    });
  });

  document.getElementById('btnRemoverItem').addEventListener('click', function () {
    var selecionados = tbody.querySelectorAll('tr[data-produto] input[type="checkbox"]:checked');
    if (!selecionados.length) return toast('Marque os itens que deseja remover.', true);
    selecionados.forEach(function (chk) {
      var tr = chk.closest('tr');
      if (tr) tr.remove();
    });
    atualizarLinhaVazia();
    recalcular();
    toast('Item(ns) removido(s).');
  });

  document.getElementById('chkTodos').addEventListener('change', function () {
    var marcado = this.checked;
    tbody.querySelectorAll('tr[data-produto] input[type="checkbox"]').forEach(function (chk) {
      chk.checked = marcado;
    });
  });

  function modal(title, msg, iconClass, btnLabel, btnClass, onConfirm) {
    var ov = document.createElement('div');
    ov.className = 'br-ov';
    ov.innerHTML =
      '<div class="print-modal">' +
        '<div class="print-modal__icon"><i class="' + iconClass + '"></i></div>' +
        '<h3>' + title + '</h3>' +
        '<p>' + msg + '</p>' +
        '<div class="print-modal__acts">' +
          '<button type="button" class="btn btn--outline" id="modalCancelar">Cancelar</button>' +
          '<button type="button" class="btn ' + btnClass + '" id="modalConfirmar">' + btnLabel + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);
    function fechar() { ov.remove(); }
    ov.querySelector('#modalCancelar').addEventListener('click', fechar);
    ov.querySelector('#modalConfirmar').addEventListener('click', function () {
      fechar();
      if (onConfirm) onConfirm();
    });
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });
  }

  document.getElementById('btnImprimir').addEventListener('click', function () {
    modal('Imprimir Comanda?', 'A comanda será enviada para a impressora padrão do sistema.',
      'fa-solid fa-print', '<i class="fa-solid fa-print"></i> Imprimir', 'btn--brown',
      function () { toast('Comanda enviada para impressão! 🖨️'); window.print(); });
  });

  document.getElementById('btnCancelar').addEventListener('click', function () {
    modal('Cancelar Comanda?', 'A comanda será cancelada e o status mudará para "Cancelado".',
      'fa-solid fa-ban', '<i class="fa-solid fa-ban"></i> Cancelar Comanda', 'btn--danger-outline',
      function () {
        document.getElementById('statusPagamento').value = 'Cancelado';
        toast('Comanda cancelada.', true);
      });
  });

  document.getElementById('btnEmitir').addEventListener('click', function () {
    var linhas = tbody.querySelectorAll('tr[data-produto]');
    if (!linhas.length) {
      toast('Adicione pelo menos 1 item antes de emitir.', true);
      return;
    }
    modal('Emitir Comanda?', 'A comanda será emitida e registrada no sistema.',
      'fa-solid fa-paper-plane', '<i class="fa-solid fa-paper-plane"></i> Emitir', 'btn--primary',
      function () {
        var comanda = {
          numero: document.getElementById('numComanda').value,
          mesa: document.getElementById('numMesa').value,
          hora: document.getElementById('horaComanda').value,
          status: document.getElementById('statusPagamento').value,
          total: document.getElementById('totalPagar').textContent,
          itens: []
        };
        linhas.forEach(function (tr) {
          comanda.itens.push({
            nome: tr.dataset.produto,
            qtd: parseInt(tr.querySelector('.qtd-input').value, 10) || 1,
            preco: parseFloat(tr.dataset.preco) || 0
          });
        });
        var comandas = [];
        try { comandas = JSON.parse(localStorage.getItem('br_comandas')) || []; } catch (e) {}
        comandas.unshift(comanda);
        try { localStorage.setItem('br_comandas', JSON.stringify(comandas)); } catch (e) {}
        toast('Comanda ' + comanda.numero + ' emitida com sucesso! 🎉');
      });
  });

  recalcular();
})();