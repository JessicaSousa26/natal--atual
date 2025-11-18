// Versão da aplicação - incrementar para forçar atualização
const APP_VERSION = '1.4.0';

// Sistema automático de atualização de cache
(function() {
  const STORED_VERSION = localStorage.getItem('app_version');
  
  if (STORED_VERSION && STORED_VERSION !== APP_VERSION) {
    console.log(`🔄 Nova versão detectada: ${STORED_VERSION} → ${APP_VERSION}`);
    console.log('🧹 Limpando cache e recarregando...');
    
    localStorage.setItem('app_version', APP_VERSION);
    
    // Limpar service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    
    // Limpar todos os caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Forçar reload completo
    setTimeout(() => {
      window.location.reload(true);
    }, 100);
  } else if (!STORED_VERSION) {
    localStorage.setItem('app_version', APP_VERSION);
    console.log(`✅ Versão ${APP_VERSION} inicializada`);
  }
})();
