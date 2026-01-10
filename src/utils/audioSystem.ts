const getAudioContext = () => {
    // Check for support
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    // Create or resume
    // Note: We create a new context per interaction usually or reuse a global one.
    // For simplicity, we'll try to reuse but robustly.
    return new AudioContextClass();
};

let globalAudioCtx: AudioContext | null = null;

const ensureAudioContext = () => {
    if (!globalAudioCtx) {
        globalAudioCtx = getAudioContext();
    }
    if (globalAudioCtx?.state === 'suspended') {
        globalAudioCtx.resume().catch(() => { });
    }
    return globalAudioCtx;
};

// --- Voice Management ---
let cachedEnglishVoice: SpeechSynthesisVoice | null = null;

const getEnglishVoice = (): SpeechSynthesisVoice | null => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;

    if (cachedEnglishVoice) return cachedEnglishVoice;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Prioritize specific high-quality English voices
    const preferredNames = ['Google US English', 'Microsoft Zira', 'Samantha'];

    // 1. Try preferred names
    for (const name of preferredNames) {
        const found = voices.find(v => v.name.includes(name));
        if (found) {
            cachedEnglishVoice = found;
            return found;
        }
    }

    // 2. Try any en-US
    const usVoice = voices.find(v => v.lang === 'en-US');
    if (usVoice) {
        cachedEnglishVoice = usVoice;
        return usVoice;
    }

    // 3. Try any English
    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    if (anyEnglish) {
        cachedEnglishVoice = anyEnglish;
        return anyEnglish;
    }

    return null;
};

// Ensure voices are loaded (Chrome quirk)
if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        getEnglishVoice(); // Pre-cache
    };
}


export const playBeerTone = (count: number) => {
    // TEST SAFETY: Disable audio in Playwright/Automation
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;

    const ctx = ensureAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    // Volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Tone logic
    if (count < 4) {
        // Playful / Happy
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 + (count * 50), now); // Ascending
    } else if (count < 8) {
        // Caution / Wobbly
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + (Math.random() * 50), now);
        // Wobble
        osc.frequency.linearRampToValueAtTime(280, now + 0.2);
    } else {
        // Danger / Alarm
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);

        // Add a second dissonance oscillator for > 8
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(155, now); // Dissonant interval
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.start(now);
        osc2.stop(now + 0.5);
    }

    osc.start(now);
    osc.stop(now + 0.5);
};

export const speakMessage = (text: string, enabled: boolean, volume: number = 1, rate: number = 1) => {
    // TEST SAFETY: Disable audio in Playwright/Automation
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;

    if (typeof window === 'undefined' || !window.speechSynthesis || !enabled) return;

    // Cancel previous
    window.speechSynthesis.cancel();

    const voice = getEnglishVoice();

    // STRICT REQUIREMENT: If no English voice, disable speech entirely.
    if (!voice) {
        console.warn("AudioSystem: No English voice found. Speech disabled.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate; // 0.1 to 10
    utterance.pitch = 1;
    utterance.voice = voice;
    utterance.lang = 'en-US'; // Force param

    window.speechSynthesis.speak(utterance);
};
