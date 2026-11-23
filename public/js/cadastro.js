// cadastro.js
(function () {
  'use strict';

  var tabs = document.querySelectorAll('.auth-tab');
  var panels = { login: document.getElementById('panelLogin'), register: document.getElementById('panelRegister') };

  function switchTab(target) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === target));
    Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle('active', key === target));
  }

  tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  document.querySelectorAll('[data-tab]').forEach(el => {
    if (!el.classList.contains('auth-tab')) {
      el.addEventListener('click', (e) => { e.preventDefault(); switchTab(el.dataset.tab); });
    }
  });

  // Alternar campos Cliente / Funcionário
  var regTipo = document.getElementById('regTipo');
  var fieldsetCliente = document.getElementById('fieldsetCliente');
  var fieldsetFuncionario = document.getElementById('fieldsetFuncionario');
  
  if (regTipo) {
    regTipo.addEventListener('change', function () {
      if (this.value === 'Funcionario') {
        fieldsetCliente.classList.remove('active');
        fieldsetFuncionario.classList.add('active');
      } else {
        fieldsetCliente.classList.add('active');
        fieldsetFuncionario.classList.remove('active');
      }
    });
  }

  // Máscara CPF
  var cpfInput = document.getElementById('regCpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', () => {
      let v = cpfInput.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      cpfInput.value = v;
    });
  }

  // LOGIN
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var user = document.getElementById('loginUser').value.trim();
      var pass = document.getElementById('loginPass').value.trim();
      if (!user || !pass) return alert('Preencha todos os campos.');

      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, cpf: user, senha: pass })
      }).then(r => r.json()).then(res => {
        if (!res.ok) return alert(res.erro || 'Credenciais inválidas.');
        var u = res.dados;
        localStorage.setItem('br_usuario_atual', JSON.stringify(u));
        if (u.papel === 'Cliente') {
          location.href = 'dashboard_cliente.html';
        } else {
          location.href = 'index.html';
        }
      }).catch(() => alert('Erro ao conectar com o servidor.'));
    });
  }

  // CADASTRO
  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var tipo = document.getElementById('regTipo').value;
      var nome = document.getElementById('regNome').value.trim();
      var email = document.getElementById('regEmail').value.trim();
      var cpf = document.getElementById('regCpf').value.trim();
      var senha = document.getElementById('regSenha').value;

      if (!nome || !email || !cpf || !senha) return alert('Preencha todos os campos obrigatórios.');
      if (senha.length < 6) return alert('A senha deve ter no mínimo 6 caracteres.');

      var payload = { nome, email, cpf, senha, papel: tipo };

      if (tipo === 'Cliente') {
        payload.endereco = document.getElementById('regEndereco').value.trim();
        payload.cep = document.getElementById('regCep').value.trim();
      } else {
        payload.cargo = document.getElementById('regCargo').value;
        if (!payload.cargo) return alert('Selecione um cargo.');
      }

      fetch('/api/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(res => {
        if (!res.ok) return alert(res.erro || 'Erro ao cadastrar.');
        var u = { nome, email, cpf, papel: tipo, cargo: payload.cargo || null, foto: null };
        localStorage.setItem('br_usuario_atual', JSON.stringify(u));
        alert('Cadastro realizado com sucesso!');
        if (tipo === 'Cliente') {
          location.href = 'dashboard_cliente.html';
        } else {
          location.href = 'index.html';
        }
      }).catch(() => alert('Erro ao conectar com o servidor.'));
    });
  }
})();