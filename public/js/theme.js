// ===== ❄️ NEVE =====
(() => {
  const c = document.getElementById('snow');
  const snowBtn = document.getElementById('snowToggle');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, flakes = [];
  // Ativar neve automaticamente se não houver preferência salva
  let snowEnabled = localStorage.getItem('xmas_snow') !== 'off';
  let animationId;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    // Quantidade média de neve: 80 flocos
    flakes = Array.from({ length: Math.min(80, Math.floor(W/15)) }, () => ({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*2 + 1.2,
      d: Math.random()*1 + .5
    }));
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    if (snowEnabled) {
      ctx.fillStyle = 'rgba(240,245,250,0.85)'; // Branco acinzentado
      ctx.shadowColor = 'rgba(200,210,220,0.5)';
      ctx.shadowBlur = 3;
      flakes.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
        ctx.fill();
        f.y += f.d;
        f.x += Math.sin(f.y * 0.01);
        if (f.y > H) { f.y = -5; f.x = Math.random()*W; }
      });
    }
    animationId = requestAnimationFrame(draw);
  }
  
  function updateSnowBtn() {
    if (snowBtn) {
      snowBtn.style.opacity = snowEnabled ? '1' : '0.5';
    }
  }
  
  window.addEventListener('resize', resize);
  resize(); 
  draw(); // Sempre inicia o loop
  updateSnowBtn();
  
  // Salvar preferência inicial se ativado automaticamente
  if (snowEnabled && !localStorage.getItem('xmas_snow')) {
    localStorage.setItem('xmas_snow', 'on');
  }
  
  snowBtn?.addEventListener('click', () => {
    snowEnabled = !snowEnabled;
    localStorage.setItem('xmas_snow', snowEnabled ? 'on' : 'off');
    updateSnowBtn();
  });
})();

// ===== 🎵 MÚSICA =====
(() => {
  const audio = document.getElementById('bgMusic');
  const btn = document.getElementById('musicToggle');
  const modal = document.getElementById('musicModal');
  const playB = document.getElementById('modalPlay');
  const noB = document.getElementById('modalNo');

  if (!audio || !btn) return;

  const LS_KEY = 'xmas_music_pref'; // 'on' | 'off'
  let pref = localStorage.getItem(LS_KEY);

  function setBtn(state) {
    btn.style.opacity = state === 'on' ? '1' : '0.5';
  }
  function tryPlay() {
    audio.play().then(() => {
      localStorage.setItem(LS_KEY, 'on');
      setBtn('on');
    }).catch(() => {
      modal?.classList.remove('hidden');
    });
  }

  if (pref === 'on') {
    tryPlay();
  } else if (pref === 'off') {
    setBtn('off');
  } else {
    setBtn('off');
    modal?.classList.remove('hidden');
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        localStorage.setItem(LS_KEY, 'on');
        setBtn('on');
        modal?.classList.add('hidden');
      }).catch(() => {
        modal?.classList.remove('hidden');
      });
    } else {
      audio.pause();
      localStorage.setItem(LS_KEY, 'off');
      setBtn('off');
    }
  });

  playB?.addEventListener('click', () => {
    audio.play().then(() => {
      localStorage.setItem(LS_KEY, 'on');
      setBtn('on');
      modal?.classList.add('hidden');
    });
  });
  noB?.addEventListener('click', () => {
    audio.pause();
    localStorage.setItem(LS_KEY, 'off');
    setBtn('off');
    modal?.classList.add('hidden');
  });
})();

// ===== ✨ BRILHO =====
(() => {
  const sparkleBtn = document.getElementById('sparkleToggle');
  if (!sparkleBtn) return;
  
  // Ativar brilho automaticamente se não houver preferência salva
  let sparkleEnabled = localStorage.getItem('xmas_sparkle') !== 'off';
  let sparkleInterval;
  
  function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      font-size: ${Math.random() * 20 + 10}px;
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      animation: sparkleAnim 2s ease-out forwards;
    `;
    sparkle.textContent = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];
    document.body.appendChild(sparkle);
    
    setTimeout(() => sparkle.remove(), 2000);
  }
  
  function updateSparkleBtn() {
    sparkleBtn.style.opacity = sparkleEnabled ? '1' : '0.5';
  }
  
  function startSparkles() {
    if (sparkleInterval) return;
    // Quantidade média: 1 brilho a cada 1.5 segundos
    sparkleInterval = setInterval(createSparkle, 1500);
  }
  
  function stopSparkles() {
    if (sparkleInterval) {
      clearInterval(sparkleInterval);
      sparkleInterval = null;
    }
    document.querySelectorAll('.sparkle').forEach(s => s.remove());
  }
  
  // Adicionar keyframes para animação
  if (!document.getElementById('sparkleStyles')) {
    const style = document.createElement('style');
    style.id = 'sparkleStyles';
    style.textContent = `
      @keyframes sparkleAnim {
        0% { opacity: 0; transform: scale(0) rotate(0deg); }
        50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
        100% { opacity: 0; transform: scale(0) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  
  updateSparkleBtn();
  if (sparkleEnabled) {
    startSparkles();
    // Salvar preferência inicial se ativado automaticamente
    if (!localStorage.getItem('xmas_sparkle')) {
      localStorage.setItem('xmas_sparkle', 'on');
    }
  }
  
  sparkleBtn.addEventListener('click', () => {
    sparkleEnabled = !sparkleEnabled;
    localStorage.setItem('xmas_sparkle', sparkleEnabled ? 'on' : 'off');
    updateSparkleBtn();
    if (sparkleEnabled) {
      startSparkles();
    } else {
      stopSparkles();
    }
  });
})();
