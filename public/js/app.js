const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const formUpload = document.getElementById('formUpload');
const galeria = document.getElementById('galeria');
const periodoAviso = document.getElementById('periodoAviso');
const andarSelect = document.getElementById('andar');
const apartamentoSelect = document.getElementById('apartamento');

// Elementos de paginação
const paginacaoControles = document.getElementById('paginacaoControles');
const itensPorPaginaSelect = document.getElementById('itensPorPagina');
const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
const btnProximaPagina = document.getElementById('btnProximaPagina');
const infoPagina = document.getElementById('infoPagina');

let currentUser = null;
let periodo = { inicio: null, fim: null };
let isAdmin = false;
const ADMIN_EMAILS = ['jhessymary26@gmail.com'];
let usuarioJaEnviou = false;
let termosAceitos = localStorage.getItem('termosAceitosNatal2025') === 'true';

// Variáveis de paginação
let todasFotos = [];
let paginaAtual = 1;
let itensPorPagina = 10;

function fmt(d){ return new Date(d.seconds*1000).toLocaleString('pt-BR'); }

// ===== MODAL DE TERMOS =====
const termosModal = document.getElementById('termosModal');
const btnAceitarTermos = document.getElementById('btnAceitarTermos');
const btnRecusarTermos = document.getElementById('btnRecusarTermos');
const verTermosCompletos = document.getElementById('verTermosCompletos');

function mostrarTermos() {
  if (termosModal) termosModal.classList.remove('hidden');
}

function fecharTermos() {
  if (termosModal) termosModal.classList.add('hidden');
}

btnAceitarTermos?.addEventListener('click', () => {
  termosAceitos = true;
  localStorage.setItem('termosAceitosNatal2025', 'true');
  fecharTermos();
  
  // Se não estiver logado, pedir login
  if (!currentUser) {
    alert('Agora você precisa fazer login com sua conta Google para continuar.');
    loginBtn?.click();
  }
});

btnRecusarTermos?.addEventListener('click', () => {
  fecharTermos();
  alert('Você precisa aceitar os termos para participar da votação natalina.');
});

verTermosCompletos?.addEventListener('click', () => {
  // Scroll para o termo completo no topo da página
  fecharTermos();
  const termoCompleto = document.querySelector('details');
  if (termoCompleto) {
    termoCompleto.open = true;
    termoCompleto.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Atualizar apartamentos baseado no andar selecionado
andarSelect?.addEventListener('change', function() {
  const andar = parseInt(this.value);
  if (!andar) {
    apartamentoSelect.disabled = true;
    apartamentoSelect.innerHTML = '<option value="">Selecione o andar primeiro</option>';
    return;
  }
  
  apartamentoSelect.disabled = false;
  apartamentoSelect.innerHTML = '<option value="">Selecione o apartamento</option>';
  
  // Gerar apartamentos de X01 a X08
  for (let i = 1; i <= 8; i++) {
    const numApto = andar * 100 + i; // Ex: andar 2 = 201, 202... andar 19 = 1901, 1902...
    const option = document.createElement('option');
    option.value = numApto;
    option.textContent = numApto;
    apartamentoSelect.appendChild(option);
  }
});

// Verificar se usuário já enviou foto
async function verificarEnvioUsuario() {
  if (!currentUser) {
    usuarioJaEnviou = false;
    return;
  }
  
  try {
    const snap = await db.collection('fotos_natal')
      .where('uploadPor', '==', currentUser.uid)
      .limit(1)
      .get();
    
    usuarioJaEnviou = !snap.empty;
    
    const msg = document.getElementById('msg');
    const submitBtn = formUpload?.querySelector('button[type="submit"]');
    
    if (usuarioJaEnviou && snap.docs[0]) {
      const dadosFoto = snap.docs[0].data();
      if (msg) {
        msg.className = 'text-sm mt-3 font-medium text-yellow-600';
        msg.textContent = `✅ Você já enviou sua foto (${dadosFoto.andar}º andar - Apto ${dadosFoto.apartamento}). Apenas 1 envio permitido por usuário.`;
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        submitBtn.textContent = '✓ Foto já enviada';
      }
      if (andarSelect) andarSelect.disabled = true;
      if (apartamentoSelect) apartamentoSelect.disabled = true;
      const fotoInput = document.getElementById('foto');
      if (fotoInput) fotoInput.disabled = true;
    } else {
      if (msg) msg.textContent = '';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.textContent = '🎄 Enviar Foto';
      }
      if (andarSelect) andarSelect.disabled = false;
    }
  } catch (error) {
    console.error('Erro ao verificar envio:', error);
  }
}

async function carregarPeriodo() {
  const docRef = db.collection('settings').doc('votacao');
  const snap = await docRef.get();
  if (snap.exists) {
    periodo = snap.data(); // {inicio: Timestamp, fim: Timestamp}
    const agora = firebase.firestore.Timestamp.now();
    if (agora < periodo.inicio) {
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `A votação ainda não começou. Início: ${fmt(periodo.inicio)}.`;
    } else if (agora > periodo.fim) {
      // Redireciona para página de encerramento
      if (!window.location.pathname.includes('encerramento') && !window.location.pathname.includes('ranking')) {
        window.location.href = './encerramento.html';
        return;
      }
      periodoAviso?.classList.remove('hidden');
      periodoAviso.textContent = `Votação encerrada em ${fmt(periodo.fim)}.`;
    } else {
      periodoAviso?.classList.add('hidden');
    }
  }
}

loginBtn?.addEventListener('click', async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao fazer login: ' + error.message);
  }
});

logoutBtn?.addEventListener('click', async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Erro no logout:', error);
  }
});

auth.onAuthStateChanged(async u => {
  currentUser = u;
  if (u) {
    isAdmin = ADMIN_EMAILS.includes(u.email.toLowerCase());
    if (userInfo) userInfo.textContent = u.displayName || u.email;
    loginBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
    await verificarEnvioUsuario(); // Verifica se já enviou foto
    await verificarSeJaVotou(); // Verifica se já votou
    await carregarFotos(); // Carregar fotos após verificar voto
    await verificarEncerramentoUploads();
  } else {
    isAdmin = false;
    usuarioJaVotou = false;
    fotoVotadaPeloUsuario = null;
    if (userInfo) userInfo.textContent = '';
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    if (formUpload) formUpload.reset();
    await carregarFotos();
    await verificarEncerramentoUploads();
  }
});

// Verifica se os uploads foram encerrados (configuração administrativa)
async function verificarEncerramentoUploads() {
  try {
    let encerrado = false;
    let doc;
    try {
      doc = await db.collection('settings').doc('uploads').get();
      if (doc.exists) encerrado = doc.data().encerrado === true;
    } catch (dbErr) {
      console.warn('Não foi possível ler settings/uploads do Firestore, usando fallback localStorage se existir', dbErr);
    }

    // fallback: checar localStorage se Firestore indisponível ou doc não existir
    try {
      const local = localStorage.getItem('uploadsEncerrado');
      if (local === 'true') encerrado = true;
      if (local === 'false' && doc && doc.exists) {
        // se há doc no firestore, firestore tem prioridade; caso contrário já seguiu local
      }
    } catch (e) {
      console.warn('localStorage not available');
    }

    const msg = document.getElementById('msg');
    const submitBtn = formUpload?.querySelector('button[type="submit"]');
    const fotoInput = document.getElementById('foto');

    if (encerrado) {
      if (msg) {
        msg.className = 'text-sm mt-3 font-medium text-red-600';
        msg.textContent = 'Postagem de fotos já encerrada!';
      }
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        submitBtn.textContent = '⛔ Postagens encerradas';
      }
      if (andarSelect) andarSelect.disabled = true;
      if (apartamentoSelect) apartamentoSelect.disabled = true;
      if (fotoInput) fotoInput.disabled = true;
      if (formUpload) {
        formUpload.addEventListener('submit', function(e){
          e.preventDefault();
          return false;
        }, { passive: false });
      }
    } else {
      // Reverter, se necessário
      if (msg && msg.textContent === 'Postagem de fotos já encerrada!') msg.textContent = '';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        submitBtn.textContent = '🎄 Enviar Foto';
      }
      if (andarSelect) andarSelect.disabled = false;
      if (apartamentoSelect) apartamentoSelect.disabled = true;
      if (fotoInput) fotoInput.disabled = false;
    }
  } catch (error) {
    console.error('Erro ao verificar encerramento uploads:', error);
  }
}

async function carregarFotos() {
  if (!galeria) return;
  const snap = await db.collection('fotos_natal').orderBy('dataEnvio', 'desc').get();

  galeria.innerHTML = '';
  
  if (snap.empty) {
    galeria.innerHTML = '<p class="text-center text-slate-500 col-span-full py-8">Nenhuma foto enviada ainda. Seja o primeiro! 🎄</p>';
    if (paginacaoControles) paginacaoControles.classList.add('hidden');
    return;
  }
  
  // Armazenar todas as fotos
  todasFotos = [];
  snap.forEach(doc => {
    todasFotos.push({ id: doc.id, data: doc.data() });
  });
  
  // Mostrar controles de paginação se houver mais de 10 fotos
  if (todasFotos.length > 10) {
    if (paginacaoControles) paginacaoControles.classList.remove('hidden');
  } else {
    if (paginacaoControles) paginacaoControles.classList.add('hidden');
  }
  
  renderizarPagina();
}

function renderizarPagina() {
  if (!galeria) return;
  
  console.log('Renderizando página - usuarioJaVotou:', usuarioJaVotou);
  
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const fotosPagina = todasFotos.slice(inicio, fim);
  
  galeria.innerHTML = '';
  
  // Verificar se a votação já está liberada (15/12/2025 10:00)
  const agora = new Date();
  const dataLiberacaoVotacao = new Date('2025-12-15T10:00:00-03:00');
  const votacaoLiberada = agora >= dataLiberacaoVotacao;
  
  fotosPagina.forEach(foto => {
    const d = foto.data;
    
    // Verificar se o usuário já votou OU se a votação ainda não foi liberada
    const botaoDesabilitado = (usuarioJaVotou || !votacaoLiberada) ? 'disabled' : '';
    
    let estiloDesabilitado, textoBotao;
    if (!votacaoLiberada) {
      estiloDesabilitado = 'bg-amber-400 cursor-not-allowed opacity-70';
      textoBotao = '🔒 Votação liberada em 15/12/2025 às 10h00';
    } else if (usuarioJaVotou) {
      estiloDesabilitado = 'bg-gray-400 cursor-not-allowed opacity-60';
      textoBotao = '🔒 Votação encerrada para você';
    } else {
      estiloDesabilitado = 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 transform hover:scale-105';
      textoBotao = '⭐ Votar nesta decoração';
    }
    
    console.log(`Foto ${foto.id} - Votação liberada: ${votacaoLiberada}, Botão ${(usuarioJaVotou || !votacaoLiberada) ? 'DESABILITADO' : 'HABILITADO'}`);
    
    galeria.innerHTML += `
      <article class="xmas-card rounded-2xl shadow-lg p-4 flex flex-col gap-3 border-2 border-emerald-100 hover:border-emerald-300 transition-all group">
        <div class="zoom-container border-2 border-slate-200 group-hover:border-emerald-400">
          <img src="${d.urlFoto}" class="w-full aspect-[3/4] object-cover" alt="Decoração Natalina"/>
        </div>
        <button ${botaoDesabilitado} class="w-full px-4 py-3 rounded-lg ${estiloDesabilitado} text-white font-bold shadow-md hover:shadow-lg transition-all" onclick="votar('${foto.id}')">
          ${textoBotao}
        </button>
      </article>
    `;
  });
  
  atualizarControlesPaginacao();
}

function atualizarControlesPaginacao() {
  const totalPaginas = Math.ceil(todasFotos.length / itensPorPagina);
  
  if (infoPagina) {
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  }
  
  if (btnPaginaAnterior) {
    btnPaginaAnterior.disabled = paginaAtual === 1;
  }
  
  if (btnProximaPagina) {
    btnProximaPagina.disabled = paginaAtual === totalPaginas;
  }
}

// Event listeners para paginação
itensPorPaginaSelect?.addEventListener('change', (e) => {
  itensPorPagina = parseInt(e.target.value);
  paginaAtual = 1;
  renderizarPagina();
});

btnPaginaAnterior?.addEventListener('click', () => {
  if (paginaAtual > 1) {
    paginaAtual--;
    renderizarPagina();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

btnProximaPagina?.addEventListener('click', () => {
  const totalPaginas = Math.ceil(todasFotos.length / itensPorPagina);
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    renderizarPagina();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// Variável global para controlar se o usuário já votou
let usuarioJaVotou = false;
let fotoVotadaPeloUsuario = null;

// Verificar se usuário já votou ao carregar
async function verificarSeJaVotou() {
  if (!currentUser) {
    console.log('Nenhum usuário logado');
    return;
  }
  
  console.log('Verificando se usuário já votou...');
  
  try {
    const todasFotos = await db.collection('fotos_natal').get();
    
    for (const doc of todasFotos.docs) {
      const voterDoc = await doc.ref.collection('voters').doc(currentUser.uid).get();
      if (voterDoc.exists) {
        usuarioJaVotou = true;
        fotoVotadaPeloUsuario = doc.data();
        console.log('✅ Usuário já votou! Bloqueando botões...', fotoVotadaPeloUsuario);
        return;
      }
    }
    
    console.log('✅ Usuário ainda não votou');
    usuarioJaVotou = false;
  } catch (error) {
    console.error('Erro ao verificar voto:', error);
  }
}

window.votar = async (fotoId) => {
  // Verificar se aceitou os termos
  if (!termosAceitos) {
    mostrarTermos();
    return;
  }
  
  // Verificar se está logado
  if (!currentUser) {
    alert('Você precisa fazer login com sua conta Google para votar.');
    loginBtn?.click();
    return;
  }
  
  // Verificar se a votação já está liberada (15/12/2025 10:00)
  const agora = new Date();
  const dataLiberacaoVotacao = new Date('2025-12-15T10:00:00-03:00');
  if (agora < dataLiberacaoVotacao) {
    alert('A votação será liberada em 15/12/2025 às 10h00.');
    return;
  }
  
  // Verificar se já votou (frontend) - sem alert, apenas bloquear
  if (usuarioJaVotou) {
    return;
  }
  
  const fotoRef = db.collection('fotos_natal').doc(fotoId);
  const voterRef = fotoRef.collection('voters').doc(currentUser.uid);

  try {
    await db.runTransaction(async (tx) => {
      const [fotoSnap, voterSnap] = await Promise.all([tx.get(fotoRef), tx.get(voterRef)]);
      if (!fotoSnap.exists) throw new Error('Foto não encontrada');

      const agora = firebase.firestore.Timestamp.now();
      const cfg = await tx.get(db.collection('settings').doc('votacao'));
      if (!cfg.exists) throw new Error('Configuração de votação ausente');
      const { inicio, fim } = cfg.data();
      if (agora < inicio) throw new Error('A votação ainda não começou.');
      if (agora > fim) throw new Error('A votação já encerrou.');

      if (voterSnap.exists) throw new Error('Você já votou nesta foto.');
      
      tx.set(voterRef, { 
        uid: currentUser.uid, 
        email: currentUser.email,
        votedAt: agora 
      });
      const votosAtuais = fotoSnap.data().votos || 0;
      tx.update(fotoRef, { votos: votosAtuais + 1 });
    });

    // Marcar que o usuário já votou
    usuarioJaVotou = true;
    fotoVotadaPeloUsuario = (await fotoRef.get()).data();
    
    // Re-renderizar a página para desabilitar todos os botões
    renderizarPagina();
    
    // Mostrar mensagem de sucesso
    alert('✅ Voto computado com sucesso! Obrigado por participar! 🎄');
  } catch (e) {
    alert(e.message);
  }
};

formUpload?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Verificar se aceitou os termos
  if (!termosAceitos) {
    mostrarTermos();
    return;
  }
  
  // Verificar se está logado
  if (!currentUser) {
    alert('Você precisa fazer login com sua conta Google para enviar foto.');
    loginBtn?.click();
    return;
  }
  
  if (usuarioJaEnviou) {
    alert('Você já enviou sua foto. Apenas 1 envio permitido por usuário.');
    return;
  }
  
  const andar = Number(document.getElementById('andar').value);
  const apartamento = document.getElementById('apartamento').value.trim();
  const file = document.getElementById('foto').files[0];
  const msg = document.getElementById('msg');

  if (!andar || !apartamento) {
    alert('Selecione o andar e apartamento.');
    return;
  }

  if (!file) {
    alert('Selecione uma foto.');
    return;
  }

  try {
    if (msg) {
      msg.textContent = 'Enviando foto...';
      msg.className = 'text-sm mt-3 font-medium text-blue-600';
    }
    
    const path = `natal/${andar}Apto${apartamento}/${Date.now()}_${file.name}`;
    const snap = await storage.ref().child(path).put(file, { cacheControl: 'public,max-age=31536000' });
    const url = await snap.ref.getDownloadURL();

    await db.collection('fotos_natal').add({
      andar, 
      apartamento, 
      urlFoto: url, 
      votos: 0,
      uploadPor: currentUser.uid,
      uploadEmail: currentUser.email,
      dataEnvio: firebase.firestore.Timestamp.now()
    });

    if (msg) {
      msg.textContent = '✅ Foto enviada com sucesso! 🎉';
      msg.className = 'text-sm mt-3 font-medium text-green-600';
    }
    
    formUpload.reset();
    await verificarEnvioUsuario();
    await carregarFotos();
  } catch (err) {
    console.error(err);
    if (msg) {
      msg.textContent = '❌ Falha ao enviar. Tente novamente.';
      msg.className = 'text-sm mt-3 font-medium text-red-600';
    }
  }
});

(async () => {
  await carregarPeriodo();
  await carregarFotos();
})();
