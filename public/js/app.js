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
let isAdmin = false;
const ADMIN_EMAILS = ['jhessymary26@gmail.com'];

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
    isAdmin = ADMIN_EMAILS.includes(u.email.toLowerCase());
    if (userInfo) userInfo.textContent = u.displayName || u.email;
    loginBtn?.classList.add('hidden');
    logoutBtn?.classList.remove('hidden');
    carregarFotos(); // Recarrega para mostrar/ocultar botão X
  } else {
    isAdmin = false;
    if (userInfo) userInfo.textContent = '';
    loginBtn?.classList.remove('hidden');
    logoutBtn?.classList.add('hidden');
    carregarFotos();
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
    const deleteBtn = isAdmin ? `
      <button 
        class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg flex items-center justify-center transition-all transform hover:scale-110" 
        onclick="deletarFoto('${doc.id}')"
        title="Deletar foto e votos"
      >
        ✕
      </button>
    ` : '';
    
    galeria.innerHTML += `
      <article class="xmas-card rounded-2xl shadow p-3 flex flex-col gap-2 border border-emerald-100 relative">
        ${deleteBtn}
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

filtroAndar?.addEventListener('change', carregarFotos);

// Função para deletar foto (apenas admin)
window.deletarFoto = async (fotoId) => {
  if (!isAdmin) {
    alert('Apenas administradores podem deletar fotos.');
    return;
  }
  
  if (!confirm('⚠️ Tem certeza que deseja deletar esta foto e todos os seus votos? Esta ação não pode ser desfeita!')) {
    return;
  }
  
  try {
    const fotoRef = db.collection('fotos_natal').doc(fotoId);
    
    // Deletar subcoleção de voters
    const votersSnap = await fotoRef.collection('voters').get();
    const batch = db.batch();
    votersSnap.docs.forEach(doc => batch.delete(doc.ref));
    
    // Deletar o documento da foto
    batch.delete(fotoRef);
    
    await batch.commit();
    
    alert('✅ Foto deletada com sucesso!');
    await carregarFotos();
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    alert('❌ Erro ao deletar foto: ' + error.message);
  }
};

// Função para gerar PDF do ranking
document.getElementById('gerarPDF')?.addEventListener('click', async () => {
  try {
    const snap = await db.collection('fotos_natal').orderBy('votos', 'desc').get();
    let content = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ranking - Votação Natalina Torre 4</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #059669; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #059669; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .medal { font-size: 24px; }
        </style>
      </head>
      <body>
        <h1>🎄 Ranking - Votação Natalina Torre 4 2025</h1>
        <p style="text-align: center; color: #666;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Andar</th>
              <th>Apartamento</th>
              <th>Votos</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    let pos = 1;
    snap.forEach(doc => {
      const d = doc.data();
      const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : '';
      content += `
        <tr>
          <td class="medal">${medal} ${pos}º</td>
          <td>${d.andar}º andar</td>
          <td>${d.apartamento}</td>
          <td><strong>${d.votos || 0}</strong> voto${(d.votos || 0) !== 1 ? 's' : ''}</td>
        </tr>
      `;
      pos++;
    });
    
    content += `
          </tbody>
        </table>
        <p style="margin-top: 40px; text-align: center; color: #999; font-size: 12px;">
          © 2025 Comissão de Natal - Torre 4 | Desenvolvido por Jéssica Maria de Sousa
        </p>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('❌ Erro ao gerar PDF: ' + error.message);
  }
});

(async () => {
  await carregarPeriodo();
  await popularFiltroAndar();
  await carregarFotos();
})();
