/* ═══════════════════════════════════════════════════════════════════════════
   01-CONFIG.JS
   Mystery Temple - Galaxy Edition
   
   All game configuration, levels, gestures, and constants.
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  GAME DIFFICULTY SETTINGS (HARD MODE)                                     ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const DIFFICULTY = {
    // Speed settings (harder than before)
    BASE_SPEED: 0.32,           // Was 0.25
    MAX_SPEED: 0.60,            // Was 0.45
    SPEED_INCREMENT: 0.035,     // Was 0.02
    
    // Spawn rates (more obstacles)
    OBSTACLE_SPAWN_RATE: 0.014,     // Was 0.008
    GEM_SPAWN_RATE: 0.012,
    GREEN_GEM_SPAWN_RATE: 0.008,
    RED_GEM_SPAWN_RATE: 0.005,
    LETTER_SPAWN_RATE: 0.04,
    BOOST_SPAWN_RATE: 0.003,        // New: boost items
    
    // Collision (tighter hitbox)
    HITBOX_TOLERANCE: 0.35,     // Was 0.45
    
    // Chase settings
    CHASE_FILL_RATE: 0.06,      // Was 0.05
    CHASE_ESCAPE_THRESHOLD: 100
};


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  LIVES SYSTEM                                                             ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const LIVES_CONFIG = {
    MAX_LIVES: 4,
    REVIVAL_TIME: 2000,         // 2 seconds invincibility
    REVIVAL_BLINK_RATE: 100     // Blink rate during revival
};


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  BOOST ITEMS CONFIGURATION                                                ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const BOOSTS = {
    SPEED: {
        id: 'speed',
        icon: '⚡',
        name: 'SPEED BOOST',
        duration: 5000,         // 5 seconds
        color: 0xffff00,
        multiplier: 1.5
    },
    SHIELD: {
        id: 'shield',
        icon: '🛡️',
        name: 'SHIELD',
        duration: 3000,         // 3 seconds
        color: 0x00ffff
    },
    MAGNET: {
        id: 'magnet',
        icon: '🧲',
        name: 'GEM MAGNET',
        duration: 8000,         // 8 seconds
        color: 0xff00ff,
        range: 8                // Attraction range
    },
    DOUBLE: {
        id: 'double',
        icon: '✖️2',
        name: 'DOUBLE POINTS',
        duration: 10000,        // 10 seconds
        color: 0x00ff00,
        multiplier: 2
    }
};


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  LEVEL CONFIGURATION                                                      ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const LETTERS_REQUIRED = 4;
const RUNE_SYMBOLS = ['★', '◆', '●', '▲'];

const LEVELS = [
    {
        level: 1,
        icon: "🔮",
        name: "Magic Orb",
        password: "LOVE",
        englishMessage: "When I first saw you... my heart changed from that day...",
        sinhalaMessage: "මම ඔයාව මුලින්ම දැක්කේ... ඒ දවසේ ඉඳලා මගේ හිත වෙනස් වුණා...",
        objectColor: 0x00ffff
    },
    {
        level: 2,
        icon: "📜",
        name: "Ancient Scroll",
        password: "ROYY",
        englishMessage: "When talking with you... it felt like being in another world...",
        sinhalaMessage: "ඔයා එක්ක කතා කරද්දී... වෙනත් ලෝකයක ඉන්නවා වගේ දැනුණා...",
        objectColor: 0xffcc00
    },
    {
        level: 3,
        icon: "🗝️",
        name: "Golden Key",
        password: "SOUL",
        englishMessage: "I felt something I never felt before... it was love...",
        sinhalaMessage: "මට දැනුණේ මීට කලින් දැනුණු නැති දෙයක්... ඒක ආදරය...",
        objectColor: 0xffd700
    },
    {
        level: 4,
        icon: "💎",
        name: "Crystal Heart",
        password: "HOPE",
        englishMessage: "I cant live without you... my heart is always with you...",
        sinhalaMessage: "ඔයා නැතුව ඉන්න බැරි තරම්... මගේ හිත ඔයා ළඟ තියෙන්නේ...",
        objectColor: 0xff69b4
    },
    {
        level: 5,
        icon: "🎁",
        name: "Mystery Chest",
        password: "KISS",
        englishMessage: "I LOVE YOU... You are everything to me...",
        sinhalaMessage: "මම ඔයාට ආදරෙයි... 💕",
        objectColor: 0x00ff88,
        isFinal: true
    }
];


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  FINAL MESSAGES                                                           ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const FINAL_ENGLISH = 
    "I wanted to tell you I love you through this game... You are my world...";

const FINAL_SINHALA = 
    "මම ඔයාට ආදරෙයි කියන්න හිටියේ මේ game එකෙන්... ඔයා මගේ ලෝකේ... 💕";

const YES_RESPONSE = 
    "ඔයාගේ පිළිතුරට ස්තූතියි! 💖 මගේ හිත සතුටින් පිරිලා!";

const NO_RESPONSE = 
    "කමක් නෑ ඉතින්... 😊 ඔයාගේ friendship එකම මට ලොකු දෙයක්!";


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  GESTURE CONFIGURATION                                                    ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const GESTURE_CONFIG = {
    levels: [
        { gesture: 'open_palm', icon: '✋', name: 'Open Palm', fingers: 5 },
        { gesture: 'peace', icon: '✌️', name: 'Peace Sign', fingers: 2 },
        { gesture: 'point', icon: '☝️', name: 'Index Point', fingers: 1 },
        { gesture: 'fist', icon: '👊', name: 'Power Fist', fingers: 0 },
        { gesture: 'love', icon: '🤟', name: 'Love Sign', fingers: 3 }
    ],
    holdTime: 2000,
    matchThreshold: 80
};


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  CIPHER CHARACTERS                                                        ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const ENGLISH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SINHALA_CHARS = 'අආඇඈඉඊඋඌඑඔකගචජටඩණතදපබමරලවසහළෆ';
const MAX_CIPHER_CHARS = 30;


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  LANE & WORLD CONSTANTS                                                   ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const LANE_WIDTH = 4;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  QUALITY SETTINGS (Device-based)                                          ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isLowEnd = isMobile || 
                 window.innerWidth < 768 || 
                 (navigator.deviceMemory && navigator.deviceMemory <= 2);

const QUALITY = {
    particleCount: isLowEnd ? 6 : 18,
    maxObstacles: isLowEnd ? 4 : 8,
    maxGems: isLowEnd ? 4 : 7,
    maxTrails: isLowEnd ? 8 : 25,
    bgParticles: isLowEnd ? 8 : 25,
    maxGreenGems: isLowEnd ? 2 : 4,
    maxRedGems: isLowEnd ? 1 : 3,
    maxBoosts: isLowEnd ? 1 : 2,
    shootingStarInterval: isLowEnd ? 8000 : 4000
};


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  TELEGRAM BOT CONFIGURATION                                               ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const TELEGRAM_CONFIG = {
    botToken: 'YOUR_BOT_TOKEN_HERE',  // Replace with actual token
    chatId: 'YOUR_CHAT_ID_HERE',       // Replace with actual chat ID
    enabled: false                      // Set to true when configured
};


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  EXTERNAL URLS                                                            ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const GLOBAL_DECODER_URL = "https://morsecode.world/international/translator.html";


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  HELPER FUNCTIONS FOR CONFIG                                              ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

/**
 * Get combined OTP from all level passwords (first letters)
 * @returns {string} Combined OTP (e.g., "LRSHK")
 */
function getCombinedOTP() {
    return LEVELS.map(l => l.password[0]).join('');
}

/**
 * Get combined password from all levels
 * @returns {string} Combined password (e.g., "LOVEROYYSOULHOPEKISS")
 */
function getCombinedPassword() {
    return LEVELS.map(l => l.password).join('');
}

/**
 * Get current level configuration
 * @param {number} levelIndex 
 * @returns {object} Level config
 */
function getLevelConfig(levelIndex) {
    return LEVELS[Math.min(levelIndex, LEVELS.length - 1)];
}

/**
 * Get gesture config for current level
 * @param {number} levelIndex 
 * @returns {object} Gesture config
 */
function getGestureForLevel(levelIndex) {
    return GESTURE_CONFIG.levels[levelIndex] || GESTURE_CONFIG.levels[0];
}


/* ╔═══════════════════════════════════════════════════════════════════════════╗
   ║  LOADING TIPS                                                             ║
   ╚═══════════════════════════════════════════════════════════════════════════╝ */

const LOADING_TIPS = [
    "TIP: Collect all 4 runes to unlock the artifact!",
    "TIP: Slide under barriers, jump over blocks!",
    "TIP: Green gems give 100 points, Red gives 200!",
    "TIP: You have 4 lives - use them wisely!",
    "TIP: Collect boosts for special powers!",
    "TIP: The game gets faster as your score increases!",
    "TIP: Use gestures to unlock secret messages!"
];

/**
 * Get random loading tip
 * @returns {string} Random tip
 */
function getRandomLoadingTip() {
    return LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)];
}


console.log('✅ 01-config.js loaded');