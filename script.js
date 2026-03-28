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
        bg: 'img/azure_breeze_bg.png',
        fallbackTask: '去喷泉边散散步',
        fx: ['93, 214, 255', '174, 239, 255', '237, 251, 255']
    },
    normal: {
        label: '小镇惊喜',
        stars: '★ ★ ★',
        bg: 'img/purple_magic_bg.png',
        fallbackTask: '收下一份今天的惊喜',
        fx: ['211, 103, 160', '229, 133, 181', '246, 190, 219']
    },
    hard: {
        label: '传奇挑战',
        stars: '★ ★ ★ ★',
        bg: 'img/amber_sunset_bg.png',
        fallbackTask: '挑战一次传奇任务',
        fx: ['255, 194, 46', '255, 231, 138', '255, 248, 216']
    }
};

const TIMING = {
    lock: 1600,
    charge: 1900,
    compress: 1050,
    tear: 260,
    flash: 180,
    bridgeLead: 180,
    revealSettle: 760,
    impactHold: 560,
    flip: 1180,
    retry: 900
};

let isSummoning = false;
let taskData = { easy: [], normal: [], hard: [] };

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

    summonOverlay.dataset.rarity = destiny.rarity;
    cardRevealOverlay.dataset.rarity = destiny.rarity;

    theCard.classList.remove('theme-easy', 'theme-normal', 'theme-hard');
    theCard.classList.add(`theme-${destiny.rarity}`);

    rarityText.textContent = theme.label;
    taskDesc.textContent = destiny.task;
    starsRow.textContent = theme.stars;
    cardBgImage.style.backgroundImage = `url('${destiny.bg}')`;
}

function resetCardTilt() {
    theCard.style.transform = '';
    cardGlare.style.transform = '';
}

function clearSummonScene() {
    summonOverlay.classList.remove('active', 'phase-charge', 'phase-compress', 'phase-tear');
    summonOverlay.style.removeProperty('--rift-open');
    summonOverlay.style.removeProperty('--rift-glow');
    summonOverlay.style.removeProperty('--shell-shift');
    summonOverlay.style.removeProperty('--shell-tilt');
}

function resetRevealScene() {
    retryBtn.classList.remove('active');
    revealFx.stop();
    cardRevealOverlay.classList.remove('impacting');
    cardStage.classList.remove('materializing', 'presented');
    theCard.classList.remove('flipped');
    resetCardTilt();
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
        summonOverlay.style.removeProperty('--rift-open');
        summonOverlay.style.removeProperty('--rift-glow');
        summonOverlay.style.removeProperty('--shell-shift');
        summonOverlay.style.removeProperty('--shell-tilt');
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
            for (let i = 0; i < 180; i += 1) this.spawnBurstStreak();
            this.spawnWave(54, 0.75, 5.2);
            this.spawnWave(84, 0.56, 4.3);
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

        let riftOpen = 0.08;
        let riftGlow = 0.34;
        let shellShift = 18;
        let shellTilt = 0;

        if (this.phase === 'charge') {
            riftOpen = 0.18 + Math.sin(this.phaseTime * 0.06) * 0.02;
            riftGlow = 0.76;
            shellShift = Math.sin(this.phaseTime * 0.14) * 6;
            shellTilt = `${Math.sin(this.phaseTime * 0.1) * 1.4}deg`;
        } else if (this.phase === 'compress') {
            riftOpen = 0.034 + Math.sin(this.phaseTime * 0.4) * 0.006;
            riftGlow = 1.18;
            shellShift = Math.sin(this.phaseTime * 0.9) * 10;
            shellTilt = `${Math.sin(this.phaseTime * 0.75) * 2.6}deg`;
        } else if (this.phase === 'tear') {
            riftOpen = 0.88;
            riftGlow = 1.42;
            shellShift = -52;
            shellTilt = '0deg';
        }

        summonOverlay.style.setProperty('--rift-open', riftOpen.toFixed(3));
        summonOverlay.style.setProperty('--rift-glow', riftGlow.toFixed(3));
        summonOverlay.style.setProperty('--shell-shift', `${shellShift.toFixed(1)}px`);
        summonOverlay.style.setProperty('--shell-tilt', shellTilt);

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
            this.ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
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
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, centerY, wave.radius, wave.radius * 0.58, 0, 0, Math.PI * 2);
            this.ctx.stroke();

            return wave.alpha > 0.02;
        });

        if (this.phase === 'compress') {
            this.ctx.strokeStyle = `rgba(${this.palette[2]},0.58)`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 30, 0);
            this.ctx.lineTo(centerX - 30, this.height);
            this.ctx.moveTo(centerX + 30, 0);
            this.ctx.lineTo(centerX + 30, this.height);
            this.ctx.stroke();
        }

        if (this.phase === 'tear') {
            this.ctx.fillStyle = `rgba(${this.palette[2]},0.82)`;
            this.ctx.fillRect(centerX - 3, 0, 6, this.height);
        }

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
            this.ctx.beginPath();
            this.ctx.ellipse(this.anchor.x, this.anchor.y, ring.radius, ring.radius * 0.74, 0, 0, Math.PI * 2);
            this.ctx.stroke();

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

    theCard.style.transform = `rotateX(${-dy * 18}deg) rotateY(${dx * 18}deg)`;
    cardGlare.style.transform = `translate(${dx * 22}px, ${dy * 22}px) rotate(${dx * 6}deg)`;
});

cardRevealOverlay.addEventListener('pointerleave', resetCardTilt);
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
        } else {
            mainScreen.classList.add('fade-out');
        }

        clearSummonScene();
        summonOverlay.classList.add('active');
        whiteFlash.style.transition = 'none';
        whiteFlash.style.opacity = '0';
        summonFx.start(destiny.rarity);

        await sleep(TIMING.lock);

        summonOverlay.classList.add('phase-charge');
        summonFx.setPhase('charge');
        summonFx.setIntensity(1.52);

        await sleep(TIMING.charge);

        summonOverlay.classList.add('phase-compress');
        summonFx.setPhase('compress');
        summonFx.setIntensity(2.2);

        await sleep(TIMING.compress);

        summonOverlay.classList.add('phase-tear');
        summonFx.setPhase('tear');
        summonFx.setIntensity(3.2);

        await sleep(TIMING.tear);

        whiteFlash.style.transition = 'none';
        whiteFlash.style.opacity = '1';

        resetRevealScene();

        await sleep(TIMING.flash);

        cardRevealOverlay.classList.add('active', 'impacting');
        cardStage.classList.add('materializing');

        await sleep(TIMING.bridgeLead);

        summonFx.stop();
        clearSummonScene();

        whiteFlash.style.transition = 'opacity 0.95s ease';
        whiteFlash.style.opacity = '0';

        await sleep(TIMING.revealSettle);

        cardStage.classList.remove('materializing');
        cardStage.classList.add('presented');
        revealFx.start(destiny.rarity, cardStage.getBoundingClientRect());

        await sleep(TIMING.impactHold);
        cardRevealOverlay.classList.remove('impacting');

        await sleep(TIMING.flip);

        theCard.classList.add('flipped');

        await sleep(TIMING.retry);
        retryBtn.classList.add('active');
    } catch (error) {
        console.error('出卡流程失败:', error);
        revealFx.stop();
        summonFx.stop();
        clearSummonScene();
        cardRevealOverlay.classList.remove('active', 'impacting');
        resetRevealScene();
        mainScreen.classList.remove('fade-out');
    } finally {
        isSummoning = false;
    }
}

summonBtn.addEventListener('click', triggerSummon);
retryBtn.addEventListener('click', triggerSummon);

loadTasks();
