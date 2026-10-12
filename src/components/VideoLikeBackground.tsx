'use client';
// VideoLikeBackground — canvas-based full-screen particle animation that runs
// continuously like a video. 300+ milk/cream particles flowing in waves,
// rising mist, dripping drops, milk river at bottom, golden sparkles,
// and periodic splash bursts. Looks like a real animated video playing.

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number; // 0 = white, 1 = cream, 2 = gold, 3 = green
  layer: 0 | 1 | 2; // 0 = back (slow, small), 1 = mid, 2 = front (fast, big)
  type: 'flow' | 'rise' | 'drip' | 'sparkle';
  age: number;
  maxAge: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  age: number;
  maxAge: number;
}

interface CowWalker {
  x: number;
  y: number;
  direction: 1 | -1;
  speed: number;
  size: number;
  visible: boolean;
  nextSpawn: number;
}

export function VideoLikeBackground({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle pool — ~300 particles across 3 layers
    const targetCount = Math.floor(300 * density);
    const particles: Particle[] = [];

    const pickColor = (hue: number, opacity: number) => {
      if (hue === 0) return `rgba(255, 254, 250, ${opacity})`;        // milk white
      if (hue === 1) return `rgba(255, 244, 214, ${opacity})`;        // cream
      if (hue === 2) return `rgba(212, 162, 78, ${opacity})`;        // butter gold
      if (hue === 3) return `rgba(15, 81, 50, ${opacity})`;          // forest green
      return `rgba(255, 255, 255, ${opacity})`;
    };

    const spawnParticle = (type: Particle['type'], layer: Particle['layer']): Particle => {
      const layerSpeedMul = layer === 0 ? 0.4 : layer === 1 ? 1 : 1.8;
      const layerSizeMul = layer === 0 ? 0.6 : layer === 1 ? 1 : 1.5;
      const layerOpMul = layer === 0 ? 0.5 : layer === 1 ? 0.8 : 1;

      const hue = Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.6 ? 2 : 3;

      const base: Particle = {
        x: Math.random() * width,
        y: Math.random() * height,
        size: (2 + Math.random() * 6) * layerSizeMul,
        speedX: 0,
        speedY: 0,
        opacity: (0.3 + Math.random() * 0.5) * layerOpMul,
        hue,
        layer,
        type,
        age: 0,
        maxAge: 0,
      };

      if (type === 'flow') {
        // Flowing horizontally with slight wave
        base.speedX = (0.3 + Math.random() * 0.8) * layerSpeedMul * (Math.random() < 0.5 ? 1 : -1);
        base.speedY = (Math.random() - 0.5) * 0.2 * layerSpeedMul;
        base.maxAge = 8000 + Math.random() * 8000;
      } else if (type === 'rise') {
        // Rising like mist/steam from bottom
        base.x = Math.random() * width;
        base.y = height + Math.random() * 100;
        base.size = (3 + Math.random() * 10) * layerSizeMul;
        base.speedX = (Math.random() - 0.5) * 0.15;
        base.speedY = -(0.15 + Math.random() * 0.4) * layerSpeedMul;
        base.maxAge = 6000 + Math.random() * 6000;
        base.opacity = (0.2 + Math.random() * 0.4) * layerOpMul;
      } else if (type === 'drip') {
        // Falling milk drop
        base.x = Math.random() * width;
        base.y = -10;
        base.size = (4 + Math.random() * 6) * layerSizeMul;
        base.speedX = (Math.random() - 0.5) * 0.3;
        base.speedY = (0.6 + Math.random() * 1.2) * layerSpeedMul;
        base.maxAge = 4000 + Math.random() * 4000;
        base.opacity = (0.4 + Math.random() * 0.4) * layerOpMul;
      } else if (type === 'sparkle') {
        // Twinkling golden sparkle
        base.size = (1 + Math.random() * 2) * layerSizeMul;
        base.speedX = 0;
        base.speedY = 0;
        base.maxAge = 2000 + Math.random() * 3000;
        base.opacity = 0;
        base.hue = 2; // gold
      }
      return base;
    };

    // Seed initial particles
    for (let i = 0; i < targetCount; i++) {
      const r = Math.random();
      const type: Particle['type'] = r < 0.4 ? 'flow' : r < 0.65 ? 'rise' : r < 0.85 ? 'drip' : 'sparkle';
      const layer: Particle['layer'] = Math.random() < 0.4 ? 0 : Math.random() < 0.7 ? 1 : 2;
      particles.push(spawnParticle(type, layer));
    }

    // Splash bursts — spawn periodically at random positions
    const splashes: Splash[] = [];
    let nextSplashAt = 1500;

    // Walking cow — periodically crosses the screen
    const walker: CowWalker = {
      x: -100,
      y: height - 80,
      direction: 1,
      speed: 0.5,
      size: 60,
      visible: false,
      nextSpawn: 8000,
    };

    // Animation loop
    let raf = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const drawMilkRiver = () => {
      // Flowing milk "river" at bottom — animated wave
      const riverHeight = 60;
      const y0 = height - riverHeight;
      ctx.save();
      const grad = ctx.createLinearGradient(0, y0, 0, height);
      grad.addColorStop(0, 'rgba(255, 254, 250, 0)');
      grad.addColorStop(0.5, 'rgba(255, 252, 246, 0.5)');
      grad.addColorStop(1, 'rgba(255, 244, 214, 0.7)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin((x / 80) + (elapsed / 600)) * 6 + Math.sin((x / 40) + (elapsed / 350)) * 3;
        ctx.lineTo(x, y0 + wave);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Subtle highlight ripple
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const wave = Math.sin((x / 80) + (elapsed / 600)) * 6 + Math.sin((x / 40) + (elapsed / 350)) * 3;
        if (x === 0) ctx.moveTo(x, y0 + wave);
        else ctx.lineTo(x, y0 + wave);
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawCowWalker = (deltaMs: number) => {
      if (!walker.visible) {
        walker.nextSpawn -= deltaMs;
        if (walker.nextSpawn <= 0) {
          walker.visible = true;
          walker.direction = Math.random() < 0.5 ? 1 : -1;
          walker.x = walker.direction === 1 ? -100 : width + 100;
          walker.y = height - 80 - Math.random() * 40;
          walker.size = 50 + Math.random() * 30;
          walker.speed = 0.4 + Math.random() * 0.4;
        }
        return;
      }
      // Move
      walker.x += walker.speed * walker.direction * (deltaMs / 16);
      // Draw cow silhouette
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#1F1A12';
      ctx.translate(walker.x, walker.y);
      if (walker.direction === -1) ctx.scale(-1, 1);
      const s = walker.size / 60;
      ctx.scale(s, s);
      // Body
      ctx.beginPath();
      ctx.ellipse(0, 0, 36, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.beginPath();
      ctx.ellipse(-30, -8, 16, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Legs (animated)
      const legOffset = Math.sin(elapsed / 200) * 4;
      ctx.fillRect(-20, 18, 5, 14);
      ctx.fillRect(-10 + legOffset, 18, 5, 14);
      ctx.fillRect(10, 18, 5, 14);
      ctx.fillRect(20 - legOffset, 18, 5, 14);
      // Tail
      ctx.beginPath();
      ctx.moveTo(34, -4);
      ctx.quadraticCurveTo(44, 4, 42, 16);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1F1A12';
      ctx.stroke();
      ctx.restore();

      // Despawn when off-screen
      if ((walker.direction === 1 && walker.x > width + 120) ||
          (walker.direction === -1 && walker.x < -120)) {
        walker.visible = false;
        walker.nextSpawn = 10000 + Math.random() * 15000;
      }
    };

    const drawSplash = (s: Splash) => {
      const progress = s.age / s.maxAge;
      const radius = s.radius * (1 + progress * 2);
      const opacity = (1 - progress) * 0.5;
      ctx.save();
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      grad.addColorStop(0.4, `rgba(255, 252, 246, ${opacity * 0.6})`);
      grad.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
      ctx.fill();
      // Splash droplets
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = radius * 0.9;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(s.x + dx, s.y + dy, 2 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const frame = (now: number) => {
      const delta = Math.min(now - lastTime, 50);
      lastTime = now;
      elapsed += delta;

      // Clear with semi-transparent cream for trail effect
      ctx.fillStyle = 'rgba(244, 238, 226, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Soft radial highlights (static gradient atmosphere)
      const cx = width * 0.25;
      const cy = height * 0.20;
      const grad1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.4);
      grad1.addColorStop(0, 'rgba(255, 244, 214, 0.18)');
      grad1.addColorStop(1, 'rgba(255, 244, 214, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const cx2 = width * 0.75;
      const cy2 = height * 0.75;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, width * 0.4);
      grad2.addColorStop(0, 'rgba(212, 162, 78, 0.10)');
      grad2.addColorStop(1, 'rgba(212, 162, 78, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Update + draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += delta;
        p.x += p.speedX * (delta / 16);
        p.y += p.speedY * (delta / 16);

        // Type-specific behavior
        if (p.type === 'flow') {
          // Add wave motion
          p.y += Math.sin((elapsed / 800) + (p.x / 100)) * 0.3 * (p.layer + 1);
        } else if (p.type === 'sparkle') {
          // Twinkle
          const phase = p.age / p.maxAge;
          p.opacity = Math.sin(phase * Math.PI) * 0.8;
        } else if (p.type === 'rise') {
          // Sway
          p.x += Math.sin((elapsed / 1200) + (p.y / 80)) * 0.2;
        } else if (p.type === 'drip') {
          // Accelerate slightly (gravity)
          p.speedY += 0.005 * (delta / 16);
        }

        // Respawn if out of bounds or expired
        const expired = p.age > p.maxAge;
        const outOfBounds =
          p.x < -50 || p.x > width + 50 ||
          p.y < -50 || p.y > height + 50;

        if (expired || outOfBounds) {
          const newP = spawnParticle(p.type, p.layer);
          Object.assign(p, newP);
          continue;
        }

        // Draw
        ctx.save();
        ctx.fillStyle = pickColor(p.hue, p.opacity);
        if (p.type === 'drip') {
          // Draw as teardrop
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
          ctx.fill();
          // Highlight
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
          ctx.beginPath();
          ctx.ellipse(p.x - p.size * 0.2, p.y - p.size * 0.3, p.size * 0.15, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'sparkle') {
          // Cross-shape sparkle
          const s = p.size;
          ctx.fillStyle = pickColor(p.hue, p.opacity);
          ctx.beginPath();
          ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(212, 162, 78, ${p.opacity * 0.8})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x - s * 2, p.y); ctx.lineTo(p.x + s * 2, p.y);
          ctx.moveTo(p.x, p.y - s * 2); ctx.lineTo(p.x, p.y + s * 2);
          ctx.stroke();
        } else {
          // Circle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Spawn splash bursts periodically
      nextSplashAt -= delta;
      if (nextSplashAt <= 0) {
        splashes.push({
          x: Math.random() * width,
          y: height * 0.2 + Math.random() * (height * 0.5),
          radius: 20 + Math.random() * 40,
          age: 0,
          maxAge: 800,
        });
        nextSplashAt = 1500 + Math.random() * 3000;
      }

      // Draw splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.age += delta;
        drawSplash(s);
        if (s.age > s.maxAge) splashes.splice(i, 1);
      }

      // Milk river at bottom
      drawMilkRiver();

      // Walking cow
      drawCowWalker(delta);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, #F4EEE2 0%, #EDE4D2 50%, #F4EEE2 100%)',
      }}
    />
  );
}
