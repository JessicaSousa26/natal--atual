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

let currentUser = null;
let periodo = { inicio: null, fim: null };
let isAdmin = false;
const ADMIN_EMAILS = ['jhessymary26@gmail.com'];
let usuarioJaEnviou = false;

function fmt(d){ return new Date(d.seconds*1000).toLocaleString('pt-BR'); }

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
    carregarFotos();
  } else {
    isAdmin = false;
    if (userInfo) userInfo.textContent = '';
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    if (formUpload) formUpload.reset();
    carregarFotos();
  }
});

async function carregarFotos() {
  if (!galeria) return;
  const snap = await db.collection('fotos_natal').orderBy('dataEnvio', 'desc').get();

  galeria.innerHTML = '';
  
  if (snap.empty) {
    galeria.innerHTML = '<p class="text-center text-slate-500 col-span-full py-8">Nenhuma foto enviada ainda. Seja o primeiro! 🎄</p>';
    return;
  }
  
  snap.forEach(doc => {
    const d = doc.data();
    galeria.innerHTML += `
      <article class="xmas-card rounded-2xl shadow-lg p-4 flex flex-col gap-3 border-2 border-emerald-100 hover:border-emerald-300 transition-all">
        <img src="${d.urlFoto}" class="w-full aspect-[3/4] object-cover rounded-lg border-2 border-slate-200" alt="Decoração do ${d.andar}º andar, apto ${d.apartamento}"/>
        <div class="flex flex-col gap-2">
          <div class="font-bold text-lg text-center">${d.andar}º andar — Apto ${d.apartamento}</div>
          <div class="text-center">
            <span class="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span class="text-xl">⭐</span>
              <span id="votos_${doc.id}">${d.votos||0}</span> 
              <span class="text-sm">voto${(d.votos||0) !== 1 ? 's' : ''}</span>
            </span>
          </div>
          <button class="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-105" onclick="votar('${doc.id}')">
            ⭐ Votar nesta decoração
          </button>
        </div>
      </article>
    `;
  });
}

window.votar = async (fotoId) => {
  if (!currentUser) {
    alert('Entre com Google para votar.');
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
      tx.set(voterRef, { uid: currentUser.uid, votedAt: agora });
      const votosAtuais = fotoSnap.data().votos || 0;
      tx.update(fotoRef, { votos: votosAtuais + 1 });
    });

    const span = document.getElementById(`votos_${fotoId}`);
    if (span) span.textContent = Number(span.textContent) + 1;
  } catch (e) {
    alert(e.message);
  }
};

formUpload?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!currentUser) {
    alert('Entre com Google para enviar foto.');
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
