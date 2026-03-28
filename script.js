const mainScreen = document.getElementById('main-screen');
const summonBtn = document.getElementById('summon-btn');
const summonOverlay = document.getElementById('summon-overlay');
const summonFxCanvas = document.getElementById('summon-fx-canvas');
const whiteFlash = document.getElementById('white-flash');

const cardRevealOverlay = document.getElementById('card-reveal-overlay');
const cardStage = document.getElementById('card-stage');
const theCard = document.getElementById('the-card');
const cardBgImage = document.getElementById('card-bg-image');
const cardGlare = document.getElementById('card-glare');

const rarityText = document.getElementById('rarity-text');
const taskDesc = document.getElementById('task-desc');
const starsRow = document.getElementById('stars-row');
const retryBtn = document.getElementById('retry-btn');

const mainBgCanvas = document.getElementById('main-bg-canvas');
const confettiCanvas = document.getElementById('confetti-canvas');

const RARITY_THEME = {
    easy: {
        label: '惬意日常',
        stars: '★ ★',
        card: 'card_easy.png',
        bg: 'img/azure_breeze_bg.png',
        char: 'char_1.png',
        fallbackTask: '去喷泉边散散步',
        fx: ['93, 214, 255', '174, 239, 255', '237, 251, 255']
    },
    normal: {
        label: '小镇惊喜',
        stars: '★ ★ ★',
        card: 'card_normal.png',
        bg: 'img/purple_magic_bg.png',
        char: 'char_2.png',
        fallbackTask: '收下一份今天的惊喜',
        fx: ['211, 103, 160', '229, 133, 181', '246, 190, 219']
    },
    hard: {
        label: '传奇挑战',
        stars: '★ ★ ★ ★',
        card: 'card_hard.png',
        bg: 'img/amber_sunset_bg.png',
        char: 'char_3.png',
        fallbackTask: '挑战一次传奇任务',
        fx: ['255, 194, 46', '255, 231, 138', '255, 248, 216']
    }
};

const TIMING = {
    lock: 1600,
    charge: 1900,
    compress: 1050,
    tear: 450,
    flash: 160,
    bridgeLead: 240,
    revealSettle: 760,
    impactHold: 560,
    flip: 1180,
    retry: 900
};

let isSummoning = false;
let taskData = { easy: [], normal: [], hard: [] };
let activeTiltPointerId = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomChoice = items => items[Math.floor(Math.random() * items.length)];
const randomRange = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;

function setCanvasSize(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

async function loadTasks() {
    try {
        const response = await fetch('tasks.md');
        const text = await response.text();
        const parsed = { easy: [], normal: [], hard: [] };
        let currentCategory = '';

        text.split('\n').forEach(line => {
            const trimmed = line.trim();
            const lower = trimmed.toLowerCase();

            if (lower.startsWith('## easy')) currentCategory = 'easy';
            else if (lower.startsWith('## normal')) currentCategory = 'normal';
            else if (lower.startsWith('## hard')) currentCategory = 'hard';
            else if (trimmed.startsWith('- ') && currentCategory) {
                parsed[currentCategory].push(trimmed.slice(2).trim());
            }
        });

        taskData = parsed;
    } catch (error) {
        console.error('任务读取失败:', error);
    }
}

function drawDestiny() {
    const roll = Math.random() * 100;
    const rarity = roll < 15 ? 'hard' : roll < 50 ? 'normal' : 'easy';
    const theme = RARITY_THEME[rarity];
    const pool = taskData[rarity];

    return {
        rarity,
        task: pool.length ? randomChoice(pool) : theme.fallbackTask,
        bg: theme.bg
    };
}

function applyDestinySkin(destiny) {
    const theme = RARITY_THEME[destiny.rarity];
    const charPop = document.getElementById('card-char-pop');
    const foil = document.getElementById('card-holographic-foil');

    summonOverlay.dataset.rarity = destiny.rarity;
    cardRevealOverlay.dataset.rarity = destiny.rarity;

    theCard.classList.remove('theme-easy', 'theme-normal', 'theme-hard');
    theCard.classList.add(`theme-${destiny.rarity}`);

    rarityText.textContent = theme.label;
    taskDesc.textContent = destiny.task;
    starsRow.textContent = theme.stars;
    cardBgImage.style.backgroundImage = `url('${theme.card}')`;

    if (charPop) {
        charPop.style.backgroundImage = '';
    }
    
    // Reset foil position
    if (foil) {
        foil.style.backgroundPosition = '0% 0%';
    }
}

function resetCardTilt() {
    const foil = document.getElementById('card-holographic-foil');
    const charPop = document.getElementById('card-char-pop');
    
    theCard.style.transform = '';
    cardGlare.style.transform = '';
    
    if (foil) {
        foil.style.backgroundPosition = '50% 50%';
    }
    if (charPop) {
        charPop.style.transform = 'translateX(-50%) translateY(0) translateZ(45px)';
    }
}

function canTiltCard() {
    return cardRevealOverlay.classList.contains('active') && cardStage.classList.contains('presented');
}

function updateCardTilt(clientX, clientY) {
    if (!canTiltCard()) return;

    const rect = cardStage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clamp((clientX - centerX) / (rect.width / 2), -1, 1);
    const dy = clamp((clientY - centerY) / (rect.height / 2), -1, 1);

    const foil = document.getElementById('card-holographic-foil');
    const charPop = document.getElementById('card-char-pop');

    theCard.style.transition = 'transform 0.1s ease-out, filter 0.18s ease-out';
    theCard.style.transform = `rotateX(${-dy * 18}deg) rotateY(${dx * 18}deg)`;
    cardGlare.style.transform = `translate(${dx * 20}px, ${dy * 20}px) rotate(${dx * 5}deg)`;

    if (foil) {
        foil.style.backgroundPosition = `${50 + dx * 20}% ${50 + dy * 20}%`;
    }

    if (charPop) {
        charPop.style.transform = `translateX(calc(-50% + ${dx * 32}px)) translateY(${dy * 22}px) translateZ(45px)`;
    }
}

function clearSummonScene() {
    summonOverlay.classList.remove('active', 'phase-charge', 'phase-compress', 'phase-tear');
    summonOverlay.style.removeProperty('--gate-open');
}

function resetRevealScene() {
    retryBtn.classList.remove('active');
    revealFx.stop();
    cardRevealOverlay.classList.remove('impacting');
    cardStage.classList.remove('materializing', 'presented');
    theCard.classList.remove('flipped');
    resetCardTilt();
    // 强制重置 3D 旋转和缩放，防止下一次抽卡位置错乱
    gsap.set([cardRevealOverlay, cardStage, theCard], { clearProps: "all" });
    gsap.set(retryBtn, { autoAlpha: 0, y: 30 }); // Reset button state
    gsap.set(theCard, { rotateX: 0, rotateY: 0, rotateZ: 0, z: 0, scale: 1 });
}

function collapseReveal() {
    return new Promise(resolve => {
        const tl = gsap.timeline({ onComplete: resolve });
        tl.to(cardStage, { 
            scale: 0.8, 
            opacity: 0, 
            y: 100, 
            duration: 0.36, 
            ease: "power2.in" 
        })
        .to(cardRevealOverlay, { 
            opacity: 0, 
            duration: 0.28 
        })
        .add(() => {
            resetRevealScene();
            clearSummonScene();
        });
    });
}

function triggerShake(intensity = 'medium') {
    const duration = intensity === 'heavy' ? 500 : intensity === 'light' ? 150 : 300;
    const cls = intensity === 'light' ? 'screen-shake-light' : 'screen-shake-heavy';
    document.body.classList.add(cls);
    setTimeout(() => {
        document.body.classList.remove(cls);
    }, duration);
}

function triggerImpactFrame() {
    const frame = document.createElement('div');
    frame.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: white;
        mix-blend-mode: difference;
        pointer-events: none;
    `;
    document.body.appendChild(frame);
    setTimeout(() => frame.remove(), 40);
}

async function collapseReveal() {
    resetRevealScene();
    cardRevealOverlay.classList.remove('active');
    await sleep(220);
}

function closeReveal() {
    if (isSummoning || !cardRevealOverlay.classList.contains('active')) return;

    resetRevealScene();
    cardRevealOverlay.classList.remove('active');

    setTimeout(() => {
        mainScreen.classList.remove('fade-out');
    }, 260);
}

class BackgroundEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.orbs = [];
        this.lines = [];
        this.resize();
        this.seed();
        window.addEventListener('resize', () => {
            this.resize();
            this.seed();
        });
    }

    resize() {
        setCanvasSize(this.canvas, this.ctx);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    seed() {
        this.orbs = Array.from({ length: 18 }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: randomRange(60, 180),
            alpha: randomRange(0.04, 0.12),
            driftX: randomRange(-0.08, 0.08),
            driftY: randomRange(-0.1, 0.04)
        }));

        this.lines = Array.from({ length: 18 }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            length: randomRange(120, 360),
            alpha: randomRange(0.03, 0.08),
            speed: randomRange(0.24, 0.54)
        }));
    }

    draw = () => {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.orbs.forEach(orb => {
            orb.x += orb.driftX;
            orb.y += orb.driftY;

            if (orb.x < -orb.radius) orb.x = this.width + orb.radius;
            if (orb.x > this.width + orb.radius) orb.x = -orb.radius;
            if (orb.y < -orb.radius) orb.y = this.height + orb.radius;

            const gradient = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
            gradient.addColorStop(0, `rgba(255,190,120,${orb.alpha})`);
            gradient.addColorStop(1, 'rgba(255,190,120,0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.lines.forEach(line => {
            line.y += line.speed;
            if (line.y - line.length > this.height) {
                line.y = -line.length;
                line.x = Math.random() * this.width;
            }

            const gradient = this.ctx.createLinearGradient(line.x, line.y - line.length, line.x, line.y);
            gradient.addColorStop(0, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, `rgba(255,220,180,${line.alpha})`);
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(line.x, line.y - line.length);
            this.ctx.lineTo(line.x, line.y);
            this.ctx.stroke();
        });

        requestAnimationFrame(this.draw);
    };
}

class SummonFxEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.active = false;
        this.phase = 'idle';
        this.phaseTime = 0;
        this.intensity = 1;
        this.palette = RARITY_THEME.normal.fx;
        this.ambient = [];
        this.inward = [];
        this.burst = [];
        this.waves = [];
        this.rafId = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        setCanvasSize(this.canvas, this.ctx);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    start(rarity) {
        this.stop();
        this.active = true;
        this.phase = 'lock';
        this.phaseTime = 0;
        this.intensity = 1;
        this.palette = RARITY_THEME[rarity].fx;
        this.seedAmbient();
        this.inward = [];
        this.burst = [];
        this.waves = [];
        this.animate();
    }

    stop() {
        this.active = false;
        cancelAnimationFrame(this.rafId);
        this.ctx.clearRect(0, 0, this.width, this.height);
        summonOverlay.style.removeProperty('--gate-open');
    }

    setIntensity(value) {
        this.intensity = value;
    }

    setPhase(phase) {
        if (phase === this.phase) return;
        this.phase = phase;
        this.phaseTime = 0;

        if (phase === 'charge') {
            this.seedInward(40);
        } else if (phase === 'compress') {
            this.seedInward(90);
            this.spawnWave(70, 0.2, 2.2);
        } else if (phase === 'tear') {
            const streakCount = this.palette === RARITY_THEME.hard.fx ? 300 : 180;
            for (let i = 0; i < streakCount; i += 1) this.spawnBurstStreak();
            this.spawnWave(54, 0.75, 5.2);
            this.spawnWave(84, 0.56, 4.3);
            if (this.palette === RARITY_THEME.hard.fx) {
                this.spawnWave(120, 0.8, 8);
                this.spawnWave(180, 0.4, 12);
            }
        }
    }

    seedAmbient() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        this.ambient = Array.from({ length: 96 }, () => {
            const angle = Math.random() * Math.PI * 2;
            const radius = randomRange(80, Math.min(this.width, this.height) * 0.42);
            return {
                angle,
                radius,
                size: randomRange(1.2, 3.4),
                speed: randomRange(-0.009, 0.009),
                alpha: randomRange(0.08, 0.32),
                color: randomChoice(this.palette),
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            };
        });
    }

    randomEdgePoint() {
        const margin = 90;
        const side = Math.floor(Math.random() * 4);

        if (side === 0) return { x: randomRange(-margin, this.width + margin), y: -margin };
        if (side === 1) return { x: this.width + margin, y: randomRange(-margin, this.height + margin) };
        if (side === 2) return { x: randomRange(-margin, this.width + margin), y: this.height + margin };
        return { x: -margin, y: randomRange(-margin, this.height + margin) };
    }

    seedInward(count) {
        for (let i = 0; i < count; i += 1) this.spawnInwardShard();
    }

    spawnInwardShard() {
        const origin = this.randomEdgePoint();
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const targetX = centerX + randomRange(-70, 70);
        const targetY = centerY + randomRange(-240, 240);
        const dx = targetX - origin.x;
        const dy = targetY - origin.y;
        const length = Math.hypot(dx, dy) || 1;

        this.inward.push({
            x: origin.x,
            y: origin.y,
            px: origin.x,
            py: origin.y,
            tx: targetX,
            ty: targetY,
            vx: dx / length,
            vy: dy / length,
            speed: randomRange(6, 12),
            size: randomRange(1.6, 3.8),
            life: randomRange(28, 56),
            age: 0,
            alpha: randomRange(0.3, 0.82),
            color: randomChoice(this.palette)
        });
    }

    spawnBurstStreak() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const angle = Math.random() * Math.PI * 2;
        const speed = randomRange(8, 22) * this.intensity;

        this.burst.push({
            x: centerX + Math.cos(angle) * randomRange(0, 16),
            y: centerY + Math.sin(angle) * randomRange(0, 16),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            width: randomRange(1.2, 4.4),
            length: randomRange(18, 88),
            alpha: randomRange(0.28, 0.92),
            life: randomRange(10, 24),
            age: 0,
            color: randomChoice(this.palette)
        });
    }

    spawnWave(radius, alpha, width) {
        this.waves.push({
            radius,
            alpha,
            width,
            speed: randomRange(8, 14),
            color: randomChoice(this.palette)
        });
    }

    animate = () => {
        if (!this.active) return;

        const centerX = this.width / 2;
        const centerY = this.height / 2;
        this.phaseTime += 1;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        const riftGlow = this.phase === 'charge' ? 0.76 : this.phase === 'compress' ? 1.18 : 1.42;

        const centerGlow = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 320);
        centerGlow.addColorStop(0, `rgba(${this.palette[1]},${0.12 + riftGlow * 0.14})`);
        centerGlow.addColorStop(0.3, `rgba(${this.palette[0]},${0.1 + riftGlow * 0.12})`);
        centerGlow.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = centerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 320, 0, Math.PI * 2);
        this.ctx.fill();

        this.ambient.forEach(mote => {
            if (this.phase === 'lock') {
                mote.angle += mote.speed;
            } else if (this.phase === 'charge' || this.phase === 'compress') {
                const targetAngle = Math.atan2(centerY - mote.y, centerX - mote.x);
                mote.angle = lerp(mote.angle, targetAngle, this.phase === 'compress' ? 0.08 : 0.04);
                mote.radius = lerp(mote.radius, 46, this.phase === 'compress' ? 0.08 : 0.04);
            } else {
                mote.radius += 7;
            }

            mote.x = centerX + Math.cos(mote.angle) * mote.radius;
            mote.y = centerY + Math.sin(mote.angle) * mote.radius;

            const alpha = mote.alpha * (this.phase === 'tear' ? 0.34 : 0.76);
            this.ctx.fillStyle = `rgba(${mote.color},${alpha})`;
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = `rgba(${mote.color},${alpha})`;
            this.ctx.beginPath();
            this.ctx.rect(mote.x - mote.size/2, mote.y - mote.size/2, mote.size, mote.size);
            this.ctx.fill();
        });

        if ((this.phase === 'charge' || this.phase === 'compress') && this.phaseTime % (this.phase === 'compress' ? 1 : 2) === 0) {
            const count = this.phase === 'compress' ? 7 : 4;
            for (let i = 0; i < count; i += 1) this.spawnInwardShard();
        }

        if (this.phase === 'tear' && this.phaseTime < 20) {
            for (let i = 0; i < 18; i += 1) this.spawnBurstStreak();
        }

        this.inward = this.inward.filter(shard => {
            shard.px = shard.x;
            shard.py = shard.y;
            shard.age += 1;
            const speedBoost = this.phase === 'compress' ? 1.5 : 1;
            shard.x += shard.vx * shard.speed * speedBoost;
            shard.y += shard.vy * shard.speed * speedBoost;

            const dx = shard.tx - shard.x;
            const dy = shard.ty - shard.y;
            const dist = Math.hypot(dx, dy);
            const lifeProgress = shard.age / shard.life;
            const alpha = shard.alpha * (1 - lifeProgress);

            this.ctx.strokeStyle = `rgba(${shard.color},${alpha})`;
            this.ctx.lineWidth = shard.size;
            this.ctx.lineCap = 'round';
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = `rgba(${shard.color},${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(shard.px, shard.py);
            this.ctx.lineTo(shard.x, shard.y);
            this.ctx.stroke();

            return dist > 16 && lifeProgress < 1;
        });

        this.burst = this.burst.filter(streak => {
            streak.age += 1;
            streak.x += streak.vx;
            streak.y += streak.vy;
            streak.vx *= 0.94;
            streak.vy *= 0.94;
            const lifeProgress = streak.age / streak.life;
            const alpha = streak.alpha * (1 - lifeProgress);
            const tailX = streak.x - streak.vx * 0.9;
            const tailY = streak.y - streak.vy * 0.9;
            const headX = streak.x + streak.vx * 0.18;
            const headY = streak.y + streak.vy * 0.18;

            this.ctx.strokeStyle = `rgba(${streak.color},${alpha})`;
            this.ctx.lineWidth = streak.width * (1 - lifeProgress * 0.42);
            this.ctx.lineCap = 'round';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = `rgba(${streak.color},${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(headX, headY);
            this.ctx.stroke();

            return lifeProgress < 1;
        });

        this.waves = this.waves.filter(wave => {
            wave.radius += wave.speed;
            wave.alpha *= 0.95;

            this.ctx.strokeStyle = `rgba(${wave.color},${wave.alpha})`;
            this.ctx.lineWidth = wave.width;
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(Math.PI / 4); // Diamond rotation
            this.ctx.beginPath();
            const r = wave.radius;
            this.ctx.rect(-r, -r, r * 2, r * 2);
            this.ctx.stroke();
            this.ctx.restore();

            return wave.alpha > 0.02;
        });

        this.ctx.restore();
        this.rafId = requestAnimationFrame(this.animate);
    };
}

class RevealFxEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.active = false;
        this.palette = RARITY_THEME.normal.fx;
        this.anchor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.sparkles = [];
        this.trails = [];
        this.embers = [];
        this.rings = [];
        this.rafId = 0;
        this.time = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        setCanvasSize(this.canvas, this.ctx);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    start(rarity, rect) {
        this.stop();
        this.active = true;
        this.palette = RARITY_THEME[rarity].fx;
        this.anchor = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height * 0.46
        };
        this.sparkles = Array.from({ length: 28 }, () => ({
            angle: Math.random() * Math.PI * 2,
            radius: randomRange(rect.width * 0.18, rect.width * 0.7),
            size: randomRange(1.4, 3.8),
            speed: randomRange(-0.014, 0.014),
            alpha: randomRange(0.18, 0.42),
            color: randomChoice(this.palette)
        }));
        this.trails = [];
        this.embers = [];
        this.rings = [
            { radius: rect.width * 0.3, alpha: 0.32, width: 2.4, speed: 3.6, color: this.palette[0] },
            { radius: rect.width * 0.42, alpha: 0.24, width: 1.8, speed: 2.8, color: this.palette[1] }
        ];
        this.time = 0;
        this.animate();
    }

    stop() {
        this.active = false;
        cancelAnimationFrame(this.rafId);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    spawnTrail() {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomRange(5, 14);
        this.trails.push({
            x: this.anchor.x + Math.cos(angle) * randomRange(6, 24),
            y: this.anchor.y + Math.sin(angle) * randomRange(6, 24),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * 0.76,
            width: randomRange(1.2, 3.4),
            alpha: randomRange(0.24, 0.74),
            life: randomRange(12, 26),
            age: 0,
            color: randomChoice(this.palette)
        });
    }

    spawnEmber() {
        this.embers.push({
            x: this.anchor.x + randomRange(-120, 120),
            y: this.anchor.y + randomRange(100, 220),
            vx: randomRange(-0.6, 0.6),
            vy: randomRange(-3.8, -1.4),
            size: randomRange(1.4, 3.8),
            alpha: randomRange(0.18, 0.48),
            life: randomRange(44, 90),
            age: 0,
            color: randomChoice(this.palette)
        });
    }

    animate = () => {
        if (!this.active) return;

        this.time += 1;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        const aura = this.ctx.createRadialGradient(this.anchor.x, this.anchor.y, 0, this.anchor.x, this.anchor.y, 320);
        aura.addColorStop(0, `rgba(${this.palette[1]},0.24)`);
        aura.addColorStop(0.42, `rgba(${this.palette[0]},0.12)`);
        aura.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = aura;
        this.ctx.beginPath();
        this.ctx.arc(this.anchor.x, this.anchor.y, 320, 0, Math.PI * 2);
        this.ctx.fill();

        this.rings = this.rings.filter(ring => {
            ring.radius += ring.speed;
            ring.alpha *= 0.97;

            this.ctx.strokeStyle = `rgba(${ring.color},${ring.alpha})`;
            this.ctx.lineWidth = ring.width;
            this.ctx.save();
            this.ctx.translate(this.anchor.x, this.anchor.y);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.beginPath();
            const r = ring.radius;
            this.ctx.rect(-r, -r, r * 2, r * 2);
            this.ctx.stroke();
            this.ctx.restore();

            return ring.alpha > 0.02;
        });

        this.sparkles.forEach(sparkle => {
            sparkle.angle += sparkle.speed;
            const x = this.anchor.x + Math.cos(sparkle.angle) * sparkle.radius;
            const y = this.anchor.y + Math.sin(sparkle.angle) * sparkle.radius * 0.72;
            const alpha = sparkle.alpha * (0.6 + Math.sin(this.time * 0.06 + sparkle.angle) * 0.4);

            this.ctx.fillStyle = `rgba(${sparkle.color},${alpha})`;
            this.ctx.shadowBlur = 16;
            this.ctx.shadowColor = `rgba(${sparkle.color},${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, sparkle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        if ((this.time < 52 && this.time % 1 === 0) || (this.time < 132 && this.time % 3 === 0)) {
            const burstCount = this.time < 20 ? 8 : 4;
            for (let i = 0; i < burstCount; i += 1) this.spawnTrail();
        }

        if ((this.time < 160 && this.time % 2 === 0) || (this.time < 320 && this.time % 6 === 0)) {
            this.spawnEmber();
        }

        this.trails = this.trails.filter(trail => {
            trail.age += 1;
            trail.x += trail.vx;
            trail.y += trail.vy;
            trail.vx *= 0.94;
            trail.vy *= 0.94;
            const lifeProgress = trail.age / trail.life;
            const alpha = trail.alpha * (1 - lifeProgress);
            const tailX = trail.x - trail.vx;
            const tailY = trail.y - trail.vy;

            this.ctx.strokeStyle = `rgba(${trail.color},${alpha})`;
            this.ctx.lineWidth = trail.width * (1 - lifeProgress * 0.32);
            this.ctx.lineCap = 'round';
            this.ctx.shadowBlur = 18;
            this.ctx.shadowColor = `rgba(${trail.color},${alpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(trail.x, trail.y);
            this.ctx.stroke();

            return lifeProgress < 1;
        });

        this.embers = this.embers.filter(ember => {
            ember.age += 1;
            ember.x += ember.vx;
            ember.y += ember.vy;
            ember.vy += 0.02;
            const lifeProgress = ember.age / ember.life;
            const alpha = ember.alpha * (1 - lifeProgress);

            this.ctx.fillStyle = `rgba(${ember.color},${alpha})`;
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = `rgba(${ember.color},${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
            this.ctx.fill();

            return lifeProgress < 1;
        });

        this.ctx.restore();
        this.rafId = requestAnimationFrame(this.animate);
    };
}

const mainBg = new BackgroundEngine(mainBgCanvas);
const summonFx = new SummonFxEngine(summonFxCanvas);
const revealFx = new RevealFxEngine(confettiCanvas);

mainBg.draw();

document.addEventListener('pointermove', event => {
    if (!cardRevealOverlay.classList.contains('active') || !cardStage.classList.contains('presented')) return;

    const rect = cardStage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clamp((event.clientX - centerX) / (rect.width / 2), -1, 1);
    const dy = clamp((event.clientY - centerY) / (rect.height / 2), -1, 1);

    const foil = document.getElementById('card-holographic-foil');
    const charPop = document.getElementById('card-char-pop');

    // 1. 基座倾斜 (The Base)
    theCard.style.transition = 'transform 0.1s ease-out, filter 0.18s ease-out';
    theCard.style.transform = `rotateX(${-dy * 18}deg) rotateY(${dx * 18}deg)`;
    
    // 2. 扫光层 (Glare)
    cardGlare.style.transform = `translate(${dx * 20}px, ${dy * 20}px) rotate(${dx * 5}deg)`;

    // 3. 镭射炫彩层视差 (Holographic Shimmer)
    if (foil) {
        foil.style.backgroundPosition = `${50 + dx * 20}% ${50 + dy * 20}%`;
    }

    // 4. 角色出屏视差 (Pop-out Parallax)
    if (charPop) {
        // 多倍率位移，产生深度的分离感
        charPop.style.transform = `translateX(calc(-50% + ${dx * 32}px)) translateY(${dy * 22}px) translateZ(45px)`;
    }
});

document.addEventListener('pointerup', resetCardTilt);
document.addEventListener('pointercancel', resetCardTilt);
cardRevealOverlay.addEventListener('pointerleave', resetCardTilt);
cardStage.addEventListener('pointerdown', event => {
    if (!canTiltCard()) return;

    if (event.pointerType === 'touch') {
        event.preventDefault();
    }
    activeTiltPointerId = event.pointerId;
    cardStage.setPointerCapture(event.pointerId);
    updateCardTilt(event.clientX, event.clientY);
});

cardStage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || activeTiltPointerId !== event.pointerId) return;

    event.preventDefault();
    updateCardTilt(event.clientX, event.clientY);
});

cardStage.addEventListener('pointerup', event => {
    if (activeTiltPointerId === event.pointerId) {
        activeTiltPointerId = null;
    }
    if (cardStage.hasPointerCapture(event.pointerId)) {
        cardStage.releasePointerCapture(event.pointerId);
    }
});

cardStage.addEventListener('pointercancel', event => {
    if (activeTiltPointerId === event.pointerId) {
        activeTiltPointerId = null;
    }
    if (cardStage.hasPointerCapture(event.pointerId)) {
        cardStage.releasePointerCapture(event.pointerId);
    }
});

window.addEventListener('blur', resetCardTilt);
window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeReveal();
});

async function triggerSummon() {
    if (isSummoning) return;
    isSummoning = true;

    try {
        const destiny = drawDestiny();
        const retrying = cardRevealOverlay.classList.contains('active');
        applyDestinySkin(destiny);

        if (retrying) {
            await collapseReveal();
        }

        const mainTl = gsap.timeline({
            defaults: { ease: "power2.inOut" }
        });

        // 1. 首页极速淡出
        mainTl.to(mainScreen, { 
            opacity: 0, 
            scale: 0.92, 
            duration: 0.4, 
            onStart: () => {
                clearSummonScene();
                summonOverlay.classList.add('active');
                whiteFlash.style.opacity = '0';
                summonFx.start(destiny.rarity);
                // 强制重置卡片初始旋转角度（确保第一帧显示的是卡背）
                gsap.set(theCard, { rotateX: 0, rotateY: 0, rotateZ: 0, z: 0, scale: 1 });
            }
        });

        // 2. 蓄力 (Charge)
        mainTl.add(() => {
            summonOverlay.classList.add('phase-charge');
            summonFx.setPhase('charge');
            summonFx.setIntensity(1.8);
        })
        .to(summonOverlay, { 
            "--gate-open": "48.5vw", 
            duration: 1.6, 
            ease: "sine.inOut" 
        });

        // 3. 瞬间回缩 (The Recoil / Squeeze)
        mainTl.add(() => {
            summonOverlay.classList.add('phase-compress');
            summonFx.setPhase('compress');
            summonFx.setIntensity(2.8);
            triggerShake('light');
        })
        .to(summonOverlay, { 
            "--gate-open": "52vw", 
            duration: 0.7, 
            ease: "back.in(4.2)" 
        });

        // 4. 暴力撕裂 (The Ultimate Burst)
        mainTl.add(() => {
            summonOverlay.classList.add('phase-tear');
            summonFx.setPhase('tear');
            summonFx.setIntensity(destiny.rarity === 'hard' ? 6.2 : 3.8);
            triggerShake(destiny.rarity === 'hard' ? 'heavy' : 'medium');
            if (destiny.rarity === 'hard') {
                triggerImpactFrame();
                setTimeout(triggerImpactFrame, 80);
            }
        })
        .to(summonOverlay, { 
            "--gate-open": "-30vw", 
            duration: 0.38, 
            ease: "expo.in" 
        })
        .to(whiteFlash, { opacity: 1, duration: 0.08 })
        .add(() => {
             if (destiny.rarity === 'hard') triggerImpactFrame();
             resetRevealScene();
        });

        // 5. 陨石砸入 (The Meteor Slam)
        // 关键修复：使用 xPercent/yPercent 强制忽略 CSS 中的任何 translate 偏移，确保中心对齐
        mainTl.set(cardRevealOverlay, { opacity: 1, pointerEvents: "auto" }, "+=0.04")
          .add(() => {
              cardRevealOverlay.classList.add('active', 'impacting');
              cardStage.classList.add('materializing');
              // 强制中心对齐偏移
              gsap.set(cardStage, { xPercent: -50, yPercent: -50 });
          })
          .fromTo(cardStage, 
              { 
                  y: 1200, 
                  scale: 0.1, 
                  rotateX: 70, 
                  opacity: 0,
                  filter: "blur(40px)"
              },
              { 
                  y: -80, 
                  scale: 1.25, 
                  rotateX: -18, 
                  opacity: 1,
                  filter: "blur(0px)",
                  duration: 0.52, 
                  ease: "power4.in" 
              }
          )
          // 落地瞬间的物理反弹和余震
          .addLabel("slam-moment")
          .add(() => {
              triggerShake(destiny.rarity === 'hard' ? 'heavy' : 'medium');
              summonFx.stop();
              clearSummonScene();
          }, "slam-moment")
          .to(cardStage, { 
              y: 0, 
              scale: 1, 
              rotateX: 0, 
              duration: 0.75, 
              ease: "elastic.out(1, 0.42)" 
          }, "slam-moment");

        // 6. 圣光消散与出场
        mainTl.to(whiteFlash, { opacity: 0, duration: 0.9 }, "slam-moment+=0.1")
          .set(cardStage, { className: "-=materializing +=presented" })
          .add(() => revealFx.start(destiny.rarity, cardStage.getBoundingClientRect()))
          .to(cardRevealOverlay, { className: "-=impacting", duration: 0.5 })
          
          // --- 核心翻牌动效: Pop & Reveal ---
          .addLabel("flip-start", "+=0.3")
          .to(theCard, { 
              onStart: () => theCard.classList.add('flipped'),
              onComplete: resetCardTilt,
              z: 130, 
              scale: 1.05, 
              duration: 0.85, 
              ease: "back.out(1.2)" 
          }, "flip-start")
          // 翻转到一半时触发扫光
          .to(cardGlare, { 
              x: "100%", 
              duration: 1.2, 
              ease: "power2.inOut" 
          }, "flip-start+=0.1")
          // 落地回跳
          .to(theCard, { 
              z: 0, 
              scale: 1, 
              duration: 0.5, 
              ease: "elastic.out(1, 0.6)" 
          }, "-=0.2")

          // --- 按钮稳固显示 ---
          .add(() => retryBtn.classList.add('active'), "+=0.1")
          .to(retryBtn, { 
              autoAlpha: 1, 
              y: 0, 
              duration: 0.5, 
              ease: "power2.out" 
          }, "-=0.2");

        await mainTl;

    } catch (error) {
        console.error('终极出卡失败:', error);
        revealFx.stop();
        summonFx.stop();
        clearSummonScene();
        gsap.set([mainScreen, cardRevealOverlay, cardStage, theCard, retryBtn], { clearProps: "all" });
        mainScreen.classList.remove('fade-out');
    } finally {
        isSummoning = false;
    }
}

summonBtn.addEventListener('click', triggerSummon);
retryBtn.addEventListener('click', triggerSummon);

loadTasks();
