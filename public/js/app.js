const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const formUpload = document.getElementById('formUpload');
const galeria = document.getElementById('galeria');
const filtroAndar = document.getElementById('filtroAndar');
const limparFiltro = document.getElementById('limparFiltro');
const periodoAviso = document.getElementById('periodoAviso');

let currentUser = null;
let periodo = { inicio: null, fim: null };

function fmt(d){ return new Date(d.seconds*1000).toLocaleString('pt-BR'); }

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

auth.onAuthStateChanged(u => {
  currentUser = u;
  if (u) {
    if (userInfo) userInfo.textContent = u.displayName || u.email;
    loginBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
  } else {
    if (userInfo) userInfo.textContent = '';
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
  }
});

async function popularFiltroAndar() {
  const snap = await db.collection('fotos_natal').get();
  const andares = new Set();
  snap.forEach(d => andares.add(d.data().andar));
  if (filtroAndar) {
    filtroAndar.innerHTML = `<option value="">Todos</option>` + [...andares].sort((a,b)=>a-b).map(a=>`<option>${a}</option>`).join('');
  }
}

async function carregarFotos() {
  if (!galeria) return;
  let ref = db.collection('fotos_natal');
  const andarEscolhido = filtroAndar?.value;
  if (andarEscolhido) ref = ref.where('andar', '==', Number(andarEscolhido));
  const snap = await ref.orderBy('dataEnvio', 'desc').get();

  galeria.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    galeria.innerHTML += `
      <article class="xmas-card rounded-2xl shadow p-3 flex flex-col gap-2 border border-emerald-100">
        <img src="${d.urlFoto}" class="w-full aspect-video object-cover rounded-lg border" alt="Foto do ${d.andar}º andar, apto ${d.apartamento}"/>
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${d.andar}º andar — Apto ${d.apartamento}</div>
            <div class="text-sm text-slate-600"><span id="votos_${doc.id}">${d.votos||0}</span> voto(s)</div>
          </div>
          <button class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onclick="votar('${doc.id}')">Votar</button>
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
  const andar = Number(document.getElementById('andar').value);
  const apartamento = document.getElementById('apartamento').value.trim();
  const file = document.getElementById('foto').files[0];
  const msg = document.getElementById('msg');

  if (!file) return;

  try {
    if (msg) msg.textContent = 'Enviando…';
    const path = `natal/${andar}Apto${apartamento}/${Date.now()}_${file.name}`;
    const snap = await storage.ref().child(path).put(file, { cacheControl: 'public,max-age=31536000' });
    const url = await snap.ref.getDownloadURL();

    await db.collection('fotos_natal').add({
      andar, apartamento, urlFoto: url, votos: 0,
      uploadPor: currentUser.uid,
      dataEnvio: firebase.firestore.Timestamp.now()
    });

    if (msg) msg.textContent = 'Foto enviada com sucesso! 🎉';
    formUpload.reset();
    await popularFiltroAndar();
    await carregarFotos();
  } catch (err) {
    console.error(err);
    if (msg) msg.textContent = 'Falha ao enviar. Verifique permissões do Storage/Firestore.';
  }
});

limparFiltro?.addEventListener('click', () => {
  if (filtroAndar) filtroAndar.value = '';
  carregarFotos();
});

(async () => {
  await carregarPeriodo();
  await popularFiltroAndar();
  await carregarFotos();
})();
