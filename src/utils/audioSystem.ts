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

export const playBeerTone = (count: number) => {
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
    if (typeof window === 'undefined' || !window.speechSynthesis || !enabled) return;

    // Cancel previous
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate; // 0.1 to 10
    utterance.pitch = 1;

    // Try to find a good voice? Optional.
    // const voices = window.speechSynthesis.getVoices();
    // const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
    // if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
};
