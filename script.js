const mainScreen = document.getElementById('main-screen');
const summonBtn = document.getElementById('summon-btn');
const summonOverlay = document.getElementById('summon-overlay');
const summonFxCanvas = document.getElementById('summon-fx-canvas');
const whiteFlash = document.getElementById('white-flash');

const cardRevealOverlay = document.getElementById('card-reveal-overlay');
const cardStage = document.getElementById('card-stage');
const theCard = document.getElementById('the-card');
const cardInnerWrap = theCard.querySelector('.card-inner-wrap');
const faceBack = document.querySelector('.face-back');
const faceFront = document.querySelector('.face-front');
const cardBgImage = document.getElementById('card-bg-image');
const cardFarLayer = document.getElementById('card-far-layer');
const cardMidLayer = document.getElementById('card-mid-layer');
const cardFrontLayer = document.getElementById('card-front-layer');
const cardGlare = document.getElementById('card-glare');
const taskContentWrap = document.querySelector('.task-content-wrap');

const rarityText = document.getElementById('rarity-text');
const taskDesc = document.getElementById('task-desc');
const starsRow = document.getElementById('stars-row');
const retryBtn = document.getElementById('retry-btn');

const mainBgCanvas = document.getElementById('main-bg-canvas');
const confettiCanvas = document.getElementById('confetti-canvas');
const homeHeroBg = document.getElementById('home-hero-bg');
const homeHeroFar = document.getElementById('home-hero-far');
const homeHeroMid = document.getElementById('home-hero-mid');
const homeHeroChar = document.getElementById('home-hero-char');
const homeHeroFront = document.getElementById('home-hero-front');
const cardCharPop = document.getElementById('card-char-pop');
const cardHolographicFoil = document.getElementById('card-holographic-foil');

const TASK_FILE_CANDIDATES = ['task.md', 'tasks.md'];
const TASK_LAYER_KEYS = ['bg', 'far', 'mid', 'char', 'front'];
const TASK_LAYER_ALIASES = {
    bg: 'bg',
    background: 'bg',
    back: 'bg',
    far: 'far',
    mid: 'mid',
    middle: 'mid',
    char: 'char',
    character: 'char',
    front: 'front',
    foreground: 'front'
};

const PLACEHOLDER_LAYER_ART = {
    far: [
        'radial-gradient(circle at 20% 24%, rgba(var(--accent-cold), 0.9) 0 7%, transparent 18%)',
        'radial-gradient(circle at 78% 18%, rgba(255, 255, 255, 0.72) 0 7%, transparent 18%)',
        'radial-gradient(circle at 48% 30%, rgba(var(--accent-soft), 0.48) 0 12%, transparent 24%)',
        'linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(var(--accent-cold), 0.1) 26%, transparent 72%)'
    ].join(', '),
    mid: [
        'linear-gradient(118deg, transparent 0 28%, rgba(var(--accent-main), 0.18) 40%, transparent 56%)',
        'linear-gradient(-118deg, transparent 0 36%, rgba(var(--accent-soft), 0.2) 48%, transparent 62%)',
        'radial-gradient(circle at 50% 70%, rgba(var(--accent-main), 0.22) 0 14%, transparent 32%)',
        'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(var(--accent-cold), 0.12) 100%)'
    ].join(', '),
    front: [
        'radial-gradient(circle at 14% 88%, rgba(var(--accent-main), 0.34) 0 6%, transparent 13%)',
        'radial-gradient(circle at 30% 84%, rgba(var(--accent-soft), 0.28) 0 5%, transparent 11%)',
        'radial-gradient(circle at 78% 86%, rgba(var(--accent-main), 0.32) 0 6%, transparent 13%)',
        'radial-gradient(circle at 66% 90%, rgba(var(--accent-cold), 0.68) 0 5%, transparent 10%)',
        'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.16) 100%)'
    ].join(', ')
};

const RARITY_THEME = {
    easy: {
        label: '简单',
        stars: '★ ★',
        card: 'img/card_back.webp',
        bg: 'img/bg_easy.jpg',
        char: 'img/char_1.webp',
        fallbackTask: '去喷泉边散散步',
        fx: ['112, 196, 255', '168, 221, 255', '224, 244, 255']
    },
    normal: {
        label: '普通',
        stars: '★ ★ ★',
        card: 'img/card_back.webp',
        bg: 'img/bg_normal.jpg',
        char: 'img/char_2.webp',
        fallbackTask: '收下一份今天的惊喜',
        fx: ['180, 100, 255', '210, 160, 255', '240, 230, 255']
    },
    hard: {
        label: '困难',
        stars: '★ ★ ★ ★',
        card: 'img/card_back.webp',
        bg: 'img/bg_hard.jpg',
        char: 'img/char_3.webp',
        fallbackTask: '挑战一次困难任务',
        fx: ['255, 194, 46', '255, 231, 138', '255, 248, 216']
    },
    epic: {
        label: '极难',
        stars: '★ ★ ★ ★ ★',
        card: 'img/card_back.webp',
        bg: 'img/bg_hard.jpg',
        char: 'img/char_6.webp',
        fallbackTask: '完成一次不可思议的史诗任务',
        fx: ['255, 60, 100', '255, 140, 160', '255, 200, 210']
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

const FIXED_FX_RARITY = 'hard';

let isSummoning = false;
let taskData = { easy: [], normal: [], hard: [], epic: [] };
let RARITY_WEIGHTS = { easy: 45, normal: 35, hard: 15, epic: 5 };
let activeTiltPointerId = null;
let activeTouchId = null;
let gyroTiltEnabled = false;
let gyroPermissionRequested = false;
let gyroPermissionState = 'unknown';
let gyroListening = false;
let gyroBaseline = null;
let gyroFiltered = { dx: 0, dy: 0 };

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const randomChoice = items => items[Math.floor(Math.random() * items.length)];
const randomRange = (min, max) => Math.random() * (max - min) + min;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;

function buildPerformanceProfile() {
    if (typeof window === 'undefined') {
        return {
            isMobileViewport: false,
            reducedMotion: false,
            lowMemory: false,
            lowCpu: false,
            coarsePointer: false,
            liteFx: false,
            fxDensity: 1,
            backgroundFps: 45,
            summonFps: 60,
            revealFps: 60
        };
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const isMobileViewport = window.innerWidth <= 768;
    const lowMemory = typeof navigator !== 'undefined' && Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4;
    const lowCpu = typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4;
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? ((navigator?.maxTouchPoints ?? 0) > 0);
    const liteFx = Boolean(reducedMotion || lowMemory || lowCpu);
    const fxDensity = reducedMotion ? 0.28 : liteFx ? (isMobileViewport ? 0.66 : 0.58) : isMobileViewport ? 0.9 : 1;

    return {
        isMobileViewport,
        reducedMotion,
        lowMemory,
        lowCpu,
        coarsePointer,
        liteFx,
        fxDensity,
        backgroundFps: reducedMotion ? 18 : liteFx ? (isMobileViewport ? 32 : 28) : isMobileViewport ? 40 : 45,
        summonFps: reducedMotion ? 20 : liteFx ? 42 : isMobileViewport ? 54 : 60,
        revealFps: reducedMotion ? 20 : liteFx ? 42 : isMobileViewport ? 54 : 60
    };
}

const PERFORMANCE_PROFILE = buildPerformanceProfile();

function syncPerformanceProfile() {
    const nextProfile = buildPerformanceProfile();
    Object.assign(PERFORMANCE_PROFILE, nextProfile);

    if (document?.body) {
        document.body.classList.toggle('game-engine-mode', true);
        document.body.classList.toggle('fx-lite', PERFORMANCE_PROFILE.liteFx);
        document.body.classList.toggle('fx-mobile', PERFORMANCE_PROFILE.isMobileViewport);
    }
}

function scaleCount(base, minimum = 1) {
    return Math.max(minimum, Math.round(base * PERFORMANCE_PROFILE.fxDensity));
}

function shouldUseLiteFx() {
    return PERFORMANCE_PROFILE.liteFx;
}

let lastTiltDebugAt = 0;
let pendingTiltPoint = null;
let tiltRafId = 0;
let tiltBoundsCache = null;
let tiltBoundsCacheAt = 0;

if (typeof window !== 'undefined' && typeof window.__CARD_TILT_DEBUG__ === 'undefined') {
    window.__CARD_TILT_DEBUG__ = false;
}

function isTiltDebugEnabled() {
    return typeof window !== 'undefined' && window.__CARD_TILT_DEBUG__ !== false;
}

function roundTiltDebugValue(value) {
    return Number.isFinite(value) ? Number(value.toFixed(2)) : value;
}

function getTiltDebugSnapshot() {
    const rect = cardStage.getBoundingClientRect();

    return {
        overlayActive: cardRevealOverlay.classList.contains('active'),
        overlayClasses: cardRevealOverlay.className,
        stageClasses: cardStage.className,
        cardClasses: theCard.className,
        stageRect: {
            left: roundTiltDebugValue(rect.left),
            top: roundTiltDebugValue(rect.top),
            width: roundTiltDebugValue(rect.width),
            height: roundTiltDebugValue(rect.height)
        },
        cardRotationX: roundTiltDebugValue(gsap.getProperty(theCard, 'rotationX')),
        cardRotationY: roundTiltDebugValue(gsap.getProperty(theCard, 'rotationY')),
        cardZ: roundTiltDebugValue(gsap.getProperty(theCard, 'z')),
        cardScale: roundTiltDebugValue(gsap.getProperty(theCard, 'scale')),
        cardTransform: theCard.style.transform || '(empty)'
    };
}

function logTiltDebug(label, payload = {}, options = {}) {
    if (!isTiltDebugEnabled()) return;

    const now = performance.now();
    if (!options.force && now - lastTiltDebugAt < 120) return;

    lastTiltDebugAt = now;
    console.log(`[card-tilt] ${label}`, {
        ...getTiltDebugSnapshot(),
        ...payload
    });
}

function setCanvasSize(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createEmptyTaskLayers() {
    return {
        bg: '',
        far: '',
        mid: '',
        char: '',
        front: ''
    };
}

function normalizeTaskLayerValue(rawValue) {
    const value = rawValue?.trim() ?? '';
    if (!value) return '';
    if (/^(none|off|false|0)$/i.test(value)) return null;
    return value;
}

function parseTaskConfig(parts) {
    const layers = createEmptyTaskLayers();
    const extras = parts.slice(1);
    let legacyIndex = 0;

    extras.forEach(part => {
        if (!part) return;

        const separatorIndex = part.indexOf(':');
        if (separatorIndex > 0) {
            const rawKey = part.slice(0, separatorIndex).trim().toLowerCase();
            const key = TASK_LAYER_ALIASES[rawKey];
            if (!key) return;
            layers[key] = normalizeTaskLayerValue(part.slice(separatorIndex + 1));
            return;
        }

        if (legacyIndex === 0) {
            layers.bg = normalizeTaskLayerValue(part);
        } else if (legacyIndex === 1) {
            layers.char = normalizeTaskLayerValue(part);
        }
        legacyIndex += 1;
    });

    return layers;
}

async function fetchTaskText() {
    for (const filename of TASK_FILE_CANDIDATES) {
        try {
            const response = await fetch(filename);
            if (!response.ok) continue;
            return await response.text();
        } catch (error) {
            console.warn(`Task file read skipped: ${filename}`, error);
        }
    }

    throw new Error(`Unable to load task data from ${TASK_FILE_CANDIDATES.join(', ')}`);
}

function setCardLayerAsset(element, layerName, imageValue, fallbackImage = '') {
    if (!element) return;

    const isDisabled = imageValue === null;
    const finalImage = isDisabled ? '' : imageValue || fallbackImage || '';
    const hasImage = Boolean(finalImage);
    const nextState = isDisabled ? 'disabled' : hasImage ? 'image' : 'placeholder';

    element.dataset.layer = layerName;
    element.dataset.layerState = nextState;
    element.style.backgroundImage = hasImage
        ? `url("${finalImage}")`
        : PLACEHOLDER_LAYER_ART[layerName] || 'none';
}

async function loadTasks() {
    try {
        const text = await fetchTaskText();
        const parsed = { easy: [], normal: [], hard: [], epic: [] };
        let currentCategory = '';

        text.split('\n').forEach(line => {
            const trimmed = line.trim();
            const lower = trimmed.toLowerCase();

            let match;
            if ((match = lower.match(/^##\s*(easy|简单)\s*(?:\[(\d+)\])?/))) {
                currentCategory = 'easy';
                if (match[2]) RARITY_WEIGHTS.easy = parseInt(match[2], 10);
            } else if ((match = lower.match(/^##\s*(normal|普通)\s*(?:\[(\d+)\])?/))) {
                currentCategory = 'normal';
                if (match[2]) RARITY_WEIGHTS.normal = parseInt(match[2], 10);
            } else if ((match = lower.match(/^##\s*(hard|困难)\s*(?:\[(\d+)\])?/))) {
                currentCategory = 'hard';
                if (match[2]) RARITY_WEIGHTS.hard = parseInt(match[2], 10);
            } else if ((match = lower.match(/^##\s*(epic|极难)\s*(?:\[(\d+)\])?/))) {
                currentCategory = 'epic';
                if (match[2]) RARITY_WEIGHTS.epic = parseInt(match[2], 10);
            } else if (trimmed.startsWith('- ') && currentCategory) {
                const parts = trimmed.slice(2).split('|').map(s => s.trim());
                parsed[currentCategory].push({
                    text: parts[0],
                    layers: parseTaskConfig(parts)
                });
            }
        });

        taskData = parsed;
    } catch (error) {
        console.error('任务读取失败:', error);
    }
}

function drawDestiny() {
    let totalWeight = RARITY_WEIGHTS.easy + RARITY_WEIGHTS.normal + RARITY_WEIGHTS.hard + RARITY_WEIGHTS.epic;
    let roll = Math.random() * totalWeight;
    
    let rarity = 'easy';
    if (roll < RARITY_WEIGHTS.epic) rarity = 'epic';
    else if (roll < RARITY_WEIGHTS.epic + RARITY_WEIGHTS.hard) rarity = 'hard';
    else if (roll < RARITY_WEIGHTS.epic + RARITY_WEIGHTS.hard + RARITY_WEIGHTS.normal) rarity = 'normal';
    
    const theme = RARITY_THEME[rarity];
    const pool = taskData[rarity];

    return {
        rarity,
        task: pool.length ? randomChoice(pool) : { text: theme.fallbackTask, layers: createEmptyTaskLayers() },
        bg: theme.bg
    };
}

function getFxRarity() {
    return 'hard'; // Mock deprecated
}

function applyDestinySkin(destiny, initialFxRarity) {
    const theme = RARITY_THEME[destiny.rarity];
    const fxRarity = initialFxRarity || destiny.rarity;

    summonOverlay.dataset.rarity = fxRarity;
    cardRevealOverlay.dataset.rarity = fxRarity; // Start with initial, then upgrade if fakeout

    theCard.classList.remove('theme-easy', 'theme-normal', 'theme-hard', 'theme-epic');
    theCard.classList.add(`theme-${destiny.rarity}`);

    rarityText.textContent = theme.label;
    taskDesc.textContent = destiny.task.text;
    starsRow.textContent = theme.stars;

    const taskLayers = destiny.task.layers || createEmptyTaskLayers();
    cardBgImage.style.backgroundColor = 'rgba(255, 248, 238, 0.92)';
    setCardLayerAsset(cardBgImage, 'bg', taskLayers.bg, theme.bg);
    setCardLayerAsset(cardFarLayer, 'far', taskLayers.far);
    setCardLayerAsset(cardMidLayer, 'mid', taskLayers.mid);
    setCardLayerAsset(cardCharPop, 'char', taskLayers.char, theme.char);
    setCardLayerAsset(cardFrontLayer, 'front', taskLayers.front);

    // Reset foil position
    if (cardHolographicFoil) {
        cardHolographicFoil.style.backgroundPosition = '0% 0%';
    }
}

class InteractionEngine {
    constructor() {
        this.card = {
            current: {
                rotationX: 0, rotationY: 0, z: 0, scale: 1,
                bgX: 0, bgY: 0, bgScale: 1.04,
                farX: 0, farY: 0, farZ: 28, farScale: 1.04,
                midX: 0, midY: 0, midZ: 68, midScale: 1.05,
                glareX: 0, glareY: 0, glareRotate: 0,
                foilPosX: 50, foilPosY: 50, foilX: 0, foilY: 0,
                charX: 0, charY: 8, charZ: 112, charRotateX: 0, charRotateY: 0, charRotateZ: 0, charScale: 1.08,
                frontX: 0, frontY: 0, frontZ: 164, frontRotateX: 0, frontRotateY: 0, frontScale: 1.08
            },
            target: {
                rotationX: 0, rotationY: 0, z: 0, scale: 1,
                bgX: 0, bgY: 0, bgScale: 1.04,
                farX: 0, farY: 0, farZ: 28, farScale: 1.04,
                midX: 0, midY: 0, midZ: 68, midScale: 1.05,
                glareX: 0, glareY: 0, glareRotate: 0,
                foilPosX: 50, foilPosY: 50, foilX: 0, foilY: 0,
                charX: 0, charY: 8, charZ: 112, charRotateX: 0, charRotateY: 0, charRotateZ: 0, charScale: 1.08,
                frontX: 0, frontY: 0, frontZ: 164, frontRotateX: 0, frontRotateY: 0, frontScale: 1.08
            }
        };
        this.home = {
            current: {
                bgX: 0, bgY: 0, bgRotationY: 0, bgRotationX: 0,
                farX: 0, farY: 0, farRotationY: 0, farRotationX: 0,
                midX: 0, midY: 0, midRotationY: 0, midRotationX: 0,
                charX: 0, charY: 0, charRotationY: 0, charRotationX: 0,
                frontX: 0, frontY: 0, frontRotationY: 0, frontRotationX: 0
            },
            target: {
                bgX: 0, bgY: 0, bgRotationY: 0, bgRotationX: 0,
                farX: 0, farY: 0, farRotationY: 0, farRotationX: 0,
                midX: 0, midY: 0, midRotationY: 0, midRotationX: 0,
                charX: 0, charY: 0, charRotationY: 0, charRotationX: 0,
                frontX: 0, frontY: 0, frontRotationY: 0, frontRotationX: 0
            }
        };
        this.rafId = 0;
        this.cardDirty = true;
        this.homeDirty = true;
        this.tick = this.tick.bind(this);
        this.ensureRunning();
    }

    ensureRunning() {
        if (this.rafId) return;
        this.rafId = requestAnimationFrame(this.tick);
    }

    updateState(current, target, damping) {
        let moving = false;
        Object.keys(target).forEach(key => {
            const nextValue = lerp(current[key], target[key], damping);
            if (Math.abs(target[key] - nextValue) > 0.001) moving = true;
            current[key] = Math.abs(target[key] - nextValue) < 0.001 ? target[key] : nextValue;
        });
        return moving;
    }

    setCardTarget(dx, dy) {
        const safeDx = clamp(dx, -1, 1);
        const safeDy = clamp(dy, -1, 1);
        Object.assign(this.card.target, {
            rotationX: -safeDy * 15,
            rotationY: safeDx * 15,
            z: 20,
            scale: 1.01,
            bgX: -safeDx * 25,
            bgY: -safeDy * 15,
            bgScale: 1.08,
            farX: -safeDx * 12,
            farY: -safeDy * 8,
            farZ: 34,
            farScale: 1.06,
            midX: safeDx * 10,
            midY: safeDy * 6,
            midZ: 74,
            midScale: 1.07,
            glareX: safeDx * 26,
            glareY: safeDy * 26,
            glareRotate: safeDx * 5,
            foilPosX: 50 + safeDx * 25,
            foilPosY: 50 + safeDy * 25,
            foilX: safeDx * 4,
            foilY: safeDy * 3,
            charX: safeDx * 28,
            charY: 8 + safeDy * 12,
            charZ: 126,
            charRotateX: -safeDy * 3.5,
            charRotateY: safeDx * 5,
            charRotateZ: safeDx * 1.2,
            charScale: 1.08 + Math.abs(safeDx) * 0.015,
            frontX: safeDx * 38,
            frontY: safeDy * 16,
            frontZ: 176,
            frontRotateX: -safeDy * 6,
            frontRotateY: safeDx * 8,
            frontScale: 1.12 + Math.abs(safeDx) * 0.02
        });
        this.cardDirty = true;
        this.ensureRunning();
    }

    resetCard() {
        Object.assign(this.card.target, {
            rotationX: 0,
            rotationY: 0,
            z: 0,
            scale: 1,
            bgX: 0,
            bgY: 0,
            bgScale: 1.04,
            farX: 0,
            farY: 0,
            farZ: 28,
            farScale: 1.04,
            midX: 0,
            midY: 0,
            midZ: 68,
            midScale: 1.05,
            glareX: 0,
            glareY: 0,
            glareRotate: 0,
            foilPosX: 50,
            foilPosY: 50,
            foilX: 0,
            foilY: 0,
            charX: 0,
            charY: 8,
            charZ: 112,
            charRotateX: 0,
            charRotateY: 0,
            charRotateZ: 0,
            charScale: 1.08,
            frontX: 0,
            frontY: 0,
            frontZ: 164,
            frontRotateX: 0,
            frontRotateY: 0,
            frontScale: 1.08
        });
        this.cardDirty = true;
        this.ensureRunning();
    }

    setHomeTarget(dx, dy) {
        const safeDx = clamp(dx, -1, 1);
        const safeDy = clamp(dy, -1, 1);
        Object.assign(this.home.target, {
            bgX: safeDx * -20,
            bgY: safeDy * -10,
            bgRotationY: safeDx * -2,
            bgRotationX: safeDy * 1,
            farX: safeDx * -12,
            farY: safeDy * -6,
            farRotationY: safeDx * -1.4,
            farRotationX: safeDy * 0.6,
            midX: safeDx * 18,
            midY: safeDy * 9,
            midRotationY: safeDx * 2.2,
            midRotationX: -safeDy * 1,
            charX: safeDx * 30,
            charY: safeDy * 15,
            charRotationY: safeDx * 5,
            charRotationX: -safeDy * 2,
            frontX: safeDx * 42,
            frontY: safeDy * 18,
            frontRotationY: safeDx * 6.5,
            frontRotationX: -safeDy * 2.6
        });
        this.homeDirty = true;
        this.ensureRunning();
    }

    resetHome() {
        Object.assign(this.home.target, {
            bgX: 0,
            bgY: 0,
            bgRotationY: 0,
            bgRotationX: 0,
            farX: 0,
            farY: 0,
            farRotationY: 0,
            farRotationX: 0,
            midX: 0,
            midY: 0,
            midRotationY: 0,
            midRotationX: 0,
            charX: 0,
            charY: 0,
            charRotationY: 0,
            charRotationX: 0,
            frontX: 0,
            frontY: 0,
            frontRotationY: 0,
            frontRotationX: 0
        });
        this.homeDirty = true;
        this.ensureRunning();
    }

    renderCard() {
        const state = this.card.current;
        gsap.set(theCard, {
            rotationX: state.rotationX,
            rotationY: state.rotationY,
            z: state.z,
            scale: state.scale,
            transformPerspective: 1200
        });
        gsap.set(cardBgImage, {
            x: state.bgX,
            y: state.bgY,
            z: 0,
            scale: state.bgScale
        });
        if (cardFarLayer) {
            gsap.set(cardFarLayer, {
                xPercent: -50,
                x: state.farX,
                y: state.farY,
                z: state.farZ,
                scale: state.farScale
            });
        }
        if (cardMidLayer) {
            gsap.set(cardMidLayer, {
                xPercent: -50,
                x: state.midX,
                y: state.midY,
                z: state.midZ,
                scale: state.midScale
            });
        }
        gsap.set(cardGlare, {
            x: state.glareX,
            y: state.glareY,
            rotate: state.glareRotate
        });
        if (cardHolographicFoil) {
            gsap.set(cardHolographicFoil, {
                backgroundPosition: `${state.foilPosX}% ${state.foilPosY}%`,
                x: state.foilX,
                y: state.foilY
            });
        }
        if (cardCharPop) {
            gsap.set(cardCharPop, {
                xPercent: -50,
                x: state.charX,
                y: state.charY,
                z: state.charZ,
                rotationX: state.charRotateX,
                rotationY: state.charRotateY,
                rotationZ: state.charRotateZ,
                scale: state.charScale
            });
        }
        if (cardFrontLayer) {
            gsap.set(cardFrontLayer, {
                xPercent: -50,
                x: state.frontX,
                y: state.frontY,
                z: state.frontZ,
                rotationX: state.frontRotateX,
                rotationY: state.frontRotateY,
                scale: state.frontScale
            });
        }
        if (taskContentWrap) {
            gsap.set(taskContentWrap, {
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0
            });
        }
    }

    renderHome() {
        const state = this.home.current;
        if (homeHeroFar) {
            gsap.set(homeHeroFar, {
                x: state.farX,
                y: state.farY,
                rotationY: state.farRotationY,
                rotationX: state.farRotationX
            });
        }
        if (homeHeroMid) {
            gsap.set(homeHeroMid, {
                x: state.midX,
                y: state.midY,
                rotationY: state.midRotationY,
                rotationX: state.midRotationX
            });
        }
        if (homeHeroChar) {
            gsap.set(homeHeroChar, {
                xPercent: -50,
                x: state.charX,
                y: state.charY,
                rotationY: state.charRotationY,
                rotationX: state.charRotationX
            });
        }
        if (homeHeroBg) {
            gsap.set(homeHeroBg, {
                x: state.bgX,
                y: state.bgY,
                rotationY: state.bgRotationY,
                rotationX: state.bgRotationX
            });
        }
        if (homeHeroFront) {
            gsap.set(homeHeroFront, {
                x: state.frontX,
                y: state.frontY,
                rotationY: state.frontRotationY,
                rotationX: state.frontRotationX
            });
        }
    }

    tick() {
        this.rafId = 0;
        const cardMoving = this.updateState(this.card.current, this.card.target, PERFORMANCE_PROFILE.liteFx ? 0.2 : 0.16);
        const homeMoving = this.updateState(this.home.current, this.home.target, PERFORMANCE_PROFILE.liteFx ? 0.16 : 0.12);
        const shouldRenderCard = this.cardDirty || cardMoving;
        const shouldRenderHome = this.homeDirty || homeMoving;

        if (shouldRenderCard) {
            this.renderCard();
            this.cardDirty = false;
        }
        if (shouldRenderHome) {
            this.renderHome();
            this.homeDirty = false;
        }

        if (cardMoving || homeMoving) {
            this.ensureRunning();
        }
    }
}

const interactionEngine = new InteractionEngine();

function resetCardTilt() {
    resetGyroBaseline();
    pendingTiltPoint = null;
    if (tiltRafId) {
        cancelAnimationFrame(tiltRafId);
        tiltRafId = 0;
    }
    logTiltDebug('reset/request', { activeTiltPointerId }, { force: true });
    interactionEngine.resetCard();

    requestAnimationFrame(() => {
        logTiltDebug('reset/applied', {}, { force: true });
    });
}

function clearTiltBoundsCache() {
    tiltBoundsCache = null;
    tiltBoundsCacheAt = 0;
}

function canTiltCard() {
    return cardRevealOverlay.classList.contains('active') && cardStage.classList.contains('presented');
}

function resetGyroBaseline() {
    gyroBaseline = null;
    gyroFiltered = { dx: 0, dy: 0 };
}

function getOrientationAngle() {
    if (typeof window === 'undefined') return 0;
    if (window.screen?.orientation && Number.isFinite(window.screen.orientation.angle)) {
        return window.screen.orientation.angle;
    }
    if (typeof window.orientation === 'number') {
        return window.orientation;
    }
    return 0;
}

function applyCardTilt(dx, dy, source = 'pointer', payload = {}) {
    if (!canTiltCard()) {
        logTiltDebug('update/skipped-inactive', { source, ...payload });
        return;
    }

    const safeDx = clamp(dx, -1, 1);
    const safeDy = clamp(dy, -1, 1);
    const targetRotationX = -safeDy * 15;
    const targetRotationY = safeDx * 15;
    interactionEngine.setCardTarget(safeDx, safeDy);

    requestAnimationFrame(() => {
        logTiltDebug('update/applied', {
            source,
            dx: roundTiltDebugValue(safeDx),
            dy: roundTiltDebugValue(safeDy),
            targetRotationX: roundTiltDebugValue(targetRotationX),
            targetRotationY: roundTiltDebugValue(targetRotationY),
            ...payload
        });
    });
}

function getCardTiltBounds() {
    const now = performance.now();
    if (tiltBoundsCache && now - tiltBoundsCacheAt < 80) {
        return tiltBoundsCache;
    }

    const rect = cardStage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    tiltBoundsCache = {
        rect,
        centerX,
        centerY,
        halfWidth: Math.max(rect.width * 0.72, 180),
        halfHeight: Math.max(rect.height * 0.72, 240)
    };
    tiltBoundsCacheAt = now;
    return tiltBoundsCache;
}

function updateCardTilt(clientX, clientY) {
    const { rect, centerX, centerY, halfWidth, halfHeight } = getCardTiltBounds();
    const dx = clamp((clientX - centerX) / halfWidth, -1, 1);
    const dy = clamp((clientY - centerY) / halfHeight, -1, 1);

    if (!rect.width || !rect.height) {
        logTiltDebug('update/zero-bounds', { clientX, clientY }, { force: true });
    }

    applyCardTilt(dx, dy, 'pointer', {
        clientX: roundTiltDebugValue(clientX),
        clientY: roundTiltDebugValue(clientY),
        centerX: roundTiltDebugValue(centerX),
        centerY: roundTiltDebugValue(centerY),
        halfWidth: roundTiltDebugValue(halfWidth),
        halfHeight: roundTiltDebugValue(halfHeight)
    });
}

function canTiltHome() {
    return !cardRevealOverlay.classList.contains('active') && !summonOverlay.classList.contains('active');
}

function updateHomeTilt(clientX, clientY) {
    const halfWidth = window.innerWidth / 2;
    const halfHeight = window.innerHeight / 2;
    const dx = clamp((clientX - halfWidth) / halfWidth, -1, 1);
    const dy = clamp((clientY - halfHeight) / halfHeight, -1, 1);
    applyHomeTilt(dx, dy);
}

function applyHomeTilt(dx, dy) {
    if (!homeHeroChar || !homeHeroBg) return;
    interactionEngine.setHomeTarget(dx, dy);
}

function queueCardTiltUpdate(clientX, clientY) {
    pendingTiltPoint = { clientX, clientY };
    if (tiltRafId) return;

    tiltRafId = requestAnimationFrame(() => {
        tiltRafId = 0;
        if (!pendingTiltPoint) return;
        const { clientX: x, clientY: y } = pendingTiltPoint;
        pendingTiltPoint = null;
        
        if (canTiltCard()) {
            updateCardTilt(x, y);
        } else if (canTiltHome() && !isSummoning) {
            updateHomeTilt(x, y);
        }
    });
}

function handleGyroOrientation(event) {
    if (!gyroTiltEnabled || activeTiltPointerId !== null) return;
    if (!canTiltCard() && (!canTiltHome() || isSummoning)) return;
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;

    const angle = getOrientationAngle();
    const beta = event.beta;
    const gamma = event.gamma;

    if (!gyroBaseline) {
        gyroBaseline = { beta, gamma, angle };
        logTiltDebug('gyro/calibrated', {
            beta: roundTiltDebugValue(beta),
            gamma: roundTiltDebugValue(gamma),
            angle
        }, { force: true });
        return;
    }

    let deltaX = gamma - gyroBaseline.gamma;
    let deltaY = beta - gyroBaseline.beta;

    if (angle === 90) {
        deltaX = beta - gyroBaseline.beta;
        deltaY = -(gamma - gyroBaseline.gamma);
    } else if (angle === -90 || angle === 270) {
        deltaX = -(beta - gyroBaseline.beta);
        deltaY = gamma - gyroBaseline.gamma;
    } else if (Math.abs(angle) === 180) {
        deltaX = -(gamma - gyroBaseline.gamma);
        deltaY = -(beta - gyroBaseline.beta);
    }

    const targetDx = clamp(deltaX / 18, -1, 1);
    const targetDy = clamp(deltaY / 22, -1, 1);
    gyroFiltered.dx = lerp(gyroFiltered.dx, targetDx, 0.22);
    gyroFiltered.dy = lerp(gyroFiltered.dy, targetDy, 0.22);

    if (Math.abs(gyroFiltered.dx) < 0.02) gyroFiltered.dx = 0;
    if (Math.abs(gyroFiltered.dy) < 0.02) gyroFiltered.dy = 0;

    if (canTiltCard()) {
        applyCardTilt(gyroFiltered.dx, gyroFiltered.dy, 'gyro', {
            beta: roundTiltDebugValue(beta),
            gamma: roundTiltDebugValue(gamma),
            angle
        });
    } else {
        applyHomeTilt(gyroFiltered.dx, gyroFiltered.dy);
    }
}

function startGyroTiltListener() {
    if (gyroListening || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return false;
    window.addEventListener('deviceorientation', handleGyroOrientation, true);
    gyroListening = true;
    gyroTiltEnabled = true;
    logTiltDebug('gyro/listening', { permission: gyroPermissionState }, { force: true });
    return true;
}

async function ensureGyroTiltAccess() {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return false;
    if (gyroListening) {
        gyroTiltEnabled = true;
        return true;
    }

    const OrientationEvent = window.DeviceOrientationEvent;

    if (typeof OrientationEvent.requestPermission === 'function') {
        if (gyroPermissionRequested && gyroPermissionState !== 'granted') {
            return false;
        }

        gyroPermissionRequested = true;

        try {
            gyroPermissionState = await OrientationEvent.requestPermission();
        } catch (error) {
            gyroPermissionState = 'denied';
            console.warn('陀螺仪权限请求失败:', error);
            return false;
        }

        if (gyroPermissionState !== 'granted') {
            logTiltDebug('gyro/permission-denied', { permission: gyroPermissionState }, { force: true });
            return false;
        }
    } else {
        gyroPermissionState = 'granted';
    }

    return startGyroTiltListener();
}

function clearSummonScene() {
    summonOverlay.classList.remove('active', 'phase-charge', 'phase-compress', 'phase-tear', 'phase-bridge');
    summonOverlay.style.removeProperty('--gate-open');
    summonOverlay.style.removeProperty('--bridge-x');
    summonOverlay.style.removeProperty('--bridge-y');
}

function resetRevealScene() {
    retryBtn.classList.remove('active');
    revealFx.stop();
    cardRevealOverlay.classList.remove('impacting');
    cardStage.classList.remove('materializing', 'presented');
    theCard.classList.remove('is-flipped');
    resetCardTilt();
    gsap.set([cardRevealOverlay, cardStage, theCard], { clearProps: "all" });
    gsap.set(cardInnerWrap, { clearProps: "transform", rotationY: 0 });
    gsap.set(faceBack, { autoAlpha: 1 });
    gsap.set(faceFront, { autoAlpha: 1 });
    gsap.set(retryBtn, { autoAlpha: 0, y: 30 });
    gsap.set(theCard, { rotateX: 0, rotateY: 0, rotateZ: 0, z: 0, scale: 1 });
}

function triggerShake(intensity = 'medium') {
    const duration = intensity === 'heavy' ? 500 : intensity === 'light' ? 150 : 300;
    const cls = intensity === 'light' ? 'screen-shake-light' : 'screen-shake-heavy';
    document.body.classList.add(cls);
    setTimeout(() => {
        document.body.classList.remove(cls);
    }, duration);
}

function triggerImpactFrame(rarity = 'hard') {
    const theme = RARITY_THEME[rarity] || RARITY_THEME.hard;
    const color = theme.fx[0];
    const frame = document.createElement('div');
    frame.style.cssText = `
        position: fixed;
        inset: 0;
        background: radial-gradient(circle at 50% 50%, rgba(${color}, 0.85) 0%, rgba(${color}, 0.3) 50%, transparent 80%);
        mix-blend-mode: multiply;
        pointer-events: none;
        filter: blur(12px);
    `;
    document.body.appendChild(frame);
    
    gsap.fromTo(frame, 
        { scale: 0.3, opacity: 0 },
        { 
            scale: 2.2, 
            opacity: 1, 
            duration: 0.14, 
            ease: "power2.out", 
            onComplete: () => {
                gsap.to(frame, { 
                    opacity: 0, 
                    scale: 3,
                    duration: 0.35, 
                    ease: "power1.in",
                    onComplete: () => frame.remove() 
                });
            }
        }
    );
}

function isHighRarity(rarity) {
    return rarity === 'hard' || rarity === 'epic';
}

function queueScreenShakes(sequence) {
    sequence.forEach(({ intensity, delay = 0 }) => {
        if (delay > 0) {
            setTimeout(() => triggerShake(intensity), delay);
            return;
        }
        triggerShake(intensity);
    });
}

function triggerTearBurst(rarity) {
    triggerShake('heavy');
    if (!isHighRarity(rarity)) return;

    triggerImpactFrame(rarity);
    setTimeout(() => triggerImpactFrame(rarity), 80);

    if (rarity === 'epic') {
        setTimeout(() => triggerImpactFrame(rarity), 160);
        setTimeout(() => triggerShake('heavy'), 200);
    }
}

function prepareSummonScene(initialFxRarity, bridgeTargetX, bridgeTargetY) {
    clearSummonScene();
    interactionEngine.resetHome();
    gsap.set(summonOverlay, { scale: 1 });
    summonOverlay.classList.add('active');
    summonOverlay.style.setProperty('--bridge-x', `${bridgeTargetX}px`);
    summonOverlay.style.setProperty('--bridge-y', `${bridgeTargetY}px`);
    whiteFlash.style.opacity = '0';
    summonFx.start(initialFxRarity);
    summonFx.setBridgeTarget(bridgeTargetX, bridgeTargetY);
    gsap.set(theCard, { rotationX: 0, rotationY: 0, rotationZ: 0, z: 0, scale: 1 });
    gsap.set(cardInnerWrap, { rotationY: 0 });
}

function getSummonViewportMetrics() {
    const viewportHeight = typeof window === 'undefined' ? 900 : window.innerHeight;
    const isMobileViewport = PERFORMANCE_PROFILE.isMobileViewport;
    return {
        chargeGateOpen: isMobileViewport ? "49.2vw" : "49vw",
        chargeScale: isMobileViewport ? 1.12 : 1.18,
        compressGateOpen: isMobileViewport ? "49.6vw" : "49.5vw",
        compressScale: isMobileViewport ? 1.1 : 1.15,
        tearGateOpen: isMobileViewport ? "-42vw" : "-45vw",
        revealStartY: Math.max(Math.round(viewportHeight * (isMobileViewport ? 1.08 : 1.22)), 760),
        revealOvershootY: isMobileViewport ? -56 : -80,
        flipLiftZ: isMobileViewport ? 108 : 130,
        flipScale: isMobileViewport ? 1.035 : 1.05
    };
}

function addSummonPreparationPhase(timeline, context) {
    const { initialFxRarity, bridgeTargetX, bridgeTargetY } = context;
    return timeline.to(mainScreen, {
        opacity: 0,
        scale: 0.92,
        duration: 0.4,
        onStart: () => prepareSummonScene(initialFxRarity, bridgeTargetX, bridgeTargetY)
    });
}

function addSummonChargePhase(timeline) {
    const metrics = getSummonViewportMetrics();
    return timeline
        .add(() => {
            summonOverlay.classList.add('phase-charge');
            summonFx.setPhase('charge');
            summonFx.setIntensity(2.0);
            queueScreenShakes([
                { intensity: 'light' },
                { intensity: 'light', delay: 400 },
                { intensity: 'medium', delay: 800 },
                { intensity: 'heavy', delay: 1200 }
            ]);
        })
        .fromTo(
            summonOverlay,
            { scale: 1, "--gate-open": "50vw" },
            { "--gate-open": metrics.chargeGateOpen, scale: metrics.chargeScale, duration: 1.8, ease: "power2.in" }
        );
}

function addSummonCompressPhase(timeline) {
    const metrics = getSummonViewportMetrics();
    return timeline
        .add(() => {
            summonOverlay.classList.add('phase-compress');
            summonFx.setPhase('compress');
            summonFx.setIntensity(5.0);
        })
        .to(summonOverlay, {
            "--gate-open": metrics.compressGateOpen,
            scale: metrics.compressScale,
            duration: 0.15,
            ease: "power4.out"
        });
}

function addSummonTearPhase(timeline, context) {
    const { initialFxRarity } = context;
    const metrics = getSummonViewportMetrics();
    return timeline
        .add(() => {
            summonOverlay.classList.add('phase-tear');
            summonFx.setPhase('tear');
            summonFx.setIntensity(initialFxRarity === 'epic' ? 9.0 : initialFxRarity === 'hard' ? 7.0 : 5.0);
            triggerTearBurst(initialFxRarity);
        })
        .to(summonOverlay, {
            "--gate-open": metrics.tearGateOpen,
            scale: 1,
            duration: 0.55,
            ease: "expo.out"
        })
        .add(() => {
            summonOverlay.classList.add('phase-bridge');
            summonFx.setPhase('bridge');
        }, "-=0.08")
        .to(whiteFlash, { opacity: 1, duration: 0.08 })
        .add(() => {
            if (initialFxRarity === 'hard') triggerImpactFrame('hard');
            resetRevealScene();
        });
}

function addRevealArrivalPhase(timeline, context) {
    const { finalRarity } = context;
    const metrics = getSummonViewportMetrics();
    return timeline
        .set(cardRevealOverlay, { opacity: 1, pointerEvents: "auto" }, "+=0.04")
        .add(() => {
            cardRevealOverlay.classList.add('active', 'impacting');
            cardStage.classList.add('materializing');
            gsap.set(cardStage, { xPercent: -50, yPercent: -50 });
            resetGyroBaseline();
            logTiltDebug('reveal/activated', {}, { force: true });
        })
        .fromTo(
            cardStage,
            { y: metrics.revealStartY, scale: 0.1, rotateX: 70, opacity: 0, filter: "blur(40px)" },
            { y: metrics.revealOvershootY, scale: 1.25, rotateX: -18, opacity: 1, filter: "blur(0px)", duration: 0.52, ease: "power4.in" }
        )
        .addLabel("slam-moment")
        .add(() => {
            triggerShake(isHighRarity(finalRarity) ? 'heavy' : 'medium');
            if (finalRarity === 'epic') {
                triggerImpactFrame();
                setTimeout(triggerImpactFrame, 60);
            }
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
}

function addRevealPresentationPhase(timeline, context) {
    const { initialFxRarity } = context;
    return timeline
        .to(whiteFlash, { opacity: 0, duration: 0.9 }, "slam-moment+=0.1")
        .add(() => {
            cardStage.classList.remove('materializing');
            cardStage.classList.add('presented');
            resetGyroBaseline();
            logTiltDebug('reveal/presented', {}, { force: true });
        })
        .add(() => revealFx.start(initialFxRarity, cardStage.getBoundingClientRect()))
        .to({}, {
            duration: 0.5,
            onComplete: () => {
                cardRevealOverlay.classList.remove('impacting');
                logTiltDebug('reveal/impacting-removed', {}, { force: true });
            }
        });
}

function addRevealFlipPhase(timeline) {
    const metrics = getSummonViewportMetrics();
    return timeline
        .addLabel("flip-start", "+=0.3")
        .add(() => {
            theCard.classList.add('is-flipped');
            logTiltDebug('flip/start', {}, { force: true });
        }, "flip-start")
        .to(cardInnerWrap, {
            rotationY: 180,
            duration: 1.05,
            ease: "back.out(1.15)",
            overwrite: "auto"
        }, "flip-start")
        .to(theCard, {
            z: metrics.flipLiftZ,
            scale: metrics.flipScale,
            duration: 0.85,
            ease: "back.out(1.2)"
        }, "flip-start")
        .to(cardGlare, { x: "100%", duration: 1.2, ease: "power2.inOut" }, "flip-start+=0.1")
        .to(theCard, {
            z: 0,
            scale: 1,
            duration: 0.5,
            ease: "elastic.out(1, 0.6)"
        }, "-=0.2")
        .add(() => retryBtn.classList.add('active'), "+=0.1")
        .to(retryBtn, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");
}

function createSummonTimeline(context) {
    const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    addSummonPreparationPhase(timeline, context);
    addSummonChargePhase(timeline);
    addSummonCompressPhase(timeline);
    addSummonTearPhase(timeline, context);
    addRevealArrivalPhase(timeline, context);
    addRevealPresentationPhase(timeline, context);
    addRevealFlipPhase(timeline);
    return timeline;
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
        this.rafId = 0;
        this.lastFrameAt = 0;
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
        this.isMobileViewport = PERFORMANCE_PROFILE.isMobileViewport;
        this.fxVisibilityBoost = this.isMobileViewport ? 1.2 : 1;
        this.frameDuration = 1000 / PERFORMANCE_PROFILE.backgroundFps;
    }

    seed() {
        this.orbs = Array.from({ length: scaleCount(18, 8) }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            radius: randomRange(60, 180),
            alpha: randomRange(0.04, 0.12),
            driftX: randomRange(-0.08, 0.08),
            driftY: randomRange(-0.1, 0.04)
        }));

        this.lines = Array.from({ length: scaleCount(18, 8) }, () => ({
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            length: randomRange(120, 360),
            alpha: randomRange(0.03, 0.08),
            speed: randomRange(0.24, 0.54)
        }));
    }

    draw = (now = 0) => {
        if (this.lastFrameAt && now - this.lastFrameAt < this.frameDuration) {
            this.rafId = requestAnimationFrame(this.draw);
            return;
        }
        const elapsed = this.lastFrameAt ? now - this.lastFrameAt : this.frameDuration;
        const step = elapsed / 16.67;
        this.lastFrameAt = now;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.orbs.forEach(orb => {
            orb.x += orb.driftX * step;
            orb.y += orb.driftY * step;
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
            line.y += line.speed * step;
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
        this.rafId = requestAnimationFrame(this.draw);
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
        this.bridgeTarget = null;
        this.rafId = 0;
        this.lastFrameAt = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        setCanvasSize(this.canvas, this.ctx);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.isMobileViewport = PERFORMANCE_PROFILE.isMobileViewport;
        this.liteFx = shouldUseLiteFx();
        this.fxVisibilityBoost = this.isMobileViewport ? 1.28 : 1;
        this.frameDuration = 1000 / PERFORMANCE_PROFILE.summonFps;
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
        this.bridgeTarget = null;
        this.lastFrameAt = 0;
        this.animate();
    }

    stop() {
        this.active = false;
        cancelAnimationFrame(this.rafId);
        this.lastFrameAt = 0;
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
            this.seedInward(scaleCount(this.liteFx ? 28 : 40, 16));
        } else if (phase === 'compress') {
            this.seedInward(scaleCount(this.liteFx ? 64 : 90, 28));
            this.spawnWave(70, 0.2, 2.2);
        } else if (phase === 'tear') {
            const isEpic = this.palette === RARITY_THEME.epic.fx;
            const isHard = this.palette === RARITY_THEME.hard.fx;
            const streakCount = (isHard || isEpic)
                ? scaleCount(this.liteFx ? 220 : 380, 92)
                : scaleCount(this.liteFx ? 120 : 180, 64);
            for (let i = 0; i < streakCount; i += 1) this.spawnBurstStreak();
            this.spawnWave(54, 0.75, 5.2);
            this.spawnWave(84, 0.56, 4.3);
            if (isHard) {
                this.spawnWave(120, 0.8, 8);
                this.spawnWave(180, 0.4, 12);
            }
            if (isEpic) {
                this.spawnWave(100, 1.0, 10);
                this.spawnWave(160, 0.7, 14);
                this.spawnWave(240, 0.5, 18);
            }
        } else if (phase === 'bridge') {
            this.spawnWave(72, 0.52, 4.4);
        }
    }

    setBridgeTarget(x, y) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            this.bridgeTarget = null;
            return;
        }
        this.bridgeTarget = { x, y };
    }

    seedAmbient() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const ambientCount = scaleCount(this.liteFx ? 58 : 96, 24);
        this.ambient = Array.from({ length: ambientCount }, () => {
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

    animate = (now = 0) => {
        if (!this.active) return;
        if (this.lastFrameAt && now - this.lastFrameAt < this.frameDuration) {
            this.rafId = requestAnimationFrame(this.animate);
            return;
        }
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const elapsed = this.lastFrameAt ? now - this.lastFrameAt : this.frameDuration;
        const step = elapsed / 16.67;
        this.lastFrameAt = now;
        this.phaseTime += step;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';

        const riftGlow = this.phase === 'charge' ? 0.76 : this.phase === 'compress' ? 1.18 : 1.42;

        const centerGlowRadius = this.isMobileViewport ? 360 : 320;
        const boostedCoreAlpha = (0.12 + riftGlow * 0.14) * this.fxVisibilityBoost;
        const boostedMidAlpha = (0.1 + riftGlow * 0.12) * this.fxVisibilityBoost;
        const centerGlow = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerGlowRadius);
        centerGlow.addColorStop(0, `rgba(${this.palette[1]},${Math.min(boostedCoreAlpha, 0.9)})`);
        centerGlow.addColorStop(0.3, `rgba(${this.palette[0]},${Math.min(boostedMidAlpha, 0.78)})`);
        centerGlow.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.fillStyle = centerGlow;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, centerGlowRadius, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.phase === 'charge' || this.phase === 'compress' || this.phase === 'tear') {
            const phaseEnergy = this.phase === 'charge' ? 0.45 : this.phase === 'compress' ? 0.72 : 0.96;
            for (let i = 0; i < 3; i += 1) {
                const ringRadius = 86 + i * 34 + Math.sin(this.phaseTime * 0.04 + i) * 8;
                const alpha = (0.08 + phaseEnergy * 0.16) * (1 - i * 0.18) * this.fxVisibilityBoost;
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(this.phaseTime * (0.01 + i * 0.004) * (i % 2 === 0 ? 1 : -1));
                this.ctx.strokeStyle = `rgba(${this.palette[i % this.palette.length]},${Math.min(alpha, 0.92)})`;
                this.ctx.lineWidth = (1.4 + i * 0.8) * (this.isMobileViewport ? 1.2 : 1);
                this.ctx.shadowBlur = (20 + i * 8) * (this.isMobileViewport ? 1.25 : 1);
                this.ctx.shadowColor = `rgba(${this.palette[i % this.palette.length]},${Math.min(alpha, 0.92)})`;

                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, ringRadius, ringRadius * 0.58, 0, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }
        }

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
            this.ctx.rect(mote.x - mote.size / 2, mote.y - mote.size / 2, mote.size, mote.size);
            this.ctx.fill();
        });

        if ((this.phase === 'charge' || this.phase === 'compress') && Math.floor(this.phaseTime) % (this.phase === 'compress' ? 1 : 2) === 0) {
            const count = this.phase === 'compress'
                ? scaleCount(this.liteFx ? 4 : 7, 2)
                : scaleCount(this.liteFx ? 2 : 4, 1);
            for (let i = 0; i < count; i += 1) this.spawnInwardShard();
        }
        if (this.phase === 'tear' && this.phaseTime < 20) {
            const burstCount = scaleCount(this.liteFx ? 10 : 18, 6);
            for (let i = 0; i < burstCount; i += 1) this.spawnBurstStreak();
        }

        this.inward = this.inward.filter(shard => {
            shard.px = shard.x;
            shard.py = shard.y;
            shard.age += step;
            const speedBoost = this.phase === 'compress' ? 1.5 : 1;
            shard.x += shard.vx * shard.speed * speedBoost * step;
            shard.y += shard.vy * shard.speed * speedBoost * step;
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
            streak.age += step;
            streak.x += streak.vx * step;
            streak.y += streak.vy * step;
            streak.vx *= Math.pow(0.94, step);
            streak.vy *= Math.pow(0.94, step);
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
            wave.radius += wave.speed * step;
            wave.alpha *= Math.pow(0.95, step);
            this.ctx.strokeStyle = `rgba(${wave.color},${wave.alpha})`;
            this.ctx.lineWidth = wave.width;
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.beginPath();
            const r = wave.radius;
            this.ctx.rect(-r, -r, r * 2, r * 2);
            this.ctx.stroke();
            this.ctx.restore();
            return wave.alpha > 0.02;
        });

        if (this.bridgeTarget && (this.phase === 'tear' || this.phase === 'bridge')) {
            const beamAlpha = this.phase === 'bridge' ? 0.4 : 0.26;
            const bridgeStroke = this.ctx.createLinearGradient(centerX, centerY, this.bridgeTarget.x, this.bridgeTarget.y);
            bridgeStroke.addColorStop(0, `rgba(${this.palette[1]},${beamAlpha})`);
            bridgeStroke.addColorStop(0.6, `rgba(${this.palette[0]},${beamAlpha * 0.72})`);
            bridgeStroke.addColorStop(1, `rgba(${this.palette[2]},0)`);
            this.ctx.strokeStyle = bridgeStroke;
            this.ctx.lineWidth = this.phase === 'bridge' ? 7.5 : 4.2;
            this.ctx.lineCap = 'round';
            this.ctx.shadowBlur = this.phase === 'bridge' ? 30 : 20;
            this.ctx.shadowColor = `rgba(${this.palette[1]},${beamAlpha})`;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            const controlX = lerp(centerX, this.bridgeTarget.x, 0.45);
            const controlY = Math.min(centerY, this.bridgeTarget.y) - (this.phase === 'bridge' ? 86 : 52);
            this.ctx.quadraticCurveTo(controlX, controlY, this.bridgeTarget.x, this.bridgeTarget.y);
            this.ctx.stroke();
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
        this.lastFrameAt = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        setCanvasSize(this.canvas, this.ctx);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.frameDuration = 1000 / PERFORMANCE_PROFILE.revealFps;
    }

    start(rarity, rect) {
        this.stop();
        this.active = true;
        this.palette = RARITY_THEME[rarity].fx;
        this.anchor = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height * 0.46
        };
        this.sparkles = Array.from({ length: scaleCount(28, 12) }, () => ({
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
        this.lastFrameAt = 0;
        this.animate();
    }

    stop() {
        this.active = false;
        cancelAnimationFrame(this.rafId);
        this.lastFrameAt = 0;
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

    animate = (now = 0) => {
        if (!this.active) return;
        if (this.lastFrameAt && now - this.lastFrameAt < this.frameDuration) {
            this.rafId = requestAnimationFrame(this.animate);
            return;
        }
        const elapsed = this.lastFrameAt ? now - this.lastFrameAt : this.frameDuration;
        const step = elapsed / 16.67;
        this.lastFrameAt = now;
        this.time += step;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.rings = this.rings.filter(ring => {
            ring.radius += ring.speed * step;
            ring.alpha *= Math.pow(0.97, step);
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
            sparkle.angle += sparkle.speed * step;
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

        if ((this.time < 52 && Math.floor(this.time) % 1 === 0) || (this.time < 132 && Math.floor(this.time) % 3 === 0)) {
            const burstCount = scaleCount(this.time < 20 ? 8 : 4, 2);
            for (let i = 0; i < burstCount; i += 1) this.spawnTrail();
        }
        if ((this.time < 160 && Math.floor(this.time) % 2 === 0) || (this.time < 320 && Math.floor(this.time) % 6 === 0)) {
            this.spawnEmber();
        }
        this.trails = this.trails.filter(trail => {
            trail.age += step;
            trail.x += trail.vx * step;
            trail.y += trail.vy * step;
            trail.vx *= Math.pow(0.94, step);
            trail.vy *= Math.pow(0.94, step);
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
            ember.age += step;
            ember.x += ember.vx * step;
            ember.y += ember.vy * step;
            ember.vy += 0.02 * step;
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

syncPerformanceProfile();
mainBg.draw();

// --- Enhanced Event Listeners for 3D Parallax ---

// Unified Pointer Events for Touch, Pen, and Mouse hover/drag
window.addEventListener('pointerdown', event => {
    if (!canTiltCard() && !canTiltHome()) return;

    const isMouse = event.pointerType === 'mouse';
    activeTiltPointerId = isMouse ? null : event.pointerId;
    resetGyroBaseline();
    logTiltDebug('pointerdown', {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        trackAsActive: !isMouse,
        clientX: roundTiltDebugValue(event.clientX),
        clientY: roundTiltDebugValue(event.clientY)
    }, { force: true });
    queueCardTiltUpdate(event.clientX, event.clientY);
});

window.addEventListener('pointermove', event => {
    if (!canTiltCard() && !canTiltHome()) return;

    const isMouse = event.pointerType === 'mouse';
    const isActivePointer = activeTiltPointerId === event.pointerId;
    if (!isMouse && !isActivePointer) return;

    // Prevent scrolling on mobile during interaction
    if (event.pointerType === 'touch') {
        const target = event.target;
        if (cardRevealOverlay.contains(target) || (canTiltHome() && target.closest('#home-hero-stage'))) {
            event.preventDefault();
        }
    }

    queueCardTiltUpdate(event.clientX, event.clientY);
}, { passive: false });

const endPointerInteraction = (event) => {
    if (activeTiltPointerId === event.pointerId) {
        logTiltDebug('pointerend', {
            pointerId: event.pointerId,
            pointerType: event.pointerType
        }, { force: true });
        activeTiltPointerId = null;
        resetGyroBaseline();
        resetCardTilt();
    }
    if (event.pointerType !== 'mouse' && canTiltHome()) {
        interactionEngine.resetHome();
    }
};

window.addEventListener('pointerup', endPointerInteraction);
window.addEventListener('pointercancel', endPointerInteraction);
window.addEventListener('orientationchange', resetGyroBaseline);
window.addEventListener('resize', () => {
    syncPerformanceProfile();
    clearTiltBoundsCache();
});
window.addEventListener('scroll', clearTiltBoundsCache, { passive: true });

// Reset tilt when mouse leaves the viewport entirely
document.addEventListener('mouseleave', () => {
    interactionEngine.resetHome();
    resetCardTilt();
});
cardRevealOverlay.addEventListener('mouseleave', resetCardTilt);

window.addEventListener('blur', () => {
    interactionEngine.resetHome();
    resetCardTilt();
});
window.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeReveal();
});

async function triggerSummon() {
    if (isSummoning) return;
    isSummoning = true;
    try {
        await ensureGyroTiltAccess();
        const destiny = drawDestiny();
        const finalRarity = destiny.rarity;
        let initialFxRarity = finalRarity;
        const retrying = cardRevealOverlay.classList.contains('active');
        const bridgeTargetX = window.innerWidth / 2;
        const bridgeTargetY = window.innerHeight * 0.46;
        applyDestinySkin(destiny, initialFxRarity);
        if (retrying) await collapseReveal();
        const mainTl = createSummonTimeline({
            initialFxRarity,
            finalRarity,
            bridgeTargetX,
            bridgeTargetY
        });
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

function attachInteractions(btn) {
    btn.addEventListener('click', triggerSummon);
    // Add aggressive touchend fallback for mobile browsers like Edge Android 
    // that might cancel native click events during pointermove
    btn.addEventListener('touchend', (e) => {
        if (!isSummoning) {
            e.preventDefault(); // Stop native click from double-firing
            triggerSummon();
        }
    }, { passive: false });
}

attachInteractions(summonBtn);
attachInteractions(retryBtn);
loadTasks();
