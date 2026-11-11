// perfil.js — Lógica da página de perfil (visualizar, editar dados, trocar senha)
(function () {
  'use strict';

  var API_CLIENTES = '/api/clientes';
  var API_UPLOAD_AVATAR = '/api/upload-avatar';

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function toast(msg, err) {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:' + (err ? '#b3261e' : '#2b0a0a') + ';color:#fff;padding:12px 18px;border-radius:10px;z-index:999999;font:500 14px Poppins,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:340px;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }
  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }

  function brData(iso) {
    if (!iso) return '';
    var p = String(iso).split('T')[0].split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }
  function brCpf(cpf) {
    var d = soDigitos(cpf);
    if (d.length !== 11) return cpf || '';
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  function brTelefone(tel) {
    var d = soDigitos(tel);
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    return tel || '';
  }

  function mascaraCpf(v) {
    v = soDigitos(v).slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2');
    return v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  function mascaraTelefone(v) {
    v = soDigitos(v).slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/, '($1) $2');
    return v.length > 13
      ? v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
      : v.replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  function lerUsuarios() {
    try { return JSON.parse(localStorage.getItem('br_usuarios')) || []; }
    catch (e) { return []; }
  }
  function salvarUsuarios(lista) {
    localStorage.setItem('br_usuarios', JSON.stringify(lista));
  }

  var usuario = null;
  try { usuario = JSON.parse(localStorage.getItem('br_usuario_atual')); } catch (e) {}

  if (!usuario) {
    location.href = 'login.html';
    return;
  }

  var dadosCliente = null;

  function buscarCliente() {
    return fetch(API_CLIENTES)
      .then(function (r) { return r.json(); })
      .then(function (lista) {
        var arr = (lista && lista.dados) ? lista.dados : (Array.isArray(lista) ? lista : []);
        var cpfDigits = soDigitos(usuario.cpf || '');
        var achado = arr.filter(function (c) {
          var bateEmail = (c.email || '').toLowerCase() === String(usuario.email || '').toLowerCase();
          var bateCpf = cpfDigits && soDigitos(c.cpf) === cpfDigits;
          return bateEmail || bateCpf;
        })[0];
        return achado || null;
      })
      .catch(function () { return null; });
  }

  function preencherTela() {
    var nome = (dadosCliente && dadosCliente.nome) || usuario.nome || 'Usuário';
    var email = (dadosCliente && dadosCliente.email) || usuario.email || '';
    var cpf = (dadosCliente && dadosCliente.cpf) || usuario.cpf || '';
    var tel = (dadosCliente && dadosCliente.telefone) || usuario.telefone || '';
    var desde = (dadosCliente && dadosCliente.data_cadastro) || usuario.data_cadastro || '';
    var papel = usuario.papel || 'Cliente';

    $('#perfilNome').textContent = nome;
    $('#perfilPapel').textContent = papel;
    $('#perfilNomeCompleto').textContent = nome || 'Não informado';
    $('#perfilEmail').textContent = email || 'Não informado';
    $('#perfilCpf').textContent = cpf ? brCpf(cpf) : 'Não informado';
    $('#perfilTelefone').textContent = tel ? brTelefone(tel) : 'Não informado';
    $('#perfilDesde').textContent = desde ? brData(desde) : '—';

    if (!nome) $('#perfilNomeCompleto').classList.add('perfil-row__value--vazio');
    if (!email) $('#perfilEmail').classList.add('perfil-row__value--vazio');
    if (!cpf)   $('#perfilCpf').classList.add('perfil-row__value--vazio');
    if (!tel)   $('#perfilTelefone').classList.add('perfil-row__value--vazio');

    var fotoUrl = (dadosCliente && dadosCliente.foto) || (usuario && usuario.foto) || '';
    renderizarAvatar(fotoUrl, nome);
  }

  function renderizarAvatar(url, nome) {
    var slot = $('#avatarSlot');
    if (!slot) return;
    if (url) {
      slot.innerHTML = '<img src="' + esc(url) + '" alt="Foto de perfil" class="perfil-avatar-img" onerror="this.style.display=\'none\'">';
    } else {
      var partes = String(nome || '').split(' ');
      var ini = ((partes[0] || '')[0] || '') + ((partes[1] || '')[0] || '');
      slot.innerHTML = '<div class="perfil-avatar-fallback">' + esc((ini || 'BR').toUpperCase()) + '</div>';
    }
  }

  var btnTrocar = $('#btnTrocarFoto');
  var inputFoto = $('#inputFotoPerfil');

  if (btnTrocar) btnTrocar.addEventListener('click', function () { inputFoto.click(); });

  if (inputFoto) {
    inputFoto.addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;

      if (file.size > 3 * 1024 * 1024) {
        toast('A imagem deve ter no máximo 3 MB.', true);
        inputFoto.value = '';
        return;
      }
      if (!/^image\//.test(file.type)) {
        toast('Envie apenas arquivos de imagem.', true);
        inputFoto.value = '';
        return;
      }

      var reader = new FileReader();
      reader.onload = function (e) {
        var base64 = e.target.result;
        renderizarAvatar(base64, (dadosCliente && dadosCliente.nome) || usuario.nome || '');

        fetch(API_UPLOAD_AVATAR, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: file.name, imagem: base64, cliente_id: (dadosCliente && dadosCliente.id) || null })
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (!res.ok || !res.dados || !res.dados.url) {
              throw new Error((res && res.erro) || 'Falha no upload.');
            }
            var urlFinal = res.dados.url;
            usuario.foto = urlFinal;
            localStorage.setItem('br_usuario_atual', JSON.stringify(usuario));
            if (dadosCliente) dadosCliente.foto = urlFinal;
            renderizarAvatar(urlFinal, usuario.nome);
            toast('Foto atualizada!');
          })
          .catch(function (err) {
            toast('Erro ao enviar foto: ' + err.message, true);
            renderizarAvatar((dadosCliente && dadosCliente.foto) || usuario.foto || '', usuario.nome);
          });
      };
      reader.readAsDataURL(file);
    });
  }

  var modoVisualizar = $('#modoVisualizar');
  var modoEditar = $('#modoEditar');
  var btnEditar = $('#btnEditarPerfil');
  var btnCancelar = $('#btnCancelarEdicao');
  var btnSalvar = $('#btnSalvarPerfil');
  var editNome = $('#editNome');
  var editEmail = $('#editEmail');
  var editCpf = $('#editCpf');
  var editTelefone = $('#editTelefone');

  function entrarModoEdicao() {
    var nome = (dadosCliente && dadosCliente.nome) || usuario.nome || '';
    var email = (dadosCliente && dadosCliente.email) || usuario.email || '';
    var cpf = (dadosCliente && dadosCliente.cpf) || usuario.cpf || '';
    var tel = (dadosCliente && dadosCliente.telefone) || usuario.telefone || '';

    editNome.value = nome;
    editEmail.value = email;
    editCpf.value = cpf ? brCpf(cpf) : '';
    editTelefone.value = tel ? brTelefone(tel) : '';

    modoVisualizar.style.display = 'none';
    modoEditar.style.display = 'block';
    editNome.focus();
  }

  function sairModoEdicao() {
    modoVisualizar.style.display = 'block';
    modoEditar.style.display = 'none';
  }

  if (btnEditar) btnEditar.addEventListener('click', entrarModoEdicao);
  if (btnCancelar) btnCancelar.addEventListener('click', sairModoEdicao);

  if (editCpf) editCpf.addEventListener('input', function () { this.value = mascaraCpf(this.value); });
  if (editTelefone) editTelefone.addEventListener('input', function () { this.value = mascaraTelefone(this.value); });

  if (btnSalvar) {
    btnSalvar.addEventListener('click', function () {
      var nome = editNome.value.trim();
      var email = editEmail.value.trim();
      var cpf = soDigitos(editCpf.value);
      var tel = soDigitos(editTelefone.value);

      if (!nome || nome.length < 3) return toast('Informe um nome válido (mínimo 3 letras).', true);
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Informe um e-mail válido.', true);
      if (cpf && cpf.length !== 11) return toast('CPF inválido.', true);
      if (tel && tel.length < 10) return toast('Telefone inválido.', true);

      btnSalvar.disabled = true;
      btnSalvar.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';

      var payload = {
        nome: nome,
        cpf: cpf || null,
        email: email,
        telefone: tel || null
      };

      var metodo = (dadosCliente && dadosCliente.id) ? 'PUT' : 'POST';
      var url = (dadosCliente && dadosCliente.id)
        ? API_CLIENTES + '/' + dadosCliente.id
        : API_CLIENTES;

      fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.erro || 'Erro ao salvar.');

          if (!dadosCliente) dadosCliente = { id: res.dados.id };

          dadosCliente.nome = nome;
          dadosCliente.email = email;
          dadosCliente.cpf = cpf;
          dadosCliente.telefone = tel;

          usuario.nome = nome;
          usuario.email = email;
          usuario.cpf = cpf;
          usuario.telefone = tel;
          localStorage.setItem('br_usuario_atual', JSON.stringify(usuario));

          var lista = lerUsuarios();
          var emailAntigo = usuario.email || '';
          for (var i = 0; i < lista.length; i++) {
            var u = lista[i];
            var bate = (u.email && u.email.toLowerCase() === emailAntigo.toLowerCase());
            if (bate) {
              lista[i].nome = nome;
              lista[i].email = email;
              if (cpf) lista[i].cpf = cpf;
              if (tel) lista[i].telefone = tel;
              break;
            }
          }
          salvarUsuarios(lista);

          var headerNome = document.querySelector('.header__user-name');
          if (headerNome) headerNome.textContent = nome;
          var headerAvatar = document.querySelector('.header__user-avatar');
          if (headerAvatar && !usuario.foto) {
            var partes = nome.split(' ');
            var ini = ((partes[0] || '')[0] || '') + ((partes[1] || '')[0] || '');
            headerAvatar.textContent = (ini || 'BR').toUpperCase();
          }

          preencherTela();
          sairModoEdicao();
          toast('Dados atualizados com sucesso!');
        })
        .catch(function (err) {
          toast('Erro ao salvar: ' + err.message, true);
        })
        .then(function () {
          btnSalvar.disabled = false;
          btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações';
        });
    });
  }

  var btnAlterarSenha = $('#btnAlterarSenha');
  var senhaAtualEl = $('#senhaAtual');
  var senhaNovaEl = $('#senhaNova');
  var senhaConfirmaEl = $('#senhaConfirma');

  if (btnAlterarSenha) {
    btnAlterarSenha.addEventListener('click', function () {
      var atual = senhaAtualEl.value;
      var nova = senhaNovaEl.value;
      var confirma = senhaConfirmaEl.value;

      if (!atual) return toast('Informe a senha atual.', true);
      if (!nova || nova.length < 6) return toast('A nova senha deve ter no mínimo 6 caracteres.', true);
      if (nova !== confirma) return toast('A confirmação não bate com a nova senha.', true);
      if (nova === atual) return toast('A nova senha deve ser diferente da atual.', true);

      var lista = lerUsuarios();
      if (!lista.length) return toast('Nenhum usuário cadastrado.', true);

      var cpfDigits = soDigitos(usuario.cpf || '');
      var emailLogado = (usuario.email || '').toLowerCase();

      var idx = -1;
      for (var i = 0; i < lista.length; i++) {
        var u = lista[i];
        var bateEmail = (u.email || '').toLowerCase() === emailLogado;
        var bateCpf = cpfDigits && soDigitos(u.cpf) === cpfDigits;
        if (bateEmail || bateCpf) { idx = i; break; }
      }

      if (idx === -1) return toast('Usuário logado não encontrado.', true);
      if (lista[idx].senha !== atual) return toast('Senha atual incorreta.', true);

      lista[idx].senha = nova;
      salvarUsuarios(lista);

      senhaAtualEl.value = '';
      senhaNovaEl.value = '';
      senhaConfirmaEl.value = '';
      toast('Senha alterada com sucesso!');
    });
  }

  var btnSair = $('#btnSairPerfil');
  if (btnSair) {
    btnSair.addEventListener('click', function () {
      if (!confirm('Deseja realmente sair da conta?')) return;
      localStorage.removeItem('br_usuario_atual');
      location.href = 'login.html';
    });
  }

  preencherTela();
  buscarCliente().then(function (c) {
    dadosCliente = c;
    preencherTela();
  });

})();