// ===== ❄️ NEVE =====
(() => {
  const c = document.getElementById('snow');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, flakes = [];

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    flakes = Array.from({ length: Math.min(140, Math.floor(W/10)) }, () => ({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*2 + 1.2,
      d: Math.random()*1 + .5
    }));
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    flakes.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      ctx.fill();
      f.y += f.d;
      f.x += Math.sin(f.y * 0.01);
      if (f.y > H) { f.y = -5; f.x = Math.random()*W; }
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
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
    if (state === 'on') {
      btn.textContent = '⏸️ Pausar música';
    } else {
      btn.textContent = '▶️ Tocar música';
    }
  }
  function tryPlay() {
    audio.play().then(() => {
      localStorage.setItem(LS_KEY, 'on');
      setBtn('on');
    }).catch(() => {
      modal?.classList.remove('hidden');
    });
  }

  btn.classList.remove('hidden');

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
