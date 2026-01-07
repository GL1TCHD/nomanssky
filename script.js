(() => {
  const canvas = document.getElementById('space');
  const ctx = canvas.getContext('2d');

  // Density-driven star count so it scales with screen size
  const STAR_DENSITY = 0.00045; // stars per CSS pixel (approx)
  const MAX_DPR = 2; // cap for performance on very high-DPI devices
  const stars = [];
  let width = 0, height = 0, dpr = Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));
  let lastT = 0;

  const palettes = [
    { r: 255, g: 255, b: 255 },          // pure white
    { r: 250, g: 240, b: 255 },          // lavender blush
    { r: 235, g: 215, b: 255 },          // soft violet white
    { r: 220, g: 200, b: 255 },          // pale violet
  ];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function targetStarCount() {
    return Math.max(50, Math.round(width * height * STAR_DENSITY));
  }

  function resize() {
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    dpr = Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || dpr));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeStar() {
    const size = Math.pow(Math.random(), 2) * 2.2 + 0.2; // bias towards small
    const layer = size < 0.6 ? 0 : size < 1.2 ? 1 : 2; // parallax layers
    const baseSpeed = [0.015, 0.03, 0.06][layer]; // slower movement
    const jitter = rand(-0.008, 0.008);
    const speed = baseSpeed + jitter;
    const hue = palettes[(Math.random() * palettes.length) | 0];
    return {
      x: rand(0, width),
      y: rand(0, height),
      size,
      speed,
      aBase: rand(0.35, 0.95),
      twinklePhase: rand(0, Math.PI * 2),
      twinkleSpeed: rand(0.2, 0.6),
      color: hue,
    };
  }

  function initStars() {
    stars.length = 0;
    const count = targetStarCount();
    for (let i = 0; i < count; i++) stars.push(makeStar());
  }

  function drawStar(s) {
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.twinklePhase));
    const alpha = Math.min(1, Math.max(0.08, s.aBase * twinkle));
    ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${alpha})`;
    // soft point using small blurred circle via shadow
    ctx.save();
    ctx.shadowColor = `rgba(255,255,255,${Math.min(0.8, alpha + 0.2)})`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function update(dt) {
    const driftY = 0.0035 * dt; // subtle vertical drift (slower)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.speed * dt;
      // gentle vertical shimmer without long-term center bias
      s.y += Math.sin((s.twinklePhase + i) * 0.35) * 0.01 * dt + driftY;
      s.twinklePhase += s.twinkleSpeed * 0.0025 * dt;
      if (s.x < -s.size) { s.x = width + s.size; s.y = rand(0, height); }
      if (s.y > height + s.size) { s.y = -s.size; }
    }
  }

  function render(t = 0) {
    const dt = Math.min(32, t - lastT || 16.7); // cap big jumps
    lastT = t;

    // Clear with a transparent pass to keep CSS gradient intact
    ctx.clearRect(0, 0, width, height);

    // draw stars without rotating the scene (prevents center-drift feel)
    for (let i = 0; i < stars.length; i++) drawStar(stars[i]);

    update(dt);
    requestAnimationFrame(render);
  }

  // Init
  resize();
  initStars();
  requestAnimationFrame(render);

  function updateStarCount() {
    const target = targetStarCount();
    if (stars.length < target) {
      const toAdd = target - stars.length;
      for (let i = 0; i < toAdd; i++) stars.push(makeStar());
    } else if (stars.length > target) {
      stars.length = target;
    }
  }

  // Handle resize
  window.addEventListener('resize', () => {
    resize();
    updateStarCount();
  }, { passive: true });
})();

// Audio control functionality
(() => {
  const audioBtn = document.getElementById('audio-btn');
  const audio = document.getElementById('ambient-audio');
  
  if (!audioBtn || !audio) return;

  audioBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        audioBtn.classList.add('playing');
      }).catch(err => {
        console.log('Audio play failed:', err);
      });
    } else {
      audio.pause();
      audioBtn.classList.remove('playing');
    }
  });

  // Remove playing class when audio ends
  audio.addEventListener('pause', () => {
    audioBtn.classList.remove('playing');
  });
})();
