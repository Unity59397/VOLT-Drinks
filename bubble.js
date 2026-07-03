const canvas = document.getElementById('bubble-canvas');
const ctx = canvas.getContext('2d');
const wrapper = canvas.parentElement;

// How "packed" the bubbles are, in bubbles per square pixel of the section.
// Tuned against the homepage hero (~1200 x 760) reading as 26 bubbles.
const DENSITY = 26 / (1200 * 760);
const MIN_BUBBLES = 8;
const MAX_BUBBLES = 30;

// Minimum gap (in px) kept between the edges of two bubbles when placing them.
const MIN_GAP = 14;

function resize() {
  canvas.width = wrapper.offsetWidth;
  canvas.height = wrapper.offsetHeight;
  rebuildBubbles();
}

// VOID brand palette
const COLORS = ['#098fe1', '#ffaf09', '#5b2a9e', '#f2ed48'];

let bubbles = [];

class Bubble {
  constructor() {
    this.radius = Math.random() * 26 + 16;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.opacity = Math.random() * 0.3 + 0.55;
    this.pulseSpeed = Math.random() * 0.04 + 0.02;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.popping = false;
    this.popProgress = 0;
    this.place();
  }

  // Finds a spot that doesn't overlap existing bubbles, falling back
  // gracefully if the section is too crowded to fit one cleanly.
  place() {
    let best = null;
    let bestClearance = -Infinity;

    for (let attempt = 0; attempt < 40; attempt++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;

      let minClearance = Infinity;
      for (const other of bubbles) {
        if (other === this) continue;
        const dx = x - other.x;
        const dy = y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clearance = dist - (this.radius + other.radius + MIN_GAP);
        if (clearance < minClearance) minClearance = clearance;
      }
      if (bubbles.length === 0) minClearance = Infinity;

      if (minClearance >= 0) {
        this.x = x;
        this.y = y;
        return;
      }
      if (minClearance > bestClearance) {
        bestClearance = minClearance;
        best = { x, y };
      }
    }

    // No fully clear spot found after enough attempts — use the roomiest one seen.
    this.x = best.x;
    this.y = best.y;
  }

  reset() {
    this.radius = Math.random() * 26 + 16;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.opacity = Math.random() * 0.3 + 0.55;
    this.pulseSpeed = Math.random() * 0.04 + 0.02;
    this.pulseOffset = Math.random() * Math.PI * 2;
    this.popping = false;
    this.popProgress = 0;
    this.place();
  }
  pop() {
    if (!this.popping) {
      this.popping = true;
      this.popProgress = 0;
      this.sparks = Array.from({ length: 8 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
        return { angle, length: this.radius * (1.5 + Math.random()) };
      });
    }
  }
  update() {
    if (this.popping) {
      this.popProgress += 0.09;
      if (this.popProgress >= 1) this.reset();
    }
  }
  draw(time) {
    if (this.popping) {
      const fade = 1 - this.popProgress;
      const burst = this.popProgress;

      // Electric burst core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * (1 + burst * 1.2), 0, Math.PI * 2);
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = fade;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.stroke();

      // Jagged lightning spark lines shooting outward
      this.sparks.forEach(s => {
        const dist = s.length * burst;
        const x2 = this.x + Math.cos(s.angle) * dist;
        const y2 = this.y + Math.sin(s.angle) * dist;
        const midX = this.x + Math.cos(s.angle) * dist * 0.5 + (Math.random() - 0.5) * 6;
        const midY = this.y + Math.sin(s.angle) * dist * 0.5 + (Math.random() - 0.5) * 6;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(midX, midY);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = fade;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      return;
    }

    // Pulsing glow intensity
    const pulse = 0.5 + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.5;
    const glow = 14 + pulse * 12;
    const r = this.radius * (0.95 + pulse * 0.08);

    // Outer glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity * 0.25;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = glow;
    ctx.fill();

    // Core fill
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.82, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity * 0.35;
    ctx.shadowBlur = 0;
    ctx.fill();

    // Sharp neon rim
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.82, 0, Math.PI * 2);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = Math.min(this.opacity + 0.3, 1);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = glow * 0.6;
    ctx.stroke();

    // Sharp white highlight
    ctx.beginPath();
    ctx.arc(this.x - r * 0.28, this.y - r * 0.28, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  isHit(px, py) {
    const dx = this.x - px;
    const dy = this.y - py;
    return Math.sqrt(dx * dx + dy * dy) < this.radius;
  }
}

function rebuildBubbles() {
  const area = canvas.width * canvas.height;
  const targetCount = Math.round(
    Math.min(MAX_BUBBLES, Math.max(MIN_BUBBLES, area * DENSITY))
  );

  bubbles = [];
  for (let i = 0; i < targetCount; i++) {
    bubbles.push(new Bubble());
  }
}

resize();
window.addEventListener('resize', resize);

function animate(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bubbles.forEach(b => {
    b.update();
    b.draw(time * 0.001);
  });
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Pop on click/tap - coordinates relative to the canvas position
function handlePop(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  bubbles.forEach(b => {
    if (b.isHit(x, y)) b.pop();
  });
}

wrapper.addEventListener('click', (e) => handlePop(e.clientX, e.clientY));
wrapper.addEventListener('touchstart', (e) => {
  handlePop(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });