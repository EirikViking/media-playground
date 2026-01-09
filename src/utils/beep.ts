export const playWarningSound = async () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // Resume context if needed (browsers mute by default until interaction)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const type = 'sawtooth';
        const volume = 0.1;
        const duration = 0.15;

        // First beep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = type;
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + duration);
        gain1.gain.setValueAtTime(volume, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + duration);

        // Second beep (slightly higher pitch, delayed)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = type;
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
        osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.2 + duration);
        gain2.gain.setValueAtTime(volume, ctx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2 + duration);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.2 + duration);

        // Cleanup
        setTimeout(() => {
            ctx.close();
        }, 1000);

    } catch (error) {
        console.error('Failed to play warning sound:', error);
    }
};
