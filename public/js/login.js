// login.js — Lógica específica da página de login
(function () {
  'use strict';

  var tipoUsuario = 'funcionario';
  var botoesTipo = document.querySelectorAll('.user-type-selector button');
  botoesTipo.forEach(function(btn) {
      btn.addEventListener('click', function() {
          botoesTipo.forEach(function(b) { b.classList.remove('active'); });
          this.classList.add('active');
          tipoUsuario = this.dataset.type;
      });
  });

  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }
  function validaEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()); }
  function validaCPF(cpf) {
    cpf = soDigitos(cpf);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var soma = 0, resto, i;
    for (i = 1; i <= 9; i++) soma += parseInt(cpf.charAt(i - 1), 10) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9), 10)) return false;
    soma = 0;
    for (i = 1; i <= 10; i++) soma += parseInt(cpf.charAt(i - 1), 10) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10), 10)) return false;
    return true;
  }
  function validaTelefone(tel) { var d = soDigitos(tel); return d.length >= 10 && d.length <= 11; }
  function nomeValido(nome) {
    nome = String(nome || '').trim();
    if (nome.length < 3) return false;
    if (/^\d+$/.test(nome)) return false;
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(nome)) return false;
    if (/\s{2,}/.test(nome)) return false;
    return true;
  }

  function lerUsuarios() {
    try { return JSON.parse(localStorage.getItem('br_usuarios')) || []; }
    catch (e) { return []; }
  }
  function salvarUsuarios(lista) { localStorage.setItem('br_usuarios', JSON.stringify(lista)); }

  var tabs = document.querySelectorAll('.auth-tab');
  var panels = {
    login: document.getElementById('panelLogin'),
    register: document.getElementById('panelRegister')
  };
  function switchTab(t) {
    tabs.forEach(function (x) { x.classList.toggle('active', x.dataset.tab === t); });
    Object.keys(panels).forEach(function (k) {
      if (panels[k]) panels[k].classList.toggle('active', k === t);
    });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { switchTab(t.dataset.tab); });
  });

  document.querySelectorAll('.toggle-pass').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.dataset.target);
      if (!input) return;
      var isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  });

  var cpfInput = document.getElementById('regCpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', function () {
      var v = soDigitos(this.value).slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      this.value = v;
    });
  }
  var telInput = document.getElementById('regTelefone');
  if (telInput) {
    telInput.addEventListener('input', function () {
      var v = soDigitos(this.value).slice(0, 11);
      v = v.replace(/^(\d{2})(\d)/, '($1) $2');
      v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
      this.value = v;
    });
  }

  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');

  function mostrarErroLogin(msg) {
    loginError.querySelector('span').textContent = msg;
    loginError.classList.add('show');
  }

    if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      loginError.classList.remove('show');

      var user = document.getElementById('loginUser').value.trim();
      var pass = document.getElementById('loginPass').value;

      if (!user) return mostrarErroLogin('Informe seu e-mail ou CPF.');
      if (!validaEmail(user) && !validaCPF(user)) return mostrarErroLogin('Informe um e-mail válido ou um CPF válido.');
      if (!pass) return mostrarErroLogin('Informe sua senha.');
      if (pass.length < 6) return mostrarErroLogin('A senha deve ter no mínimo 6 caracteres.');

      var usuarios = lerUsuarios();
      if (!usuarios.length) return mostrarErroLogin('Nenhum usuário cadastrado. Use a aba "Cadastrar" primeiro.');

      var userDigits = soDigitos(user);
      var encontrado = usuarios.filter(function (u) {
        var bateUser = (u.email === user) || (u.cpf === userDigits);
        return bateUser && u.senha === pass;
      })[0];

      if (!encontrado) return mostrarErroLogin('Usuário ou senha inválidos.');

      // --- REDIRECIONAMENTO BASEADO NO PAPEL ---
      var papelReal = encontrado.papel || (tipoUsuario === 'funcionario' ? 'Funcionário' : 'Cliente');
      
      localStorage.setItem('br_usuario_atual', JSON.stringify({
        nome: encontrado.nome,
        email: encontrado.email,
        papel: papelReal
      }));

      if (papelReal === 'Cliente') {
        window.location.href = 'dashboard_cliente.html';
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      registerError.classList.remove('show');
      registerSuccess.classList.remove('show');

      var nome = document.getElementById('regNome').value.trim();
      var cpf = document.getElementById('regCpf').value.trim();
      var email = document.getElementById('regEmail').value.trim();
      var telefone = document.getElementById('regTelefone').value.trim();
      var senha = document.getElementById('regSenha').value;
      var senha2 = document.getElementById('regSenhaConfirma').value;
      var termos = document.getElementById('regTermos').checked;

      if (!nomeValido(nome)) return mostrarErroCad('Informe um nome válido (mínimo 3 letras).');
      if (!validaCPF(cpf)) return mostrarErroCad('CPF inválido.');
      if (!validaEmail(email)) return mostrarErroCad('E-mail inválido.');
      if (!validaTelefone(telefone)) return mostrarErroCad('Telefone inválido (DDD + número).');
      if (senha.length < 6) return mostrarErroCad('A senha deve ter no mínimo 6 caracteres.');
      if (senha !== senha2) return mostrarErroCad('As senhas não coincidem.');
      if (!termos) return mostrarErroCad('Você precisa aceitar os termos de uso.');

      var usuarios = lerUsuarios();
      var cpfDigits = soDigitos(cpf);
      var duplicado = usuarios.some(function (u) {
        return u.email === email || u.cpf === cpfDigits;
      });
      if (duplicado) return mostrarErroCad('E-mail ou CPF já cadastrado.');

      usuarios.push({
        nome: nome,
        cpf: cpfDigits,
        email: email,
        telefone: soDigitos(telefone),
        senha: senha,
        papel: tipoUsuario === 'funcionario' ? 'Funcionário' : 'Cliente'
      });
      salvarUsuarios(usuarios);

      registerSuccess.classList.add('show');
      registerForm.reset();

      setTimeout(function () {
        registerSuccess.classList.remove('show');
        switchTab('login');
        var loginUser = document.getElementById('loginUser');
        if (loginUser) loginUser.value = email;
        var loginPass = document.getElementById('loginPass');
        if (loginPass) { loginPass.value = ''; loginPass.focus(); }
      }, 1400);
    });
  }
})();