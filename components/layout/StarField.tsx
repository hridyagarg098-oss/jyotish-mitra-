'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  phase: number;
  speed: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const lastShootRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-generate stars on resize
      starsRef.current = Array.from({ length: 220 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0.4 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnShootingStar = () => {
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 4;
      const startX = Math.random() * canvas.width * 0.7;
      const startY = Math.random() * canvas.height * 0.4;
      shootingStarsRef.current.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 80 + Math.random() * 60,
        opacity: 0, life: 0,
        maxLife: 72, // ~1.2s at 60fps
        active: true,
      });
    };

    let time = 0;
    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016;

      // Spawn shooting star every 8 seconds
      if (timestamp - lastShootRef.current > 8000) {
        spawnShootingStar();
        lastShootRef.current = timestamp;
      }

      // Draw regular stars
      for (const star of starsRef.current) {
        const opacity = 0.15 + 0.75 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 199, 117, ${opacity})`;
        ctx.fill();
      }

      // Draw shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter(s => s.active);
      for (const ss of shootingStarsRef.current) {
        ss.life++;
        const progress = ss.life / ss.maxLife;

        // Fade in then fade out
        if (progress < 0.15) ss.opacity = progress / 0.15;
        else if (progress > 0.7) ss.opacity = (1 - progress) / 0.3;
        else ss.opacity = 1;

        const tailX = ss.x - ss.vx * (ss.length / Math.hypot(ss.vx, ss.vy));
        const tailY = ss.y - ss.vy * (ss.length / Math.hypot(ss.vx, ss.vy));

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(250, 199, 117, 0)`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity * 0.9})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ss.x += ss.vx;
        ss.y += ss.vy;

        if (ss.life >= ss.maxLife) ss.active = false;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
