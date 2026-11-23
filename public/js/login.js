// Login e cadastro Boi Ralado
(function () {
  'use strict';
  var tipoUsuario = 'funcionario';
  var botoesTipo = document.querySelectorAll('.user-type-selector button');
  var camposEndereco = document.getElementById('clientAddressFields');
  var registerForm = document.getElementById('registerForm');
  var registerError = document.getElementById('registerError');
  var registerSuccess = document.getElementById('registerSuccess');
  var loginForm = document.getElementById('loginForm');
  var loginError = document.getElementById('loginError');
  function digitos(v) { return String(v || '').replace(/\D/g, ''); }
  function emailValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
  function cpfValido(cpf) {
    cpf = digitos(cpf); if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var soma=0, resto, i; for(i=1;i<=9;i++) soma += Number(cpf.charAt(i-1))*(11-i);
    resto=(soma*10)%11; if(resto===10||resto===11) resto=0; if(resto!==Number(cpf.charAt(9))) return false;
    soma=0; for(i=1;i<=10;i++) soma += Number(cpf.charAt(i-1))*(12-i);
    resto=(soma*10)%11; if(resto===10||resto===11) resto=0; return resto===Number(cpf.charAt(10));
  }
  function telefoneValido(v) { return digitos(v).length >= 10 && digitos(v).length <= 11; }
  function nomeValido(v) { return String(v || '').trim().length >= 3 && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(v); }
  function lerUsuarios() { try { return JSON.parse(localStorage.getItem('br_usuarios')) || []; } catch(e) { return []; } }
  function salvarUsuarios(v) { localStorage.setItem('br_usuarios', JSON.stringify(v)); }
  function erroLogin(msg) { if (!loginError) return; loginError.querySelector('span').textContent=msg; loginError.classList.add('show'); }
  function erroCadastro(msg) { if (!registerError) return; registerError.querySelector('span').textContent=msg; registerError.classList.add('show'); }
  var tabs=document.querySelectorAll('.auth-tab');
  function switchTab(tab) {
    tabs.forEach(function(x){x.classList.toggle('active',x.dataset.tab===tab);});
    ['login','register'].forEach(function(k){var el=document.getElementById(k==='login'?'panelLogin':'panelRegister'); if(el) el.classList.toggle('active',k===tab);});
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){switchTab(t.dataset.tab);});});
  function atualizarTipo(tipo) {
    tipoUsuario=tipo;
    botoesTipo.forEach(function(b){b.classList.toggle('active',b.dataset.type===tipo);});
    if(camposEndereco) camposEndereco.style.display=tipo==='cliente'?'block':'none';
    if(registerForm) registerForm.querySelectorAll('.client-required').forEach(function(el){el.style.display=tipo==='cliente'?'inline':'none';});
  }
  botoesTipo.forEach(function(btn){btn.addEventListener('click',function(){atualizarTipo(this.dataset.type);});});
  document.querySelectorAll('.toggle-pass').forEach(function(btn){btn.addEventListener('click',function(){var input=document.getElementById(btn.dataset.target);if(!input)return;input.type=input.type==='password'?'text':'password';btn.innerHTML=input.type==='text'?'<i class="fa-solid fa-eye-slash"></i>':'<i class="fa-solid fa-eye"></i>';});});
  var cpf=document.getElementById('regCpf'); if(cpf) cpf.addEventListener('input',function(){var v=digitos(this.value).slice(0,11).replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');this.value=v;});
  var tel=document.getElementById('regTelefone'); if(tel) tel.addEventListener('input',function(){var v=digitos(this.value).slice(0,11).replace(/^(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d{1,4})$/,'$1-$2');this.value=v;});
  var cep=document.getElementById('regCep'); if(cep) cep.addEventListener('input',function(){var v=digitos(this.value).slice(0,8);this.value=v.length>5?v.slice(0,5)+'-'+v.slice(5):v;});
  if(loginForm) loginForm.addEventListener('submit',function(e){
    e.preventDefault(); if(loginError) loginError.classList.remove('show');
    var user=document.getElementById('loginUser').value.trim(); var senha=document.getElementById('loginPass').value;
    if(!user) return erroLogin('Informe seu e-mail ou CPF.');
    if(!emailValido(user)&&!cpfValido(user)) return erroLogin('Informe um e-mail ou CPF válido.');
    if(senha.length<6) return erroLogin('A senha deve ter no mínimo 6 caracteres.');
    var userEmail=user.toLowerCase(), userCpf=digitos(user);
    var encontrado=lerUsuarios().find(function(u){return (String(u.email||'').toLowerCase()===userEmail || (userCpf.length===11&&digitos(u.cpf)===userCpf))&&u.senha===senha;});
    if(!encontrado) return erroLogin('Usuário ou senha inválidos.');
    var papel=encontrado.papel || (tipoUsuario==='funcionario'?'Funcionário':'Cliente');
    localStorage.setItem('br_usuario_atual',JSON.stringify({id:encontrado.id||null,nome:encontrado.nome,email:encontrado.email,cpf:encontrado.cpf,telefone:encontrado.telefone,papel:papel,endereco:encontrado.endereco||'',cep:encontrado.cep||'',numero:encontrado.numero||'',complemento:encontrado.complemento||'',bairro:encontrado.bairro||'',cidade:encontrado.cidade||'',estado:encontrado.estado||''}));
    location.href=papel==='Cliente'?'dashboard_cliente.html':'index.html';
  });
  if(registerForm) registerForm.addEventListener('submit',function(e){
    e.preventDefault(); if(registerError)registerError.classList.remove('show'); if(registerSuccess)registerSuccess.classList.remove('show');
    var nome=document.getElementById('regNome').value.trim(), cpfValor=document.getElementById('regCpf').value, email=document.getElementById('regEmail').value.trim(), telefone=document.getElementById('regTelefone').value;
    var senha=document.getElementById('regSenha').value, senha2=document.getElementById('regSenhaConfirma').value, termos=document.getElementById('regTermos').checked;
    if(!nomeValido(nome))return erroCadastro('Informe um nome válido.'); if(!cpfValido(cpfValor))return erroCadastro('CPF inválido.'); if(!emailValido(email))return erroCadastro('E-mail inválido.'); if(!telefoneValido(telefone))return erroCadastro('Telefone inválido.');
    if(senha.length<6)return erroCadastro('A senha deve ter no mínimo 6 caracteres.'); if(senha!==senha2)return erroCadastro('As senhas não coincidem.'); if(!termos)return erroCadastro('Você precisa aceitar os termos de uso.');
    var endereco={cep:(document.getElementById('regCep')||{}).value||'',endereco:(document.getElementById('regEndereco')||{}).value||'',numero:(document.getElementById('regNumero')||{}).value||'',complemento:(document.getElementById('regComplemento')||{}).value||'',bairro:(document.getElementById('regBairro')||{}).value||'',cidade:(document.getElementById('regCidade')||{}).value||'',estado:(document.getElementById('regEstado')||{}).value||''};
    if(tipoUsuario==='cliente'){
      if(digitos(endereco.cep).length!==8)return erroCadastro('Informe um CEP válido com 8 números.');
      if(!endereco.endereco.trim()||!endereco.numero.trim()||!endereco.bairro.trim()||!endereco.cidade.trim()||!endereco.estado.trim())return erroCadastro('Preencha rua, número, bairro, cidade e estado para entrega.');
    }
    var usuarios=lerUsuarios(), cpfDigits=digitos(cpfValor);
    if(usuarios.some(function(u){return String(u.email||'').toLowerCase()===email.toLowerCase()||digitos(u.cpf)===cpfDigits;}))return erroCadastro('E-mail ou CPF já cadastrado.');
    var novo={nome:nome,cpf:cpfDigits,email:email,telefone:digitos(telefone),senha:senha,papel:tipoUsuario==='funcionario'?'Funcionário':'Cliente'};
    if(tipoUsuario==='cliente')Object.keys(endereco).forEach(function(k){novo[k]=endereco[k].trim();});
    usuarios.push(novo); salvarUsuarios(usuarios);
    if(registerSuccess)registerSuccess.classList.add('show'); registerForm.reset();
    if(novo.papel==='Cliente'){
      localStorage.setItem('br_usuario_atual',JSON.stringify({nome:novo.nome,email:novo.email,cpf:novo.cpf,telefone:novo.telefone,papel:novo.papel,cep:novo.cep,endereco:novo.endereco,numero:novo.numero,complemento:novo.complemento,bairro:novo.bairro,cidade:novo.cidade,estado:novo.estado}));
      setTimeout(function(){location.href='dashboard_cliente.html';},900);
    } else {
      setTimeout(function(){if(registerSuccess)registerSuccess.classList.remove('show');switchTab('login');var lu=document.getElementById('loginUser');if(lu)lu.value=email;var lp=document.getElementById('loginPass');if(lp){lp.value='';lp.focus();}},1200);
    }
  });
  atualizarTipo('funcionario');
})();
