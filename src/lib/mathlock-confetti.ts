// Pure canvas confetti — no external libs

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
}

const COLORS = ["#FFD700", "#EF4444", "#3B82F6", "#10B981", "#A855F7", "#EC4899"];
const PARTICLE_COUNT = 150;
const DURATION = 3000;

export function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
  canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;

  const particles: Particle[] = [];

  // Burst from center
  for (let i = 0; i < PARTICLE_COUNT / 2; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    particles.push({
      x: w / 2,
      y: h / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }

  // Rain from top
  for (let i = 0; i < PARTICLE_COUNT / 2; i++) {
    particles.push({
      x: Math.random() * w,
      y: -10 - Math.random() * 50,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }

  const start = performance.now();
  let animId: number;

  function animate(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / DURATION, 1);

    ctx!.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - progress * 1.2);

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate((p.rotation * Math.PI) / 180);
      ctx!.globalAlpha = p.opacity;
      ctx!.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.restore();
    }

    if (progress < 1) {
      animId = requestAnimationFrame(animate);
    } else {
      ctx!.clearRect(0, 0, w, h);
    }
  }

  animId = requestAnimationFrame(animate);

  // Cleanup after duration
  setTimeout(() => {
    cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, w, h);
  }, DURATION + 100);
}
