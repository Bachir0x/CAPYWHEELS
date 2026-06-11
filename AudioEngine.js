/**
 * CapyWheels Procedural Sound & Music Engine
 * Built with Web Audio API for 100% asset-free, safe interactive sound playback.
 * Synthesizes classic retro arcade driving sounds and dynamic chiptune background music.
 */

// Music pentatonic-minor based melody sequence (A Minor -> F Major -> C Major -> G Major)
// 0 represents silent steps. 64 steps loop.
const MELODY = [
    // Bar 1: A Minor (Steps 0-15)
    440, 0, 523, 0, 587, 0, 659, 0, 587, 659, 523, 0, 440, 0, 0, 0,
    // Bar 2: F Major (Steps 16-31)
    349, 0, 440, 0, 523, 0, 587, 0, 523, 587, 440, 0, 349, 0, 0, 0,
    // Bar 3: C Major (Steps 32-47)
    523, 0, 587, 0, 659, 0, 784, 0, 659, 784, 587, 0, 523, 0, 0, 0,
    // Bar 4: G Major (Steps 48-63)
    392, 0, 494, 0, 587, 0, 659, 0, 587, 659, 494, 0, 392, 0, 440, 523
];

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;

        // Music Sequencer state
        this.tempo = 135; // BPM
        this.isPlayingMusic = false;
        this.schedulerInterval = null;
        this.nextNoteTime = 0;
        this.currentStep = 0; // 0 to 63
        this.lastWarningTime = 0;

        // Dynamic Engine hum synth
        this.engineOsc = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.isEngineRunning = false;
    }

    // Lazy initialize standard AudioContext
    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.warn('Web Audio API is not supported in this browser environment.');
            return;
        }
        this.ctx = new AudioContextClass();
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.warn('AudioContext resume failed:', e));
        }
    }

    // Helper to generate retro-style white noise buffer
    _createNoiseNode(duration) {
        if (!this.ctx) return null;
        try {
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = buffer;
            return noiseNode;
        } catch (e) {
            return null;
        }
    }

    // Toggles
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        return this.musicEnabled;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        if (!this.sfxEnabled) {
            this.stopEngine();
        } else if (this.isPlayingMusic) {
            this.startEngine();
        }
        return this.sfxEnabled;
    }

    /* ── SOUND EFFECTS ────────────────────────────────── */

    // Retro-shimmer "coin" pick up chime with pitch-raising combo factor!
    playOrange(combo = 0) {
        if (!this.sfxEnabled) return;
        this.resume();
        const ctx = this.ctx;
        if (!ctx) return;

        const now = ctx.currentTime;
        
        // Pitch rises up to +80% on combos (capped at combo 16)
        const currentCombo = Math.max(0, combo);
        const pitchFactor = 1 + Math.min(currentCombo, 16) * 0.05;
        const baseFreq = 523.25; // C5
        const currentFreq = baseFreq * pitchFactor;

        // First blip
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(currentFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(currentFreq * 1.5, now + 0.08);

        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.35);

        // Second shimmer chime playing closely after
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(currentFreq * 1.5, now + 0.04);
        osc2.frequency.exponentialRampToValueAtTime(currentFreq * 2.2, now + 0.12);

        gain2.gain.setValueAtTime(0.06, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.25);
    }

    // Squelching downward crash/slip sound
    playBanana() {
        if (!this.sfxEnabled) return;
        this.resume();
        const ctx = this.ctx;
        if (!ctx) return;

        const now = ctx.currentTime;

        // Downward frequency sweep synth
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.35);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Splat noise
        const noise = this._createNoiseNode(0.2);
        if (noise) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.12, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            noise.start(now);
            noise.stop(now + 0.2);
        }
    }

    // High momentum / danger alert beep
    playWarning() {
        if (!this.sfxEnabled) return;
        this.resume();
        const ctx = this.ctx;
        if (!ctx) return;

        const now = ctx.currentTime;
        if (now - this.lastWarningTime < 0.65) return; // rate limit warning triggers
        this.lastWarningTime = now;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.linearRampToValueAtTime(580, now + 0.15);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Electronic startup chords
    playStartRide() {
        if (!this.sfxEnabled) return;
        this.resume();
        const ctx = this.ctx;
        if (!ctx) return;

        const now = ctx.currentTime;
        const chords = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        
        chords.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gainNode.gain.setValueAtTime(0.001, now + idx * 0.08);
            gainNode.gain.linearRampToValueAtTime(0.12, idx * 0.08 + now + 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.001, idx * 0.08 + now + 0.35);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.45);
        });
    }

    // Heavy crash sound mixed with sad retro failure chords
    playCrash() {
        if (!this.sfxEnabled) return;
        this.resume();
        const ctx = this.ctx;
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Bass blast
        const boom = ctx.createOscillator();
        const boomGain = ctx.createGain();
        boom.type = 'sawtooth';
        boom.frequency.setValueAtTime(120, now);
        boom.frequency.exponentialRampToValueAtTime(20, now + 0.85);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, now);

        boomGain.gain.setValueAtTime(0.35, now);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        boom.connect(filter);
        filter.connect(boomGain);
        boomGain.connect(ctx.destination);

        boom.start(now);
        boom.stop(now + 0.9);

        // 2. Gritty explosion noise
        const crashNoise = this._createNoiseNode(1.0);
        if (crashNoise) {
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(200, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(60, now + 0.85);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.32, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

            crashNoise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            crashNoise.start(now);
            crashNoise.stop(now + 1.0);
        }

        // 3. Descending sad gameover chimes
        const sadNotes = [220.00, 196.00, 174.61]; // A3, G3, F3
        sadNotes.forEach((freq, idx) => {
            const noteOsc = ctx.createOscillator();
            const noteGain = ctx.createGain();
            
            noteOsc.type = 'triangle';
            noteOsc.frequency.setValueAtTime(freq, now + 0.45 + idx * 0.18);
            
            noteGain.gain.setValueAtTime(0.12, now + 0.45 + idx * 0.18);
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.18 + 0.25);

            noteOsc.connect(noteGain);
            noteGain.connect(ctx.destination);

            noteOsc.start(now + 0.45 + idx * 0.18);
            noteOsc.stop(now + 0.45 + idx * 0.18 + 0.3);
        });
    }

    /* ── MOTOR ENGINE SYNTH ────────────────────────────── */

    startEngine() {
        if (!this.sfxEnabled) return;
        this.resume();
        const ctx = this.ctx;
        if (!ctx || this.isEngineRunning) return;

        const now = ctx.currentTime;
        
        this.engineOsc = ctx.createOscillator();
        this.engineFilter = ctx.createBiquadFilter();
        this.engineGain = ctx.createGain();

        // Sawtooth oscillator creates a neat motorcycle/kart motor feel
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, now);

        // Soften raw buzz using a low-pass filter
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(95, now);
        this.engineFilter.Q.setValueAtTime(3.5, now);

        // Start off subtle
        this.engineGain.gain.setValueAtTime(0.03, now);

        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(ctx.destination);

        this.engineOsc.start(now);
        this.isEngineRunning = true;
    }

    // Changes scale dynamically according to user speed control
    updateEngineSpeed(speed, isOffRoad) {
        if (!this.isEngineRunning || !this.ctx) return;
        
        const now = this.ctx.currentTime;
        const speedPercent = speed / 14; // max speed is 14

        // Freq glide: 42Hz to 125Hz. Vibrates mildly on grass for high tactile feel!
        const vibration = isOffRoad ? Math.sin(now * 38) * 6 : 0;
        const targetFreq = 42 + speedPercent * 80 + vibration;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);

        // Filter cutoff moves up to let engine sizzle/whine slightly on full throttle
        const targetFilterFreq = 85 + speedPercent * 160 + (isOffRoad ? 50 : 0);
        this.engineFilter.frequency.setTargetAtTime(targetFilterFreq, now, 0.08);

        // Slightly increase sound volume when speed peaks
        const targetGainValue = this.sfxEnabled ? (0.02 + speedPercent * 0.035) : 0;
        this.engineGain.gain.setTargetAtTime(targetGainValue, now, 0.12);
    }

    stopEngine() {
        if (!this.isEngineRunning) return;
        try {
            if (this.engineOsc) this.engineOsc.stop();
            if (this.engineOsc) this.engineOsc.disconnect();
            if (this.engineFilter) this.engineFilter.disconnect();
            if (this.engineGain) this.engineGain.disconnect();
        } catch (e) {
            // fail-safe teardown
        }
        this.engineOsc = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.isEngineRunning = false;
    }


    /* ── BACKGROUND MUSIC SEQUENCER ───────────────────── */

    startMusic() {
        if (this.isPlayingMusic) return;
        this.resume();
        if (!this.ctx) return;

        this.isPlayingMusic = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime;

        // Schedule notes in advance using regular precise timing checks
        this.schedulerInterval = setInterval(() => {
            this._scheduler();
        }, 35);
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
    }

    _scheduler() {
        if (!this.ctx || !this.isPlayingMusic) return;

        // Schedule ahead threshold (150ms)
        while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
            const time = this.nextNoteTime;
            this._scheduleNextStep(this.currentStep, time);

            // Step length based on sixteenth notes at current tempo
            const stepDurationLength = (60.0 / this.tempo) / 4.0;
            this.nextNoteTime += stepDurationLength;

            // Increment loop step
            this.currentStep = (this.currentStep + 1) % 64;
        }
    }

    _scheduleNextStep(step, time) {
        // Base chord root frequencies
        let baseChordFreq = 55.00; // A1
        if (step >= 0 && step < 16)        baseChordFreq = 55.00;  // A
        else if (step >= 16 && step < 32)  baseChordFreq = 43.65;  // F
        else if (step >= 32 && step < 48)  baseChordFreq = 65.41;  // C
        else if (step >= 48 && step < 64)  baseChordFreq = 49.00;  // G

        // 1. Double-Time Driving Synthwave Bassline
        if (step % 2 === 0) {
            const isUptick = (step % 4 === 2);
            this._playBassSynth(baseChordFreq, time, isUptick);
        }

        // 2. Chiptune Drum Machine
        const gridStep = step % 16;
        // Kick on 0, 4, 8, 12
        if (gridStep === 0 || gridStep === 4 || gridStep === 8 || gridStep === 12) {
            this._playKickDrum(time);
        }
        // Snare on 4, 12
        if (gridStep === 4 || gridStep === 12) {
            this._playSnareDrum(time);
        }
        // Off-beat clicky Hi-hat
        if (gridStep === 2 || gridStep === 6 || gridStep === 10 || gridStep === 14) {
            this._playHihatDrum(time);
        }

        // 3. Lead Arpeggiator / Melody Synth
        const melodyFreq = MELODY[step];
        if (melodyFreq && melodyFreq > 0) {
            this._playLeadSynth(melodyFreq, time);
        }
    }

    // Bass synthesizer
    _playBassSynth(freq, time, isUptick) {
        if (!this.musicEnabled || !this.ctx) return;
        const ctx = this.ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        // Play octave up on uptick steps
        osc.frequency.setValueAtTime(isUptick ? freq * 2 : freq, time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, time);

        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.17);
    }

    // Melodic lead synth
    _playLeadSynth(freq, time) {
        if (!this.musicEnabled || !this.ctx) return;
        const ctx = this.ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Custom square wave lead with filter sweep
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, time);
        filter.frequency.exponentialRampToValueAtTime(320, time + 0.18);
        filter.Q.setValueAtTime(2.2, time);

        gain.gain.setValueAtTime(0.04, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.24);
    }

    // Deep synth kick
    _playKickDrum(time) {
        if (!this.musicEnabled || !this.ctx) return;
        const ctx = this.ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(125, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.09);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.13);
    }

    // Noise snare drum
    _playSnareDrum(time) {
        if (!this.musicEnabled || !this.ctx) return;
        const ctx = this.ctx;

        const noiseNode = this._createNoiseNode(0.12);
        if (!noiseNode) return;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(950, time);

        const gainObj = ctx.createGain();
        gainObj.gain.setValueAtTime(0.065, time);
        gainObj.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        noiseNode.connect(filter);
        filter.connect(gainObj);
        gainObj.connect(ctx.destination);

        noiseNode.start(time);
        noiseNode.stop(time + 0.11);
    }

    // Highpass noise hi-hat
    _playHihatDrum(time) {
        if (!this.musicEnabled || !this.ctx) return;
        const ctx = this.ctx;

        const noiseNode = this._createNoiseNode(0.035);
        if (!noiseNode) return;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5500, time);

        const gainObj = ctx.createGain();
        gainObj.gain.setValueAtTime(0.03, time);
        gainObj.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

        noiseNode.connect(filter);
        filter.connect(gainObj);
        gainObj.connect(ctx.destination);

        noiseNode.start(time);
        noiseNode.stop(time + 0.035);
    }
}
