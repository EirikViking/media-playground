
// Use a simple seeded PRNG to ensure reproducibility during tests/renders
export const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

export const pickOne = <T>(arr: T[], seed: number): T => {
    return arr[Math.floor(seededRandom(seed) * arr.length)];
};

// --- 1. AI Helper Tile Data & Generator ---

interface TileContent {
    title: string;
    body: string;
    actionLabel: string;
}

const AI_TOPICS = [
    "AI in 2026",
    "Why Google is Dusty",
    "Eirik's Code Secrets",
    "Kurt's Upgrade Path",
    "The Future of Work",
    "The Singularity",
    "Robots Taking Over",
    "Infinite Context Windows",
    "Prompt Engineering is Dead",
    "Digital Archaeology"
];

const AI_PARAGRAPHS = [
    "In 2026, typing search queries is like using a fax machine. The real pros just grunt at their AI agents until the code compiles.",
    "Kurt still thinks 'SEO' is a valid career path. Meanwhile, the AI has already rewritten his entire worldview twice before breakfast.",
    "ChatGPT doesn't just write code; it vividly hallucinates better infrastructure than we actually have. It's a feature, not a bug.",
    "Stop manually centering divs. Gemini can center a div in 4 dimensions simultaneously. It's time to let go.",
    "The search bar is gathering dust. If you aren't prompting, you're just guessing.",
    "Eirik says real developers use AI. Kurt says real developers use Notepad. Guess who is still fixing bugs from 2024?",
    "Why search for answers when the AI can just confidently invent them for you? It's much faster and arguably more entertaining.",
    "Gemini is basically a super-smart intern that never sleeps, never complains, but occasionally tries to explain why 2+2=5.",
    "Remember when we had to write regex manually? That was the dark ages. Now we just ask the machine to 'match the funny patterns'.",
    "The cloud is just someone else's computer, but the AI is someone else's brain. And frankly, it's bigger than yours.",
    "You are still writing unit tests? That's cute. My AI agent proactively refactors my code while I sleep.",
    "Google is great for finding facts. AI is great for finding meaning. Or inventing meaning. The line is blurry.",
    "If your code doesn't work, don't debug it. Just ask the AI to 'make it work'. It surprisingly effective.",
    "Keyboard shortcuts are so 2023. Neural interfaces are the future. Think the code, and it shall appear."
];

export const generateTileContent = (_tileId: string, seed: number = Date.now()): TileContent => {
    const topic = pickOne(AI_TOPICS, seed);
    const p1 = pickOne(AI_PARAGRAPHS, seed + 1);
    const p2 = pickOne(AI_PARAGRAPHS, seed + 2);

    // Ensure distinct paragraphs
    const body = p1 === p2 ? p1 : `${p1} ${p2}`;

    return {
        title: topic,
        body,
        actionLabel: "Generate Again"
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
