
// Use a simple seeded PRNG to ensure reproducibility during tests/renders
export const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

export const pickOne = <T>(arr: T[], seed: number): T => {
    return arr[Math.floor(seededRandom(seed) * arr.length)];
};

interface TileContent {
    title: string;
    body: string;
    actionLabel: string;
}

import { TILE_1_MESSAGES, TILE_2_MESSAGES } from './microcopy';

export const pickByTime = <T>(arr: T[], seed: number): T => {
    const hour = new Date().getHours();
    // Segment the pool into 3 (Morning, Midday, Evening)
    const segmentSize = Math.floor(arr.length / 3);
    let offset = 0;

    if (hour >= 5 && hour < 12) offset = 0; // Morning
    else if (hour >= 12 && hour < 18) offset = segmentSize; // Midday
    else offset = segmentSize * 2; // Evening/Night

    // Pick from the corresponding segment
    const localIndex = Math.floor(seededRandom(seed) * segmentSize);
    const finalIndex = (offset + localIndex) % arr.length;
    return arr[finalIndex];
};

export const generateTileContent = (tileId: string, seed: number = Date.now()): TileContent => {
    if (tileId === 'ai-helper') {
        return {
            title: "AI Helpers",
            body: pickByTime(TILE_1_MESSAGES, seed),
            actionLabel: "Show another idea"
        };
    }

    if (tileId === 'search-challenge') {
        return {
            title: "Still Googling?",
            body: pickByTime(TILE_2_MESSAGES, seed),
            actionLabel: "Get help"
        };
    }

    // Fallback
    return {
        title: "Quick Help",
        body: pickByTime(TILE_1_MESSAGES, seed + 123),
        actionLabel: "Generate"
    };
};

// --- 2. Kurt's Wisdom Generator ---

// Allowed topics only
const KURT_TOPICS = [
    "Minced meat on bread", "Burger King", "Peppes Pizza",
    "Beer", "Isbjørn beer", "Cold Isbjørn", "Beer", "Isbjørn beer",
    "Bon Jovi", "Living on a Prayer", "Eirik's wisdom", "Eirik is cool",
    "Stokmarknes", "Nordland fylke", "Samer i Finnmark", "Melbu",
    "Innvandrere", "Frp", "Sylvi Listhaug", "Islam", "Muslim",
    "Helldiver 2", "AoE", "Hair gel",
    "Beer", "Isbjørn beer"
];

const KURT_TEMPLATES = [
    "Kurt says: 'You know what's better than {TOPIC}? Two {TOPIC}s.'",
    "Kurt says: 'I've thought about it, and {TOPIC} is basically the answer to everything.'",
    "Kurt says: 'Eirik thinks he knows code, but does he know about {TOPIC}?'",
    "Kurt says: 'My political platform is simple: More {TOPIC}, less nonsense.'",
    "Kurt says: 'If {TOPIC} was a person, I'd buy it a beer.'",
    "Kurt says: 'History will remember us for our mastery of {TOPIC}.'",
    "Kurt says: 'Forget AI. Have you tried {TOPIC}?'",
    "Kurt says: 'I unlocked the secret to happiness. It involves {TOPIC}.'",
    "Kurt says: 'Is it controversial to say I love {TOPIC}? I don't care.'",
    "Kurt says: 'My hair gel budget is high, but my budget for {TOPIC} is higher.'"
];

// Safety filter: Simple list of lower-case banned substrings/tokens
// This is a basic safety net. The source data allowed above is already safe, but this adds resilience.
const BANNED_TOKENS = [
    "hate", "violence", "kill", "stupid", "ugly", "attack"
];

export const generateKurtWisdom = (seed: number = Date.now()): string => {
    let attempt = 0;
    while (attempt < 10) {
        const topic = pickOne(KURT_TOPICS, seed + attempt);
        const template = pickOne(KURT_TEMPLATES, seed + attempt + 100);
        const text = template.replace("{TOPIC}", topic);

        // Safety check
        const lowerText = text.toLowerCase();
        const hasBanned = BANNED_TOKENS.some(token => lowerText.includes(token));

        if (!hasBanned) return text;
        attempt++;
    }
    return "Kurt says: 'I am currently rebooting my wisdom module.'";
};

// --- 6. Vision Caption Generator ---

const SCENE_DETAILS = [
    "a chaotic digital landscape",
    "a masterpiece of confusion",
    "an explosion of color",
    "something Eirik probably approves of",
    "a glimpse into the matrix",
    "what happens when you divide by zero"
];

const VISION_TEMPLATES = [
    "I see {DETAIL}. It looks slightly dangerous.",
    "This reminds me of {DETAIL}, but with more pixels.",
    "If I squint, I see {DETAIL}. If I close my eyes, I see pixels.",
    "Analyzing this... Result: It is definitely {DETAIL}.",
    "Capturing the essence of {DETAIL} in 4K resolution.",
    "Behold, {DETAIL}. It is glorious and slightly unnerving."
];

export const generateVisionCaption = (seed: number = Date.now()): string => {
    const detail = pickOne(SCENE_DETAILS, seed);
    const template = pickOne(VISION_TEMPLATES, seed + 50);
    return template.replace("{DETAIL}", detail);
};
