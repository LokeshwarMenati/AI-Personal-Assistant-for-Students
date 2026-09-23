/**
 * StudyBuddy AI - Google Antigravity Inspired Zero-G Motion Background
 * Features:
 *  - Defying-gravity particle flow (slow vertical ascent with harmonic sine sway)
 *  - Interactive antigravity repulsion field & cursor gravitational filaments
 *  - Zero-G physics shockwaves on click
 *  - Morphing multi-chromatic aurora glow mesh (Gemini & Google Antigravity palette)
 *  - 3D perspective cyber grid with mouse parallax tracking
 *  - High-DPI retina canvas support & dynamic theme reactivity
 */

(function () {
    'use strict';

    // Antigravity Palette
    const PALETTES = {
        dark: [
            { r: 66, g: 133, b: 244, hex: '#4285f4' },  // Google Blue
            { r: 0, g: 240, b: 255, hex: '#00f0ff' },   // Electric Cyan
            { r: 168, g: 85, b: 247, hex: '#a855f7' },  // Gemini Violet
            { r: 236, g: 72, b: 153, hex: '#ec4899' },  // Neon Magenta
            { r: 52, g: 168, b: 83, hex: '#34a853' },   // Emerald
            { r: 251, g: 188, b: 4, hex: '#fbbc04' }    // Solar Amber
        ],
        light: [
            { r: 37, g: 99, b: 235, hex: '#2563eb' },
            { r: 124, g: 58, b: 237, hex: '#7c3aed' },
            { r: 13, g: 148, b: 136, hex: '#0d9488' },
            { r: 219, g: 39, b: 119, hex: '#db2777' }
        ]
    };

    function initAntigravityBackground() {
        // Ensure container & layers exist
        let canvas = document.querySelector('#ambientCanvas') || document.querySelector('#dashboardAmbientCanvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'ambientCanvas';
            canvas.className = 'ambient-canvas';
            document.body.prepend(canvas);
        }

        // Cyber Grid Layer
        let grid = document.querySelector('.antigravity-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'antigravity-grid';
            canvas.parentNode.insertBefore(grid, canvas);
        }

        // Aurora Glow Mesh
        let aurora = document.querySelector('.aurora-bg');
        if (!aurora) {
            aurora = document.createElement('div');
            aurora.className = 'aurora-bg';
            aurora.innerHTML = `
                <div class="aurora-blob blob-1"></div>
                <div class="aurora-blob blob-2"></div>
                <div class="aurora-blob blob-3"></div>
                <div class="aurora-blob blob-4"></div>
            `;
            canvas.parentNode.insertBefore(aurora, grid);
        } else if (!aurora.querySelector('.blob-4')) {
            const blob4 = document.createElement('div');
            blob4.className = 'aurora-blob blob-4';
            aurora.appendChild(blob4);
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let particles = [];
        let ripples = [];
        let animationFrameId = null;

        const mouse = {
            x: -2000,
            y: -2000,
            targetX: -2000,
            targetY: -2000,
            radius: 170,
            active: false
        };

        function isDarkMode() {
            return document.body.classList.contains('dark-mode') || 
                   document.body.getAttribute('data-theme') === 'dark' ||
                   document.body.getAttribute('data-theme') === 'neon' ||
                   !document.body.getAttribute('data-theme');
        }

        function resize() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = window.innerWidth;
            height = window.innerHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            ctx.scale(dpr, dpr);

            // Re-populate particles to match screen volume
            const targetCount = Math.floor((width * height) / 14000);
            const count = Math.max(50, Math.min(targetCount, 120));

            while (particles.length < count) {
                particles.push(createParticle(true));
            }
            if (particles.length > count) {
                particles.length = count;
            }
        }

        function createParticle(randomY) {
            const palette = isDarkMode() ? PALETTES.dark : PALETTES.light;
            const colorObj = palette[Math.floor(Math.random() * palette.length)];
            
            // Random particle type: circle, diamond sparkle, or micro-ring
            const randType = Math.random();
            const type = randType > 0.85 ? 'sparkle' : (randType > 0.7 ? 'ring' : 'circle');

            return {
                x: Math.random() * width,
                y: randomY ? Math.random() * height : height + 20 + Math.random() * 40,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -(0.3 + Math.random() * 0.65), // Defying gravity: floating upwards!
                baseVy: -(0.3 + Math.random() * 0.65),
                radius: type === 'sparkle' ? 2.5 + Math.random() * 2 : 1.2 + Math.random() * 2.2,
                color: colorObj,
                type: type,
                alpha: 0.25 + Math.random() * 0.55,
                baseAlpha: 0.25 + Math.random() * 0.55,
                phase: Math.random() * Math.PI * 2,
                swaySpeed: 0.015 + Math.random() * 0.02,
                swayAmp: 0.4 + Math.random() * 0.8,
                rotation: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.03
            };
        }

        // Mouse listeners
        window.addEventListener('mousemove', (e) => {
            mouse.targetX = e.clientX;
            mouse.targetY = e.clientY;
            mouse.active = true;

            // Subtle parallax tilt on grid & aurora
            const normX = (e.clientX / width - 0.5) * 2;
            const normY = (e.clientY / height - 0.5) * 2;

            if (grid) {
                grid.style.transform = `perspective(900px) rotateX(${18 - normY * 7}deg) rotateY(${normX * 6}deg) translate3d(${normX * 18}px, ${normY * 18}px, 0)`;
            }
            if (aurora) {
                aurora.style.transform = `translate3d(${normX * -25}px, ${normY * -25}px, 0)`;
            }
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            mouse.active = false;
            mouse.targetX = -2000;
            mouse.targetY = -2000;
        });

        // Click Shockwave (Anti-Gravity Pulse)
        window.addEventListener('click', (e) => {
            // Trigger an antigravity shockwave ripple
            ripples.push({
                x: e.clientX,
                y: e.clientY,
                radius: 5,
                maxRadius: Math.min(width, height) * 0.35,
                speed: 6.5,
                strength: 7,
                alpha: 0.75
            });
        }, { passive: true });

        function updateRipples() {
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.radius += r.speed;
                r.alpha *= 0.94;

                // Push particles caught in the shockwave ring
                for (let j = 0; j < particles.length; j++) {
                    const p = particles[j];
                    const dx = p.x - r.x;
                    const dy = p.y - r.y;
                    const dist = Math.hypot(dx, dy);
                    const ringDist = Math.abs(dist - r.radius);

                    if (ringDist < 35 && dist > 0.001) {
                        const pushForce = ((35 - ringDist) / 35) * r.strength * (r.alpha);
                        p.vx += (dx / dist) * pushForce;
                        p.vy += (dy / dist) * pushForce;
                    }
                }

                if (r.radius > r.maxRadius || r.alpha < 0.02) {
                    ripples.splice(i, 1);
                }
            }
        }

        function drawRipples() {
            for (let i = 0; i < ripples.length; i++) {
                const r = ripples[i];
                ctx.save();
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 240, 255, ${r.alpha * 0.4})`;
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 12;
                ctx.stroke();
                ctx.restore();
            }
        }

        function drawSparkle(x, y, radius, color, alpha, rotation) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.beginPath();
            // 4-pointed diamond star
            const s = radius * 1.5;
            ctx.moveTo(0, -s);
            ctx.quadraticCurveTo(0, 0, s, 0);
            ctx.quadraticCurveTo(0, 0, 0, s);
            ctx.quadraticCurveTo(0, 0, -s, 0);
            ctx.quadraticCurveTo(0, 0, 0, -s);
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            ctx.shadowColor = color.hex;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.restore();
        }

        let time = 0;
        function animate() {
            time += 0.02;

            // Clear frame
            ctx.clearRect(0, 0, width, height);

            // Smooth mouse follow
            mouse.x += (mouse.targetX - mouse.x) * 0.12;
            mouse.y += (mouse.targetY - mouse.y) * 0.12;

            updateRipples();
            drawRipples();

            const isDark = isDarkMode();
            const connDistThreshold = 95;
            const mouseConnThreshold = 160;

            // 1. Update particle physics
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Anti-gravity upward ascension + horizontal wave
                p.phase += p.swaySpeed;
                p.rotation += p.rotSpeed;
                p.x += p.vx + Math.sin(p.phase) * p.swayAmp;
                p.y += p.vy;

                // Restoring base velocity (viscous medium damping)
                p.vx *= 0.94;
                p.vy += (p.baseVy - p.vy) * 0.03;

                // Mouse repulsive antigravity force field
                if (mouse.active) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < mouse.radius && dist > 1) {
                        const force = (mouse.radius - dist) / mouse.radius;
                        const angle = Math.atan2(dy, dx);
                        p.vx += Math.cos(angle) * force * 1.8;
                        p.vy += Math.sin(angle) * force * 1.8;
                    }
                }

                // Breathing alpha oscillation
                p.alpha = p.baseAlpha * (0.8 + 0.2 * Math.sin(time + p.phase));

                // Screen Wrap (Recycle to bottom when floating off top)
                if (p.y < -25) {
                    p.y = height + 15 + Math.random() * 20;
                    p.x = Math.random() * width;
                    p.vx = (Math.random() - 0.5) * 0.4;
                } else if (p.y > height + 50) {
                    p.y = -20;
                }

                if (p.x < -30) p.x = width + 20;
                if (p.x > width + 30) p.x = -20;
            }

            // 2. Draw Interconnected Constellation Filaments
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];

                // Connect to nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < connDistThreshold) {
                        const alpha = (1 - dist / connDistThreshold) * 0.22 * (isDark ? 1 : 0.6);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${alpha})`;
                        ctx.lineWidth = 0.85;
                        ctx.stroke();
                    }
                }

                // Connect to cursor (tactile energy filament)
                if (mouse.active) {
                    const dx = p1.x - mouse.x;
                    const dy = p1.y - mouse.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < mouseConnThreshold) {
                        const lineAlpha = (1 - dist / mouseConnThreshold) * 0.35 * (isDark ? 1 : 0.7);
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        
                        const grad = ctx.createLinearGradient(p1.x, p1.y, mouse.x, mouse.y);
                        grad.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${lineAlpha})`);
                        grad.addColorStop(1, `rgba(0, 240, 255, ${lineAlpha * 0.4})`);
                        
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 1.1;
                        ctx.stroke();
                    }
                }
            }

            // 3. Draw Particles
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const c = p.color;

                if (p.type === 'sparkle') {
                    drawSparkle(p.x, p.y, p.radius, c, p.alpha, p.rotation);
                } else if (p.type === 'ring') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius * 1.4, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${p.alpha * 0.85})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                } else {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${p.alpha})`;
                    ctx.shadowColor = c.hex;
                    ctx.shadowBlur = isDark ? 8 : 4;
                    ctx.fill();
                    ctx.restore();
                }
            }

            // 4. Draw Mouse Halo if active
            if (mouse.active) {
                ctx.save();
                const mouseGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
                mouseGrad.addColorStop(0, isDark ? 'rgba(0, 240, 255, 0.08)' : 'rgba(37, 99, 235, 0.05)');
                mouseGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
                ctx.fillStyle = mouseGrad;
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', resize);
        resize();
        animate();

        // Cleanup if page unloads
        window.addEventListener('beforeunload', () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAntigravityBackground);
    } else {
        initAntigravityBackground();
    }
})();
