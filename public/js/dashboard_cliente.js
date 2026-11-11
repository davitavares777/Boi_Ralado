// dashboard_cliente.js — Lógica exclusiva da área do cliente
console.log('[dashboard_cliente] Script iniciado.');

(function () {
  'use strict';

  // ========== PRODUTOS DE EXEMPLO (idênticos ao dashboard do funcionário) ==========
  var PRODUTOS_EXEMPLO = [
    { id: 1, nome: 'Boi Ralado Tradicional', categoria: 'Prato Principal', preco: 34.90, descricao: 'O clássico da casa! Carne bovina desfiada com tempero especial, servida com arroz, feijão e farofa.', estoque: 50, imagem: 'img/produtos/boi-ralado.jpg' },
    { id: 2, nome: 'Hambúrguer Boi Ralado', categoria: 'Lanches', preco: 32.00, descricao: 'Blend especial de 180g com queijo cheddar, bacon crocante e molho da casa no pão brioche.', estoque: 40, imagem: 'img/produtos/hamburguer.jpg' },
    { id: 3, nome: 'Pastel de Boi Ralado', categoria: 'Salgados', preco: 14.00, descricao: 'Pastel grande e crocante recheado com carne desfiada temperada e queijo derretido.', estoque: 80, imagem: 'img/produtos/pastel.jpg' },
    { id: 4, nome: 'Picanha na Chapa', categoria: 'Prato Principal', preco: 68.90, descricao: 'Picanha nobre fatiada na chapa com acompanhamentos: arroz, farofa, vinagrete e batata frita.', estoque: 25, imagem: 'img/produtos/picanha.jpg' },
    { id: 5, nome: 'Prato Executivo da Casa', categoria: 'Executivo', preco: 29.90, descricao: 'A refeição completa com arroz, feijão, bife acebolado, salada fresca e batata frita.', estoque: 60, imagem: 'img/produtos/executivo.jpg' },
    { id: 6, nome: 'Batata Rústica', categoria: 'Acompanhamento', preco: 24.90, descricao: 'Batatas com casca temperadas com ervas finas e alho, acompanhadas de maionese da casa.', estoque: 90, imagem: 'img/produtos/batata.jpg' },
    { id: 7, nome: 'Suco de Laranja', categoria: 'Bebida', preco: 9.00, descricao: 'Suco de laranja 100% natural, feito na hora e servido gelado. Copo 500ml.', estoque: 100, imagem: 'img/produtos/suco.jpg' },
    { id: 8, nome: 'Mousse de Maracujá', categoria: 'Sobremesa', preco: 12.00, descricao: 'Mousse cremosa de maracujá com calda especial da casa. Porção individual.', estoque: 45, imagem: 'img/produtos/mousse.webp' }
  ];

  // ========== ESTADO ==========
  var produtos = [];
  var carrinho = [];
  var categoriaAtiva = 'todos';
  var usuarioAtual = null;

  try {
    usuarioAtual = JSON.parse(localStorage.getItem('br_usuario_atual'));
  } catch (e) {
    console.error('[dashboard_cliente] Erro ao ler usuário:', e);
  }

  console.log('[dashboard_cliente] Usuário atual:', usuarioAtual);

  if (!usuarioAtual || usuarioAtual.papel !== 'Cliente') {
    console.warn('[dashboard_cliente] Redirecionando: usuário não é cliente.');
    location.href = 'login.html';
    return;
  }

  // ========== HELPERS ==========
  function brl(n) {
    return 'R$ ' + (Number(n) || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
  function pedir(metodo, endereco, dados) {
    return fetch(endereco, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: dados ? JSON.stringify(dados) : undefined
    })
      .then(function (r) { return r.json(); })
      .catch(function (e) {
        console.warn('[dashboard_cliente] Fetch falhou:', e);
        return { ok: false, erro: 'Servidor offline.' };
      });
  }

  var IMGS_PADRAO = '../img/produtos/placeholder.jpg';
  
  var MAPA_IMAGENS = {
    'Boi Ralado Tradicional':  '../img/produtos/boi-ralado.jpg',
    'Hambúrguer Boi Ralado':   '../img/produtos/hamburguer.jpg',
    'Pastel de Boi Ralado':    '../img/produtos/pastel.jpg',
    'Picanha na Chapa':        '../img/produtos/picanha.jpg',
    'Prato Executivo da Casa': '../img/produtos/executivo.jpg',
    'Batata Rústica':          '../img/produtos/batata.jpg',
    'Suco de Laranja':         '../img/produtos/suco.jpg',
    'Mousse de Maracujá':      '../img/produtos/mousse.webp'
  };

  function imagemDoProduto(prod) {
    if (prod.imagem) {
      if (prod.imagem.indexOf('/') > -1 || prod.imagem.indexOf('img/') === 0) {
        return '../' + prod.imagem.replace(/^\.\.\//, '');
      }
      return '../' + prod.imagem;
    }
    return MAPA_IMAGENS[prod.nome] || IMGS_PADRAO;
  }

  // ========== IDENTIDADE DO CLIENTE ==========
  var nomeCliente = usuarioAtual.nome || 'Cliente';
  var partes = nomeCliente.trim().split(' ');
  var iniciais = ((partes[0] || '')[0] || '') + ((partes[1] || '')[0] || '');
  iniciais = iniciais.toUpperCase() || 'CL';

  var elHeaderNome = document.getElementById('headerNome');
  var elHeaderAvatar = document.getElementById('headerAvatar');
  var elClienteNome = document.getElementById('clienteNome');
  var elClienteAvatar = document.getElementById('clienteAvatar');

  if (elHeaderNome) elHeaderNome.textContent = nomeCliente;
  if (elHeaderAvatar) elHeaderAvatar.textContent = iniciais;
  if (elClienteNome) elClienteNome.textContent = nomeCliente.split(' ')[0];
  if (elClienteAvatar) elClienteAvatar.textContent = iniciais;

  // ========== NAVEGAÇÃO ENTRE SEÇÕES ==========
  var secoes = {
    cardapio: document.getElementById('secaoCardapio'),
    carrinho: document.getElementById('secaoCarrinho'),
    pedidos: document.getElementById('secaoPedidos')
  };

  function navegarPara(secao) {
    Object.keys(secoes).forEach(function (k) {
      if (secoes[k]) secoes[k].classList.toggle('active', k === secao);
    });
    document.querySelectorAll('.sidebar__nav a').forEach(function (a) {
      a.classList.remove('active');
    });
    if (secao === 'cardapio') {
      var link = document.querySelector('.sidebar__nav a[href="dashboard_cliente.html"]');
      if (link) link.classList.add('active');
    } else if (secao === 'carrinho') {
      var linkC = document.getElementById('navCarrinho');
      if (linkC) linkC.classList.add('active');
    } else if (secao === 'pedidos') {
      var linkP = document.getElementById('navPedidos');
      if (linkP) linkP.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  var navCarrinho = document.getElementById('navCarrinho');
  var navPedidos = document.getElementById('navPedidos');
  if (navCarrinho) navCarrinho.addEventListener('click', function (e) { e.preventDefault(); navegarPara('carrinho'); });
  if (navPedidos) navPedidos.addEventListener('click', function (e) { e.preventDefault(); navegarPara('pedidos'); });

  var btnVoltarCardapio = document.getElementById('btnVoltarCardapio');
  if (btnVoltarCardapio) btnVoltarCardapio.addEventListener('click', function () { navegarPara('cardapio'); });
  var btnIrParaCardapio = document.getElementById('btnIrParaCardapio');
  if (btnIrParaCardapio) btnIrParaCardapio.addEventListener('click', function () { navegarPara('cardapio'); });
  var btnFazerPedido = document.getElementById('btnFazerPedido');
  if (btnFazerPedido) btnFazerPedido.addEventListener('click', function () { navegarPara('cardapio'); });

  document.querySelectorAll('[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      navegarPara(this.dataset.nav);
    });
  });

  // ========== CARREGAR CARDÁPIO ==========
  function carregarCardapio() {
    var grid = document.getElementById('cardapioGrid');
    if (!grid) {
      console.error('[dashboard_cliente] #cardapioGrid não encontrado!');
      return;
    }
    grid.innerHTML = '<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i><p>Carregando cardápio...</p></div>';

    pedir('GET', '/api/produtos').then(function (r) {
      console.log('[dashboard_cliente] Resposta da API /api/produtos:', r);
      
      var produtosApi = (r && r.ok && r.dados && r.dados.length) ? r.dados : [];
      
      // SEMPRE usa os produtos de exemplo como base
      produtos = PRODUTOS_EXEMPLO.map(function (p) { return Object.assign({}, p); });
      
      // Se a API retornou produtos, mescla (evitando duplicatas por id)
      if (produtosApi.length) {
        var idsExistentes = {};
        produtos.forEach(function (p) { idsExistentes[p.id] = true; });
        
        produtosApi.forEach(function (p) {
          // Se o produto da API já existe nos exemplos, atualiza com os dados da API
          if (idsExistentes[p.id]) {
            for (var i = 0; i < produtos.length; i++) {
              if (produtos[i].id === p.id) {
                produtos[i] = Object.assign({}, produtos[i], p);
                break;
              }
            }
          } else {
            // Senão, adiciona como novo produto
            produtos.push(p);
          }
        });
      }
      
      console.log('[dashboard_cliente] Total de produtos (exemplos + API):', produtos.length);
      
      renderizarCardapio();
      renderizarFiltros();
    }).catch(function (e) {
      console.error('[dashboard_cliente] Erro ao carregar cardápio:', e);
      produtos = PRODUTOS_EXEMPLO.map(function (p) { return Object.assign({}, p); });
      renderizarCardapio();
      renderizarFiltros();
    });
  }

  function renderizarFiltros() {
    var container = document.getElementById('filtrosCategoria');
    if (!container) return;
    var cats = ['todos'];
    produtos.forEach(function (p) {
      if (p.categoria && cats.indexOf(p.categoria) === -1) cats.push(p.categoria);
    });
    container.innerHTML = cats.map(function (c) {
      var label = c === 'todos' ? 'Todos' : c;
      return '<button class="filtro-btn' + (c === categoriaAtiva ? ' active' : '') + '" data-cat="' + esc(c) + '">' + esc(label) + '</button>';
    }).join('');
    container.querySelectorAll('.filtro-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        categoriaAtiva = this.dataset.cat;
        container.querySelectorAll('.filtro-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        renderizarCardapio();
      });
    });
  }

  function renderizarCardapio() {
    var grid = document.getElementById('cardapioGrid');
    if (!grid) return;
    var lista = produtos.filter(function (p) {
      return categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
    });
    
    console.log('[dashboard_cliente] Renderizando', lista.length, 'produtos.');
    
    if (!lista.length) {
      grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-burger"></i><p>Nenhum produto encontrado nesta categoria.</p></div>';
      return;
    }
    grid.innerHTML = lista.map(function (p) {
      var img = imagemDoProduto(p);
      return (
        '<div class="produto-card-cliente" data-id="' + p.id + '">' +
          '<div class="produto-card-cliente__img">' +
            '<img src="' + img + '" alt="' + esc(p.nome) + '" onerror="this.src=\'' + IMGS_PADRAO + '\'">' +
            (p.categoria ? '<span class="produto-card-cliente__badge">' + esc(p.categoria) + '</span>' : '') +
          '</div>' +
          '<div class="produto-card-cliente__body">' +
            '<h4>' + esc(p.nome) + '</h4>' +
            '<p class="produto-card-cliente__desc">' + esc(p.descricao || '') + '</p>' +
            '<div class="produto-card-cliente__footer">' +
              '<div class="produto-card-cliente__preco">' + brl(p.preco) + '<small>por unidade</small></div>' +
              '<button class="btn-add-carrinho" data-add="' + p.id + '" title="Adicionar ao carrinho"><i class="fa-solid fa-plus"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    grid.querySelectorAll('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = parseInt(this.dataset.add, 10);
        var prod = produtos.filter(function (x) { return x.id === id; })[0];
        if (prod) abrirModalQuantidade(prod);
      });
    });
  }

  // ========== MODAL DE QUANTIDADE ==========
  function abrirModalQuantidade(produto) {
    var img = imagemDoProduto(produto);
    var ov = document.createElement('div');
    ov.className = 'br-ov';
    ov.innerHTML =
      '<div class="modal-qtd">' +
        '<div class="modal-qtd__img"><img src="' + img + '" onerror="this.src=\'' + IMGS_PADRAO + '\'"></div>' +
        '<div class="modal-qtd__body">' +
          '<h3>' + esc(produto.nome) + '</h3>' +
          '<p>' + esc(produto.descricao || '') + '</p>' +
          '<div class="modal-qtd__preco">' + brl(produto.preco) + '</div>' +
          '<div class="modal-qtd__qtd">' +
            '<span class="modal-qtd__qtd-label">Quantidade:</span>' +
            '<div class="qtd-picker">' +
              '<button type="button" id="qtdMenos"><i class="fa-solid fa-minus"></i></button>' +
              '<input type="number" id="qtdInput" min="1" value="1">' +
              '<button type="button" id="qtdMais"><i class="fa-solid fa-plus"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="modal-qtd__acts">' +
            '<button type="button" class="btn btn--outline" id="btnCancelarQtd">Cancelar</button>' +
            '<button type="button" class="btn btn--primary" id="btnAddQtd"><i class="fa-solid fa-cart-plus"></i> Adicionar</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    var qtdInput = ov.querySelector('#qtdInput');
    function recalc() {
      var q = parseInt(qtdInput.value, 10) || 1;
      if (q < 1) { q = 1; qtdInput.value = 1; }
    }
    ov.querySelector('#qtdMenos').addEventListener('click', function () {
      var q = parseInt(qtdInput.value, 10) || 1;
      if (q > 1) qtdInput.value = q - 1;
    });
    ov.querySelector('#qtdMais').addEventListener('click', function () {
      var q = parseInt(qtdInput.value, 10) || 1;
      qtdInput.value = q + 1;
    });
    qtdInput.addEventListener('input', recalc);

    function fechar() { ov.remove(); }
    ov.querySelector('#btnCancelarQtd').addEventListener('click', fechar);
    ov.addEventListener('click', function (e) { if (e.target === ov) fechar(); });

    ov.querySelector('#btnAddQtd').addEventListener('click', function () {
      var q = parseInt(qtdInput.value, 10) || 1;
      adicionarAoCarrinho(produto, q);
      fechar();
    });
  }

  // ========== CARRINHO ==========
  function adicionarAoCarrinho(produto, qtd) {
    var existente = carrinho.filter(function (i) { return i.id === produto.id; })[0];
    if (existente) {
      existente.qtd += qtd;
    } else {
      carrinho.push({
        id: produto.id,
        nome: produto.nome,
        preco: Number(produto.preco) || 0,
        img: imagemDoProduto(produto),
        qtd: qtd
      });
    }
    salvarCarrinho();
    atualizarBadgeCarrinho();
    toast('"' + produto.nome + '" adicionado ao carrinho! 🛒');
  }

  function salvarCarrinho() {
    try { localStorage.setItem('br_carrinho_cliente', JSON.stringify(carrinho)); } catch (e) {}
  }
  function carregarCarrinho() {
    try { carrinho = JSON.parse(localStorage.getItem('br_carrinho_cliente')) || []; } catch (e) { carrinho = []; }
    atualizarBadgeCarrinho();
  }

  function atualizarBadgeCarrinho() {
    var badge = document.getElementById('cartBadge');
    if (!badge) return;
    var totalQtd = carrinho.reduce(function (s, i) { return s + i.qtd; }, 0);
    if (totalQtd > 0) {
      badge.textContent = totalQtd;
      badge.style.display = 'inline-grid';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderizarCarrinho() {
    var lista = document.getElementById('carrinhoLista');
    if (!lista) return;

    if (!carrinho.length) {
      lista.innerHTML =
        '<div class="empty-state">' +
          '<i class="fa-solid fa-cart-shopping"></i>' +
          '<p>Seu carrinho está vazio.</p>' +
          '<button class="btn btn--primary" id="btnIrParaCardapio2"><i class="fa-solid fa-utensils"></i> Ver Cardápio</button>' +
        '</div>';
      var b = document.getElementById('btnIrParaCardapio2');
      if (b) b.addEventListener('click', function () { navegarPara('cardapio'); });
      atualizarResumo();
      return;
    }

    lista.innerHTML = carrinho.map(function (item, idx) {
      return (
        '<div class="carrinho-item" data-idx="' + idx + '">' +
          '<div class="carrinho-item__img"><img src="' + item.img + '" onerror="this.src=\'' + IMGS_PADRAO + '\'"></div>' +
          '<div class="carrinho-item__info">' +
            '<h4>' + esc(item.nome) + '</h4>' +
            '<span>' + brl(item.preco) + '</span>' +
          '</div>' +
          '<div class="carrinho-item__qtd">' +
            '<button type="button" data-menos="' + idx + '"><i class="fa-solid fa-minus"></i></button>' +
            '<input type="number" min="1" value="' + item.qtd + '" data-input="' + idx + '">' +
            '<button type="button" data-mais="' + idx + '"><i class="fa-solid fa-plus"></i></button>' +
          '</div>' +
          '<button class="carrinho-item__remove" data-remover="' + idx + '" title="Remover"><i class="fa-solid fa-trash"></i></button>' +
        '</div>'
      );
    }).join('');

    lista.querySelectorAll('[data-menos]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(this.dataset.menos, 10);
        if (carrinho[i].qtd > 1) { carrinho[i].qtd--; }
        else { carrinho.splice(i, 1); }
        salvarCarrinho(); atualizarBadgeCarrinho(); renderizarCarrinho();
      });
    });
    lista.querySelectorAll('[data-mais]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(this.dataset.mais, 10);
        carrinho[i].qtd++;
        salvarCarrinho(); atualizarBadgeCarrinho(); renderizarCarrinho();
      });
    });
    lista.querySelectorAll('[data-input]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var i = parseInt(this.dataset.input, 10);
        var v = parseInt(this.value, 10) || 1;
        if (v < 1) v = 1;
        carrinho[i].qtd = v;
        salvarCarrinho(); atualizarBadgeCarrinho(); renderizarCarrinho();
      });
    });
    lista.querySelectorAll('[data-remover]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(this.dataset.remover, 10);
        carrinho.splice(i, 1);
        salvarCarrinho(); atualizarBadgeCarrinho(); renderizarCarrinho();
        toast('Item removido do carrinho.');
      });
    });

    atualizarResumo();
  }

  function atualizarResumo() {
    var sub = carrinho.reduce(function (s, i) { return s + (i.preco * i.qtd); }, 0);
    var taxa = sub * 0.10;
    var total = sub + taxa;
    var elSub = document.getElementById('resumoSubtotal');
    var elTaxa = document.getElementById('resumoTaxa');
    var elTot = document.getElementById('resumoTotal');
    if (elSub) elSub.textContent = brl(sub);
    if (elTaxa) elTaxa.textContent = brl(taxa);
    if (elTot) elTot.textContent = brl(total);
  }

  // ========== FINALIZAR PEDIDO ==========
  var btnFinalizar = document.getElementById('btnFinalizarPedido');
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', function () {
      if (!carrinho.length) return toast('Adicione itens ao carrinho antes de finalizar.', true);
      var sub = carrinho.reduce(function (s, i) { return s + (i.preco * i.qtd); }, 0);
      var taxa = sub * 0.10;
      var total = sub + taxa;
      var obs = (document.getElementById('obsPedido') || {}).value || '';

      var pedido = {
        id: Date.now(),
        numero: '#CLI' + String(Date.now()).slice(-6),
        cliente: usuarioAtual.nome,
        data: new Date().toISOString(),
        status: 'Em preparo',
        obs: obs,
        subtotal: sub,
        taxa: taxa,
        total: total,
        itens: carrinho.map(function (i) {
          return { nome: i.nome, qtd: i.qtd, preco: i.preco };
        })
      };

      var pedidos = [];
      try { pedidos = JSON.parse(localStorage.getItem('br_pedidos_cliente_' + usuarioAtual.email)) || []; } catch (e) {}
      pedidos.unshift(pedido);
      try { localStorage.setItem('br_pedidos_cliente_' + usuarioAtual.email, JSON.stringify(pedidos)); } catch (e) {}

      try {
        var rel = JSON.parse(localStorage.getItem('br_relatorio_balcao')) || [];
        rel.unshift({
          numero: pedido.numero,
          cliente: pedido.cliente,
          total: pedido.total,
          data: pedido.data.split('T')[0],
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: 'Pago',
          mesa: null
        });
        localStorage.setItem('br_relatorio_balcao', JSON.stringify(rel));
      } catch (e) {}

      carrinho = [];
      salvarCarrinho();
      atualizarBadgeCarrinho();
      renderizarCarrinho();

      toast('Pedido ' + pedido.numero + ' realizado com sucesso! 🎉');
      setTimeout(function () {
        navegarPara('pedidos');
        renderizarPedidos();
      }, 800);
    });
  }

  // ========== MEUS PEDIDOS ==========
  function renderizarPedidos() {
    var lista = document.getElementById('pedidosLista');
    if (!lista) return;
    var pedidos = [];
    try { pedidos = JSON.parse(localStorage.getItem('br_pedidos_cliente_' + usuarioAtual.email)) || []; } catch (e) {}

    if (!pedidos.length) {
      lista.innerHTML =
        '<div class="empty-state">' +
          '<i class="fa-solid fa-receipt"></i>' +
          '<p>Você ainda não realizou nenhum pedido.</p>' +
          '<button class="btn btn--primary" id="btnFazerPedido2"><i class="fa-solid fa-utensils"></i> Fazer um Pedido</button>' +
        '</div>';
      var b = document.getElementById('btnFazerPedido2');
      if (b) b.addEventListener('click', function () { navegarPara('cardapio'); });
      return;
    }

    lista.innerHTML = pedidos.map(function (p) {
      var statusClass = 'status-pill--preparo';
      if (p.status === 'Em rota') statusClass = 'status-pill--rota';
      else if (p.status === 'Entregue') statusClass = 'status-pill--entregue';
      else if (p.status === 'Cancelado') statusClass = 'status-pill--cancelado';

      var dataFmt = '';
      try {
        var d = new Date(p.data);
        dataFmt = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } catch (e) {}

      var itensHtml = p.itens.map(function (i) {
        return '<strong>' + i.qtd + 'x</strong> ' + esc(i.nome);
      }).join(' • ');

      return (
        '<div class="pedido-card">' +
          '<div class="pedido-card__head">' +
            '<div class="pedido-card__num">' + esc(p.numero) + '<small>' + dataFmt + '</small></div>' +
            '<div class="pedido-card__total">' + brl(p.total) + '</div>' +
          '</div>' +
          '<div class="pedido-card__itens">' + itensHtml + '</div>' +
          (p.obs ? '<div class="pedido-card__itens"><strong>Obs:</strong> ' + esc(p.obs) + '</div>' : '') +
          '<div class="pedido-card__foot">' +
            '<span class="status-pill ' + statusClass + '"><i class="fa-solid fa-circle" style="font-size:8px;"></i> ' + esc(p.status) + '</span>' +
            '<span style="font-size:12px;color:var(--text-dim);">Total: ' + brl(p.total) + '</span>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  var btnAtualizarPedidos = document.getElementById('btnAtualizarPedidos');
  if (btnAtualizarPedidos) {
    btnAtualizarPedidos.addEventListener('click', function () {
      renderizarPedidos();
      toast('Pedidos atualizados.');
    });
  }

  // ========== BUSCA NO CARDÁPIO ==========
  var buscaInput = document.getElementById('topSearch');
  if (buscaInput) {
    buscaInput.addEventListener('input', function () {
      var q = this.value.toLowerCase().trim();
      var grid = document.getElementById('cardapioGrid');
      if (!grid) return;
      var lista = produtos.filter(function (p) {
        var okCat = categoriaAtiva === 'todos' || p.categoria === categoriaAtiva;
        var okBusca = !q || (p.nome || '').toLowerCase().indexOf(q) > -1 || (p.descricao || '').toLowerCase().indexOf(q) > -1;
        return okCat && okBusca;
      });
      if (!lista.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>Nenhum produto encontrado para "' + esc(q) + '".</p></div>';
        return;
      }
      grid.innerHTML = lista.map(function (p) {
        var img = imagemDoProduto(p);
        return (
          '<div class="produto-card-cliente" data-id="' + p.id + '">' +
            '<div class="produto-card-cliente__img">' +
              '<img src="' + img + '" alt="' + esc(p.nome) + '" onerror="this.src=\'' + IMGS_PADRAO + '\'">' +
              (p.categoria ? '<span class="produto-card-cliente__badge">' + esc(p.categoria) + '</span>' : '') +
            '</div>' +
            '<div class="produto-card-cliente__body">' +
              '<h4>' + esc(p.nome) + '</h4>' +
              '<p class="produto-card-cliente__desc">' + esc(p.descricao || '') + '</p>' +
              '<div class="produto-card-cliente__footer">' +
                '<div class="produto-card-cliente__preco">' + brl(p.preco) + '<small>por unidade</small></div>' +
                '<button class="btn-add-carrinho" data-add="' + p.id + '" title="Adicionar ao carrinho"><i class="fa-solid fa-plus"></i></button>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      grid.querySelectorAll('[data-add]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var id = parseInt(this.dataset.add, 10);
          var prod = produtos.filter(function (x) { return x.id === id; })[0];
          if (prod) abrirModalQuantidade(prod);
        });
      });
    });
  }

  // ========== INICIALIZAÇÃO ==========
  console.log('[dashboard_cliente] Inicializando...');
  carregarCarrinho();
  carregarCardapio();
  renderizarCarrinho();
  renderizarPedidos();
})();