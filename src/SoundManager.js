// src/SoundManager.js

class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled || this.ctx.state === 'suspended') return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Envelope: Start at volume, fade to 0.01 fast
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playClick() {
        // CHANGED: Lower frequency, Sine wave, very short duration
        // This mimics a mechanical switch "bottoming out"
        this.playTone(600, 'sine', 0.05, 0.15); 
    }

    playError() {
        this.playTone(150, 'sawtooth', 0.2, 0.1);
    }

    playSlash() {
        if (!this.enabled || this.ctx.state === 'suspended') return;
        // White noise "Whoosh" (unchanged)
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        
        // Lowpass filter to make it sound "airy" not "static-y"
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    playGameOver() {
        if (!this.enabled) return;
        [300, 250, 200, 150].forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.2), i * 150);
        });
    }
}

export default new SoundManager();